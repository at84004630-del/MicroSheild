#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# MicroShield — Devnet Deploy Script (run in WSL / Linux)
#
# Usage:
#   chmod +x deploy-devnet.sh
#   ./deploy-devnet.sh
#
# Prerequisites (run once in WSL):
#   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
#   sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
#   cargo install --git https://github.com/coral-xyz/anchor avm --locked
#   avm install 0.30.1 && avm use 0.30.1
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$SCRIPT_DIR/contract"

echo ""
echo "🛡️  MicroShield — Devnet Deployment"
echo "$(printf '─%.0s' {1..55})"

# ── 1. Switch to devnet ───────────────────────────────────────────────────────
echo ""
echo "1️⃣  Setting Solana CLI to devnet…"
solana config set --url https://api.devnet.solana.com

# ── 2. Check wallet balance ───────────────────────────────────────────────────
echo ""
echo "2️⃣  Checking deployer wallet balance…"
BALANCE=$(solana balance --output json-compact | jq -r '.[] | select(.lamports) | .lamports' 2>/dev/null || solana balance)
echo "    $BALANCE"
echo "    ⚠️  You need at least 2 SOL for deployment. Get devnet SOL:"
echo "    solana airdrop 2 && solana airdrop 2"

# ── 3. Build the program ──────────────────────────────────────────────────────
echo ""
echo "3️⃣  Building Anchor program…"
cd "$CONTRACT_DIR"
anchor build

# ── 4. Get the Program ID from keypair ───────────────────────────────────────
echo ""
echo "4️⃣  Reading Program ID from keypair…"
PROGRAM_ID=$(solana-keygen pubkey target/deploy/microshield-keypair.json)
echo "    ✅  Program ID: $PROGRAM_ID"

# ── 5. Deploy to devnet ───────────────────────────────────────────────────────
echo ""
echo "5️⃣  Deploying to devnet…"
anchor deploy --provider.cluster devnet

echo ""
echo "✅  Deployment complete!"
echo ""
echo "   Program ID: $PROGRAM_ID"
echo "   Explorer:   https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "────────────────────────────────────────────────────────────────────────────"
echo "📋  NEXT STEPS (copy-paste these commands):"
echo ""
echo "   # 1. Update Program ID in frontend:"
echo "   #    In microshield/src/lib/idl.ts, set:"
echo "   #    export const PROGRAM_ID = \"$PROGRAM_ID\";"
echo ""
echo "   # 2. Update Anchor.toml programs.devnet:"
echo "   #    microshield = \"$PROGRAM_ID\""
echo ""
echo "   # 3. Run initialize script (sets oracle authority + USDC mint):"
echo "   export RPC_URL=https://api.devnet.solana.com"
echo "   export DEPLOYER_KEYPAIR_PATH=~/.config/solana/id.json"
echo "   export ORACLE_AUTHORITY=\$(solana-keygen pubkey ~/.config/solana/id.json)"
echo "   export USDC_MINT_ADDRESS=Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
echo "   export PROGRAM_ID=$PROGRAM_ID"
echo "   cd contract && npx ts-node scripts/initialize.ts"
echo ""
echo "   # 4. Run oracle crank in demo mode (no AviationStack key needed):"
echo "   export PROGRAM_ID=$PROGRAM_ID"
echo "   cd contract && npx ts-node scripts/oracle-crank.ts --watch"
echo ""
echo "   # 5. Update .env.local:"
echo "   echo \"NEXT_PUBLIC_PROGRAM_ID=$PROGRAM_ID\" >> microshield/.env.local"
echo "────────────────────────────────────────────────────────────────────────────"
