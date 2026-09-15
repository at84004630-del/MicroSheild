#!/bin/bash
# install-solana-from-windows.sh
# Run this inside WSL after the .tar.bz2 is downloaded by PowerShell to %TEMP%
# The Windows TEMP maps to /mnt/c/Users/ABHINAV TRIPATHI/AppData/Local/Temp/ in WSL

set -e

ARCHIVE="/mnt/c/Users/ABHINAV TRIPATHI/AppData/Local/Temp/solana-release.tar.bz2"
INSTALL_DIR="$HOME/.local/share/solana/install/active_release"

echo "==> Checking archive..."
ls -lh "$ARCHIVE"

echo "==> Extracting Solana CLI..."
mkdir -p "$INSTALL_DIR"
tar -xjf "$ARCHIVE" -C "$INSTALL_DIR" --strip-components=1

echo "==> Setting up PATH in .profile..."
EXPORT_LINE='export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"'
grep -qxF "$EXPORT_LINE" ~/.bashrc || echo "$EXPORT_LINE" >> ~/.bashrc

echo "==> Sourcing profile..."
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"

echo "==> Verifying..."
solana --version
anchor --version 2>/dev/null || echo "Anchor not yet installed"

echo "==> Setting Solana to devnet..."
solana config set --url devnet

echo ""
echo "✅ Done! Solana CLI installed."
echo "   Run next: cd /mnt/c/Users/ABHINAV\\ TRIPATHI/OneDrive/Desktop/abhinav\\ project/microshield/contract"
echo "   Then:     anchor build"
