// stacksClient.ts
import { connect, disconnect, getLocalStorage, request } from '@stacks/connect';
import { Cl, fetchCallReadOnlyFunction } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK } from './stacksConfig';
import type { TransactionResult } from '@stacks/connect/dist/types/methods';

// --- Wallet helpers ---

function getStxAddressFromStorage(): string {
  const data = getLocalStorage();
  const stxArray = data?.addresses?.stx;
  const stxAddress = Array.isArray(stxArray) ? stxArray[0]?.address : undefined;
  if (!stxAddress) throw new Error('No STX address found in wallet local storage');
  return stxAddress;
}

export async function connectWalletStacks(): Promise<string> {
  await connect({ forceWalletSelect: true });
  return getStxAddressFromStorage();
}

export function disconnectWalletStacks() {
  disconnect();
}

// --- Read-only call: get-user-checkin ---

export async function fetchUserCheckin(
  stxAddress: string
): Promise<{ lastTime: number | null; total: number }> {
  console.log('DEBUG readOnly params', {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
  });

  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS, // hanya ST...
    contractName: CONTRACT_NAME,       // hanya "daily-checkin"
    functionName: 'get-user-checkin',
    functionArgs: [Cl.principal(stxAddress)],
    network: NETWORK,
    senderAddress: stxAddress,
  });

  const cv: any = result;

  if (cv.type === 0x09) {
    return { lastTime: null, total: 0 };
  }

  const someVal = cv.value;
  const tuple = someVal.value as Record<string, any>;

  const last = tuple['last-time'];
  const total = tuple['total'];

  const lastTime = typeof last?.value === 'bigint' ? Number(last.value) : null;
  const totalNum = typeof total?.value === 'bigint' ? Number(total.value) : 0;

  return { lastTime, total: totalNum };
}

// --- Write call: checkin ---

export async function callCheckin(): Promise<TransactionResult> {
  const tx = await request(
    { forceWalletSelect: true },
    'stx_callContract',
    {
      contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`, // format: ST...name
      functionName: 'checkin',
      functionArgs: [],
      network: 'testnet',
      postConditions: [],
      postConditionMode: 'allow',
      sponsored: false,
    }
  );

  return tx;
}
