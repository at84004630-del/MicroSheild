# MicroShield — Parametric Flight Insurance on Solana

**Instant, trustless micro-insurance for flight delays. Buy coverage for $1–5 USDC. If your flight delays 3+ hours, USDC lands in your wallet automatically — no claims, no forms, no waiting.**

🏆 **Built for the [Colosseum Eternal Hackathon](https://earn.superteam.fun/listings/hackathon/colosseum-eternal-hackathon/)**

🌐 **Live Demo (Devnet)**: [https://micro-sheild-test.vercel.app/](https://micro-sheild-test.vercel.app/)  
> *Note: The Vercel deployment subdomain retains an initial deployment typo (`micro-sheild-test`), while all source repositories and branding use the official name `MicroShield`.*  
📜 **Solana Program ID**: [`AmA7WxBdyLCLrNPD3pjjwQx1f4jShve8oGJN4zKqTTQv`](https://explorer.solana.com/address/AmA7WxBdyLCLrNPD3pjjwQx1f4jShve8oGJN4zKqTTQv?cluster=devnet)  
🪙 **USDC Mint (Devnet)**: [`Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`](https://explorer.solana.com/address/Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr?cluster=devnet)  
💻 **GitHub Repository**: [https://github.com/at84004630-del/MicroShield](https://github.com/at84004630-del/MicroShield)

---

## What is MicroShield?

MicroShield is a **parametric insurance protocol** on Solana. It uses:

- **Anchor smart contracts** to hold premiums in a PDA escrow vault and auto-execute payouts
- **Switchboard Oracle** to fetch real-world flight delay data on-chain from AviationStack API
- **USDC (SPL token)** as the settlement currency
- **Next.js + Phantom wallet** for the frontend

When the oracle reports a delay ≥ your chosen threshold, the smart contract automatically transfers your max payout to your wallet. Zero human involvement. No claim forms.

---

## Architecture

```
Frontend (Next.js)
  ├── src/components/       — UI components
  ├── src/lib/
  │   ├── idl.ts            — Anchor IDL (hand-crafted, replace post-deploy)
  │   ├── program.ts        — AnchorProvider factory + PDA helpers
  │   └── actions.ts        — On-chain write actions + data fetchers
  └── src/context/          — Solana wallet adapter providers

Smart Contract (Anchor/Rust)
  └── contract/programs/microshield/src/
      ├── lib.rs            — Program entry point (instruction routing)
      ├── state.rs          — ProgramState, Policy, PolicyStatus accounts
      ├── errors.rs         — Custom error codes
      └── instructions/
          ├── initialize.rs  — One-time program setup
          ├── buy_policy.rs  — Purchase insurance, lock USDC in vault
          ├── report_delay.rs— Oracle reports delay, auto-triggers payout
          ├── expire_refund.rs— Refund premium after policy expiry
          └── close_policy.rs— Close settled policy, reclaim rent
```

---

## Coverage Tiers

| Tier     | Premium | Max Payout | Delay Threshold Options |
|----------|---------|------------|------------------------|
| Basic    | 1 USDC  | 5 USDC     | 1h / 2h / 3h / 5h      |
| Standard | 2 USDC  | 10 USDC    | 1h / 2h / 3h / 5h      |
| Premium  | 5 USDC  | 25 USDC    | 1h / 2h / 3h / 5h      |

---

## Getting Started

### Frontend (Next.js)

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.local.example .env.local

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Environment variables** (`.env.local`):
```
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
# NEXT_PUBLIC_PROGRAM_ID=<your deployed program ID>
```

### Smart Contract (Anchor)

Prerequisites: Rust, Solana CLI, Anchor CLI, WSL (on Windows — see `install-solana-wsl.sh`)

```bash
cd contract

# Build the program
anchor build

# Get the generated program ID
anchor keys list

# Update program ID in:
#   - contract/programs/microshield/src/lib.rs (declare_id!)
#   - contract/Anchor.toml ([programs.devnet])
#   - src/lib/idl.ts (PROGRAM_ID export)

# Run tests (requires local validator)
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

After deployment, run the initialize script:
```bash
cd contract
npx ts-node scripts/initialize.ts
```

---

## Smart Contract Instructions

| Instruction    | Description |
|---------------|-------------|
| `initialize`   | One-time setup: set oracle authority + USDC mint |
| `buy_policy`   | Purchase a policy, lock premium USDC in PDA vault |
| `report_delay` | Oracle-only: report flight delay, auto-trigger payout if ≥ threshold |
| `expire_refund`| Permissionless: refund premium after 48h policy expiry |
| `close_policy` | Holder-only: close settled policy PDA, reclaim SOL rent |

---

## Policy Lifecycle

```
                   buy_policy()
                       │
                       ▼
                 ┌─────────────┐
                 │   Active    │ ◄── Oracle checks delay
                 └─────┬───────┘
                       │
           ┌───────────┴───────────┐
           │                       │
     delay ≥ threshold        expires_at passed
     report_delay()           expire_refund()
           │                       │
           ▼                       ▼
    ┌────────────┐         ┌──────────────┐
    │ PayoutSent │         │  Refunded    │
    └─────┬──────┘         └──────┬───────┘
          │                       │
          └──────────┬────────────┘
                     │
               close_policy()
                     │
                     ▼
           Account closed, rent
           reclaimed to holder
```

---

## Tech Stack

- **Blockchain**: Solana (Devnet)
- **Smart Contracts**: Anchor Framework (Rust) — Program ID: `AmA7WxBdyLCLrNPD3pjjwQx1f4jShve8oGJN4zKqTTQv`
- **Oracle**: Multi-source Oracle Architecture
  - *Phase 1 (Current)*: Autonomous off-chain crank (`scripts/oracle-crank.ts`) validating against AviationStack API with trusted keypair reporting
  - *Phase 2 (Roadmap)*: Switchboard v3 On-Demand custom feed integration for fully trustless consensus
- **Flight Data**: AviationStack API
- **Token**: USDC (Circle SPL Token on Devnet: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`)
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Wallet**: Phantom, Solflare & 1-Click Devnet Demo Wallet (via @solana/wallet-adapter)

---

## License

MIT — All contract code is open source.
