# MicroShield — Solana Anchor Smart Contract

Parametric flight micro-insurance on Solana. Users pay **1–5 USDC** to insure a flight. When the delay exceeds the threshold, an oracle automatically sends the payout to their wallet — no claims, no forms, no waiting.

## Architecture

```
User Wallet ──buy_policy()──► Policy PDA + Vault PDA (escrow USDC)
                                        │
Oracle Crank ──report_delay()──► if delay ≥ threshold:
                                        └──► Transfer USDC → Holder ATA
```

## Program Accounts

| Account | Seeds | Description |
|---|---|---|
| `ProgramState` | `[b"state"]` | Singleton: oracle authority, USDC mint, counters |
| `Policy` | `[b"policy", holder, policy_id]` | Per-policy: flight, premium, status, expiry |
| Vault | `[b"vault", policy]` | SPL token account (PDA) holding escrowed USDC |

## Instructions

| Instruction | Authority | Description |
|---|---|---|
| `initialize` | Deployer | One-time setup: set oracle + USDC mint |
| `buy_policy` | Holder (signer) | Pay premium, create policy + escrow vault |
| `report_delay` | Oracle authority | Update delay; auto-payout if threshold met |
| `expire_refund` | Anyone (permissionless) | Refund premium after policy expiry |
| `close_policy` | Holder (signer) | Close settled accounts, reclaim rent |

## Coverage Tiers

| Tier | Premium | Max Payout | Trigger Options |
|---|---|---|---|
| Basic | 1 USDC | 5 USDC | 1h / 2h / 3h / 5h delay |
| Standard | 2 USDC | 10 USDC | 1h / 2h / 3h / 5h delay |
| Premium | 5 USDC | 25 USDC | 1h / 2h / 3h / 5h delay |

---

## Setup & Build

### 1. Install Prerequisites

**On macOS/Linux:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup component add rustfmt clippy

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"

# Install Anchor via AVM
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1
avm use 0.30.1
```

**On Windows (WSL2 recommended):**
```bash
# Open WSL2 terminal, then follow the macOS/Linux steps above
# The contract directory is already in your project at ./contract/
```

### 2. Generate Solana Keypair

```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --url devnet
solana airdrop 2  # Get devnet SOL
```

### 3. Build the Program

```bash
cd contract
anchor build
```

### 4. Update Program ID

```bash
# Get the program ID from the generated keypair
anchor keys list

# Replace the placeholder ID in:
#   - programs/microshield/src/lib.rs  (declare_id! macro)
#   - Anchor.toml  ([programs.localnet] and [programs.devnet] sections)
```

### 5. Run Tests (local validator)

```bash
# Install JS deps first
yarn install   # or npm install

# Run full test suite against a local validator
anchor test
```

### 6. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet

# Initialize the program (one-time, run after deploy)
# Generate an oracle keypair first:
solana-keygen new --outfile ~/.config/solana/oracle.json

# Then call initialize via a small script or Anchor CLI
```

---

## Oracle Crank

The off-chain oracle crank reads AviationStack API and calls `report_delay` on-chain.

### Configure

```bash
cp .env.example .env
# Edit .env:
#   AVIATION_STACK_KEY=  (get free key at aviationstack.com)
#   RPC_URL=https://api.devnet.solana.com
#   ORACLE_KEYPAIR_PATH=~/.config/solana/oracle.json
#   PROGRAM_ID=<your deployed program ID>
```

### Run Once

```bash
npm run oracle
```

### Run in Watch Mode (polls every 5 minutes)

```bash
npm run oracle:watch
```

> **Note:** The oracle crank runs in **demo mode** (random delays) if `AVIATION_STACK_KEY` is not set — useful for local testing.

---

## File Structure

```
contract/
├── Anchor.toml                    ← Anchor workspace config
├── Cargo.toml                     ← Rust workspace
├── package.json                   ← JS test deps + npm scripts
├── tsconfig.json                  ← TypeScript config for tests/scripts
├── .env.example                   ← Oracle crank environment template
├── programs/
│   └── microshield/
│       ├── Cargo.toml             ← Program deps (anchor-lang, anchor-spl)
│       └── src/
│           ├── lib.rs             ← Program entry + instruction routing
│           ├── state.rs           ← Account structs + events
│           ├── errors.rs          ← Custom error codes
│           └── instructions/
│               ├── mod.rs
│               ├── initialize.rs
│               ├── buy_policy.rs
│               ├── report_delay.rs
│               ├── expire_refund.rs
│               └── close_policy.rs
├── scripts/
│   └── oracle-crank.ts            ← Off-chain oracle + AviationStack
└── tests/
    └── microshield.ts             ← Full integration test suite (9 tests)
```

---

## Security Notes

- The **escrow vault** is a PDA token account owned by the Policy PDA — not by the program authority. Only the Policy PDA can sign vault transfers.
- The **oracle authority** is a designated keypair. For production, replace with a Switchboard on-chain oracle feed for trustless price reporting.
- Policies **expire after 48 hours** — any unclaimed premium is refundable permissionlessly.
- All arithmetic uses **checked operations** (overflow protected).
- The program has no `withdraw` instruction — funds can only flow to the holder.

---

## Events (for off-chain indexing)

| Event | Fields | Emitted on |
|---|---|---|
| `PolicyCreated` | policy_id, holder, flight, premium, max_payout, threshold, expires_at | `buy_policy` |
| `DelayReported` | policy_id, delay_minutes, threshold, payout_triggered | `report_delay` |
| `PayoutSent` | policy_id, holder, amount_usdc | `report_delay` (when triggered) |
| `PremiumRefunded` | policy_id, holder, amount_usdc | `expire_refund` |

Subscribe to events with `program.addEventListener("payoutSent", ...)` in your frontend.
