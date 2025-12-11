# gmstacks 🟣🔷

Daily on-chain check-in dApp on Stacks blockchain. Build your daily streak, track consistency, and prove your commitment on Bitcoin's layer.

[![Testnet](https://img.shields.io/badge/Testnet-Deployed-blue.svg)](https://explorer.hiro.so/address/ST1E00WKNW3PY8N3MB5F83AAT0QWWHVFK21ECQMA4.gmstacks?chain=testnet)
[![Clarity 4](https://img.shields.io/badge/Clarity-4-purple.svg)](https://docs.stacks.co/reference/clarity)
[![React + Stacks.js](https://img.shields.io/badge/Frontend-React%20%2B%20Stacks.js-brightgreen.svg)](https://docs.stacks.co/stacks.js)

## 🚀 Quick Start

### 1. Deploy Contracts (Local)
```
cd contracts
npm install
clarinet deployment generate --testnet --medium-cost
clarinet deployment apply -p deployments/default.testnet-plan.yaml
```

### 2. Run Frontend
```
cd frontend
npm install
npm run dev
```

### 3. Configuration
Update `frontend/src/stacksConfig.ts` with your deployed contract ID:
```
export const CONTRACT_ADDRESS = 'ST1E00WKNW3PY8N3MB5F83AAT0QWWHVFK21ECQMA4';
export const CONTRACT_NAME = 'gmstacks';
```

## 📁 Project Structure
```
gmstacks/
│   ├─ settings.json
│   └─ tasks.json
├─ Clarinet.toml
├─ contracts/
│   └─ gmstacks.clar
├─ deployments/
├─ frontend/
│   ├─ App.tsx
│   ├─ components/
│   ├─ index.html
│   ├─ index.tsx
│   ├─ metadata.json
│   ├─ package.json
│   ├─ public/
│   ├─ stacksClient.ts
│   ├─ stacksConfig.ts
│   ├─ tsconfig.json
│   ├─ types.ts
│   └─ vite.config.ts
├─ package.json
├─ settings/
│   ├─ Devnet.toml
│   ├─ Mainnet.toml
│   └─ Testnet.toml
├─ tests/
│   └─ gmstacks.test.ts
├─ tsconfig.json
└─ vitest.config.ts
```

## ✨ Features

- ✅ **Daily Check-in** (24h cooldown)
- 🔥 **Streak Counter** (resets if skip >1 day)
- 📊 **On-chain Stats** (total + streak)
- ⏱️ **Real-time Countdown**
- 🎨 **Dark/Light Theme**
- 🔗 **Auto-connect** wallet after refresh
- 🧪 **Full Test Coverage**

## 🛠️ Tech Stack

- **Smart Contract**: Clarity 4 (`stacks-block-time`)
- **Frontend**: React 18 + Vite + TailwindCSS
- **Wallet**: Stacks Connect + Leather/Hiro Wallet
- **Testing**: Vitest + Clarinet
- **Deploy**: Vercel (frontend) + Clarinet (contracts)