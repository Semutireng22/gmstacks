// stacksClient.ts
import { connect, disconnect, getLocalStorage, request, isConnected } from '@stacks/connect';
import { Cl, fetchCallReadOnlyFunction, ClarityType } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK } from './stacksConfig';
import type { TransactionResult } from '@stacks/connect/dist/types/methods';

// Ambil STX address dari storage (tanpa pop-up)
export function getStoredStxAddress(): string | null {
  const data = getLocalStorage();
  const stxArray = data?.addresses?.stx;
  const stxAddress = Array.isArray(stxArray) ? stxArray[0]?.address : undefined;
  return stxAddress || null;
}

// Connect wallet (hanya kalau belum connected)
export async function connectWalletStacks(): Promise<string> {
  if (isConnected()) {
    const fromStorage = getStoredStxAddress();
    if (!fromStorage) {
      throw new Error('Wallet isConnected but no address in storage');
    }
    return fromStorage;
  }

  await connect({
    forceWalletSelect: false,
    enableLocalStorage: true,
  });

  const stxAddress = getStoredStxAddress();
  if (!stxAddress) {
    throw new Error('No STX address found after connect');
  }
  return stxAddress;
}

export function disconnectWalletStacks() {
  disconnect();
}

// Read-only: get-user-checkin(user)
// (optional (tuple (last-time uint) (last-day uint) (total uint) (streak uint)))
export async function fetchUserCheckin(
  stxAddress: string
): Promise<{ lastTime: number | null; total: number; streak: number }> {
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'get-user-checkin',
    functionArgs: [Cl.principal(stxAddress)],
    network: NETWORK,
    senderAddress: stxAddress,
  });

  const cv: any = result;

  if (cv.type === ClarityType.OptionalNone) {
    return { lastTime: null, total: 0, streak: 0 };
  }

  const someVal = cv.value;
  const tuple = someVal.value as Record<string, any>;

  const last = tuple['last-time'];
  const total = tuple['total'];
  const streak = tuple['streak'];

  const lastTime = typeof last?.value === 'bigint' ? Number(last.value) : null;
  const totalNum = typeof total?.value === 'bigint' ? Number(total.value) : 0;
  const streakNum = typeof streak?.value === 'bigint' ? Number(streak.value) : 0;

  return { lastTime, total: totalNum, streak: streakNum };
}

// Call public function checkin (write tx)
// Jangan forceWalletSelect supaya pakai sesi wallet yang sudah ada
export async function callCheckin(): Promise<TransactionResult> {
  const tx = await request(
    { forceWalletSelect: false, enableLocalStorage: true },
    'stx_callContract',
    {
      contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
      functionName: 'checkin',
      functionArgs: [],
      network: 'testnet', // atau 'mainnet'
      postConditions: [],
      postConditionMode: 'allow',
      sponsored: false,
    }
  );

  return tx;
}
