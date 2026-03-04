# Arc Escrow Testnet

Base project with a Solidity escrow contract and a React dApp for Arc Testnet.

## Main files

- `contracts/EscrowPayments.sol`
- `frontend/`

## Deploy contract in Remix

1. Open `https://remix.ethereum.org`.
2. Create `EscrowPayments.sol` and paste the content from `contracts/EscrowPayments.sol`.
3. Compile with `Solidity 0.8.20`.
4. Connect your wallet to Arc Testnet:
   - RPC: `https://rpc.testnet.arc.network`
   - Chain ID: `5042002`
   - Currency symbol: `USDC`
5. In the constructor, use:
   - `usdcToken`: `0x3600000000000000000000000000000000000000`
   - `initialOwner`: your wallet address
6. Deploy and confirm in MetaMask or Rabby.

## Manual contract test

1. Get testnet USDC from the Circle faucet.
2. Approve the escrow contract to spend your test USDC.
3. Call `createEscrow(recipient, amount, conditionHash)`.
4. As the recipient, call `submitProof(escrowId, conditionHash)`.
5. As the creator, test `manualRelease(escrowId)` during the review window.
6. If the creator does not act, wait for the review window and call `finalizeRelease(escrowId)` as the recipient.
7. If no proof was submitted before the timeout, test `refund(escrowId)`.

## Contract tests

Run the Hardhat test suite from the repository root:

```bash
npm install
npm test
```

Included coverage:

- escrow creation and stored state
- proof submission + delayed recipient release
- creator manual release after proof
- refund blocked after proof submission
- refund after timeout
- protection against emergency withdraw of locked USDC

## Frontend setup

Create `frontend/.env`:

```bash
VITE_ESCROW_CONTRACT_ADDRESS=0xYourNewEscrowContract
```

Optional override:

```bash
VITE_USDC_ADDRESS=0x3600000000000000000000000000000000000000
```

The frontend already defaults to Arc Testnet USDC at `0x3600000000000000000000000000000000000000`.

Run locally:

```bash
cd frontend
npm install
npm run dev
```

## Vercel deploy

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Create a new project in Vercel.
3. Set the project root directory to `frontend`.
4. Vercel should detect `Vite` automatically.
5. Confirm these settings:
   - Build command: `npm run build`
   - Output directory: `dist`
6. Add environment variables:
   - `VITE_ESCROW_CONTRACT_ADDRESS=0xYourNewEscrowContract`
   - `VITE_USDC_ADDRESS=0x3600000000000000000000000000000000000000`
7. Deploy.

This repo already includes `frontend/vercel.json` for SPA rewrites.

## Local validation completed

- `npm test` ran successfully in the repository root
- `npm install` ran successfully in `frontend/`
- `npm run build` ran successfully in `frontend/`
- local dev server responded on `http://localhost:5173`

## Security notes

- `submitProof` no longer releases funds immediately.
- `manualRelease` lets the creator accept the proof during the review window.
- `finalizeRelease` lets the recipient receive funds only after the review window expires.
- `refund` is permissionless after timeout, but only while no proof has been submitted.
- `emergencyWithdraw` only allows excess USDC beyond locked escrow balances.
- Before any production use, test with Foundry or Anvil and run additional security review tools like Slither.
