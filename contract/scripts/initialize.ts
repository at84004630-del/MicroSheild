#!/usr/bin/env ts-node
/**
 * MicroShield — Program Initializer
 *
 * Must be run ONCE after deployment to set the oracle authority and USDC mint
 * in the ProgramState PDA. Calling this a second time will fail (account already exists).
 *
 * Usage:
 *   export RPC_URL=https://api.devnet.solana.com
 *   export DEPLOYER_KEYPAIR_PATH=~/.config/solana/id.json
 *   export ORACLE_AUTHORITY=<oracle_wallet_pubkey>
 *   export USDC_MINT_ADDRESS=Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
 *   export PROGRAM_ID=<your_deployed_program_id>
 *   ts-node scripts/initialize.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import fs from "fs";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const RPC_URL            = process.env.RPC_URL            || "https://devnet.helius-rpc.com/?api-key=de18f83e-181c-4d38-883a-3471cbac0781";
const DEPLOYER_PATH      = process.env.DEPLOYER_KEYPAIR_PATH
  || path.join(process.env.HOME ?? "~", ".config/solana/id.json");
const ORACLE_AUTHORITY   = process.env.ORACLE_AUTHORITY   || "J9Y338RmQgq6Tpg6a3DNXC1mYJHHbacoLiRVBqftmDsk";
const USDC_MINT_ADDRESS  = process.env.USDC_MINT_ADDRESS  || "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
const PROGRAM_ID_STR     = process.env.PROGRAM_ID         || "AmA7WxBdyLCLrNPD3pjjwQx1f4jShve8oGJN4zKqTTQv";

// ─── Validation ───────────────────────────────────────────────────────────────

if (!ORACLE_AUTHORITY) {
  console.error("❌  ORACLE_AUTHORITY env var is required (pubkey of the oracle wallet)");
  console.error("    Example: export ORACLE_AUTHORITY=$(solana-keygen pubkey ~/.config/solana/oracle.json)");
  process.exit(1);
}

// ─── PDA helper ───────────────────────────────────────────────────────────────

function statePda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("state")], programId);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🛡️  MicroShield Initializer");
  console.log("─".repeat(50));

  // Load deployer keypair
  const rawKey = JSON.parse(fs.readFileSync(DEPLOYER_PATH, "utf8"));
  const deployer = Keypair.fromSecretKey(Uint8Array.from(rawKey));
  console.log(`✅  Deployer:         ${deployer.publicKey.toBase58()}`);

  // Parse addresses
  const programId      = new PublicKey(PROGRAM_ID_STR);
  const oracleAuthority = new PublicKey(ORACLE_AUTHORITY);
  const usdcMint       = new PublicKey(USDC_MINT_ADDRESS);
  console.log(`✅  Program ID:       ${programId.toBase58()}`);
  console.log(`✅  Oracle Authority: ${oracleAuthority.toBase58()}`);
  console.log(`✅  USDC Mint:        ${usdcMint.toBase58()}`);

  // Set up provider
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet     = new anchor.Wallet(deployer);
  const provider   = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Load IDL from build output
  const idlPath = path.join(__dirname, "../target/idl/microshield.json");
  if (!fs.existsSync(idlPath)) {
    console.error(`\n❌  IDL not found at ${idlPath}`);
    console.error("    Run 'anchor build' first to generate the IDL.");
    process.exit(1);
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  idl.address = programId.toBase58();
  const program = new anchor.Program(idl, provider) as any;

  // Check if already initialized
  const [stateKey, stateBump] = statePda(programId);
  console.log(`\n📍  ProgramState PDA: ${stateKey.toBase58()} (bump: ${stateBump})`);

  try {
    const existingState = await program.account.programState.fetch(stateKey);
    console.error("\n❌  Program is already initialized!");
    console.error(`    Authority:       ${existingState.authority.toBase58()}`);
    console.error(`    Oracle:          ${existingState.oracleAuthority.toBase58()}`);
    console.error(`    USDC Mint:       ${existingState.usdcMint.toBase58()}`);
    console.error(`    Total Policies:  ${existingState.totalPolicies.toString()}`);
    console.error("\n    If you need to re-initialize, deploy a new program instance.");
    process.exit(1);
  } catch (e: any) {
    if (!e.message?.includes("Account does not exist")) {
      throw e;
    }
    // Account doesn't exist — good, proceed with initialization
  }

  console.log("\n🚀  Calling initialize()...");

  const tx = await program.methods
    .initialize(oracleAuthority)
    .accounts({
      state:         stateKey,
      usdcMint:      usdcMint,
      authority:     deployer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([deployer])
    .rpc();

  console.log(`\n✅  Initialized successfully!`);
  console.log(`    Transaction: ${tx}`);
  console.log(`    Explorer:    https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  // Verify by fetching the state
  const state = await program.account.programState.fetch(stateKey);
  console.log("\n📊  ProgramState:");
  console.log(`    authority:          ${state.authority.toBase58()}`);
  console.log(`    oracle_authority:   ${state.oracleAuthority.toBase58()}`);
  console.log(`    usdc_mint:          ${state.usdcMint.toBase58()}`);
  console.log(`    total_policies:     ${state.totalPolicies.toString()}`);
  console.log(`    total_payouts_usdc: ${state.totalPayoutsUsdc.toString()}`);
  console.log(`    bump:               ${state.bump}`);

  console.log("\n✨  MicroShield is ready to accept policies!");
  console.log("    Next step: Run the oracle crank with 'npx ts-node scripts/oracle-crank.ts --watch'");
}

main().catch((e) => {
  console.error("\n❌  Fatal error:", e);
  process.exit(1);
});
