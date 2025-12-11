# gmstacks Contracts 🧪

Clarity 4 smart contracts for daily check-in dApp. Deployed on testnet:
`ST1E00WKNW3PY8N3MB5F83AAT0QWWHVFK21ECQMA4.gmstacks`

## Features

- `checkin()`: Daily check-in (24h cooldown)
- Streak logic: +1 if <48h, reset if ≥48h
- `get-my-checkin()`: User data (`tx-sender`)
- `get-user-checkin(principal)`: Other user data
- Clarity 4: `stacks-block-time` keyword

## Quick Deploy

```
npm install
clarinet deployment generate --testnet --medium-cost
clarinet deployment apply -p deployments/default.testnet-plan.yaml
```

## Test

```
npm test
```

**4/4 tests passed** ✅

## Data Structure

```
(map-entry principal {
last-time: uint, ;; last stacks-block-time
last-day: uint, ;; / 86400
total: uint, ;; total check-ins
streak: uint ;; current streak
})
```

## Clarinet.toml

```
[contracts.gmstacks]
path = "contracts/gmstacks.clar"
clarity_version = 4
```

⚠️ **Keep `settings/Testnet.toml` secure** (contains mnemonic)!