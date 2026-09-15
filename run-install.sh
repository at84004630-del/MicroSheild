#!/bin/bash
set -e

ARCHIVE="$HOME/solana-release.tar.bz2"
INSTALL_DIR="$HOME/.local/share/solana/install/active_release"

echo "==> [1/4] Extracting Solana CLI from $ARCHIVE..."
mkdir -p "$INSTALL_DIR"
tar -xjf "$ARCHIVE" -C "$INSTALL_DIR" --strip-components=1

echo "==> [2/4] Configuring PATH in ~/.bashrc and ~/.profile..."
EXPORT_LINE='export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"'
grep -qxF "$EXPORT_LINE" ~/.bashrc || echo "$EXPORT_LINE" >> ~/.bashrc
grep -qxF "$EXPORT_LINE" ~/.profile || echo "$EXPORT_LINE" >> ~/.profile

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"

echo "==> [3/4] Verifying Solana CLI..."
solana --version

echo "==> [4/4] Configuring Solana Devnet & Wallet..."
solana config set --url devnet

mkdir -p ~/.config/solana
if [ ! -f ~/.config/solana/id.json ]; then
    solana-keygen new --no-bip39-passphrase --outfile ~/.config/solana/id.json
fi

echo "Deployer Wallet Address:"
solana address

echo "Current Devnet Balance:"
solana balance

rm -f "$ARCHIVE"
echo "==> Solana setup completed successfully!"
