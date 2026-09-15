#!/bin/bash
set -e

export PATH="$HOME/.avm/bin:$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/contract"

export RPC_URL="https://devnet.helius-rpc.com/?api-key=de18f83e-181c-4d38-883a-3471cbac0781"
export DEPLOYER_KEYPAIR_PATH="$HOME/.config/solana/id.json"
export ORACLE_AUTHORITY="J9Y338RmQgq6Tpg6a3DNXC1mYJHHbacoLiRVBqftmDsk"
export USDC_MINT_ADDRESS="Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
export PROGRAM_ID="AmA7WxBdyLCLrNPD3pjjwQx1f4jShve8oGJN4zKqTTQv"

echo "==> Initializing MicroShield Program on Devnet..."
npx ts-node scripts/initialize.ts
