#!/usr/bin/env ts-node
/**
 * MicroShield Oracle Crank
 *
 * Reads real-time flight delay data from AviationStack API and calls
 * `report_delay` on the MicroShield smart contract.
 *
 * Usage:
 *   export AVIATION_STACK_KEY=your_api_key
 *   export RPC_URL=https://api.devnet.solana.com
 *   export ORACLE_KEYPAIR_PATH=~/.config/solana/oracle.json
 *   export PROGRAM_ID=<your deployed program ID>
 *   ts-node scripts/oracle-crank.ts
 *
 * Or run in watch mode (polls every 5 minutes):
 *   ts-node scripts/oracle-crank.ts --watch
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// ─── Config ──────────────────────────────────────────────────────────────────

const AVIATION_STACK_KEY = process.env.AVIATION_STACK_KEY ?? "";
const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const ORACLE_KEYPAIR_PATH = process.env.ORACLE_KEYPAIR_PATH ?? path.join(process.env.HOME ?? "~", ".config/solana/oracle.json");
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID ?? "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
const WATCH_MODE = process.argv.includes("--watch");
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivePolicy {
  policy_id: number;
  holder: string;
  flight_number: string;
  delay_threshold_mins: number;
}

interface AviationStackFlight {
  flight_status: string;
  departure: {
    iata: string;
    delay: number | null;
    scheduled: string;
  };
  arrival: {
    iata: string;
    delay: number | null;
  };
  flight: {
    iata: string;
    number: string;
  };
}

// ─── PDA helpers ─────────────────────────────────────────────────────────────

function policyPda(holder: PublicKey, policyId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("policy"),
      holder.toBuffer(),
      new BN(policyId).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
}

function vaultPda(policyKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), policyKey.toBuffer()],
    PROGRAM_ID
  );
}

function statePda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("state")], PROGRAM_ID);
}

// ─── AviationStack API ───────────────────────────────────────────────────────

async function fetchFlightDelay(flightIata: string): Promise<number> {
  const url = `http://api.aviationstack.com/v1/flights?access_key=${AVIATION_STACK_KEY}&flight_iata=${encodeURIComponent(flightIata)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`AviationStack API error: ${res.status}`);

  const data = await res.json() as { data: AviationStackFlight[] };
  if (!data.data?.length) {
    console.log(`  [oracle] No flight data for ${flightIata}`);
    return 0;
  }

  const flight = data.data[0];
  // Use departure delay (could also include arrival delay for better accuracy)
  const delay = flight.departure?.delay ?? 0;
  console.log(
    `  [oracle] ${flightIata}: status=${flight.flight_status}, delay=${delay}min`
  );
  return delay;
}

// ─── Main crank loop ─────────────────────────────────────────────────────────

async function runCrank() {
  // Load oracle keypair
  const rawKey = JSON.parse(fs.readFileSync(ORACLE_KEYPAIR_PATH, "utf8"));
  const oracleKeypair = Keypair.fromSecretKey(Uint8Array.from(rawKey));
  console.log(`[oracle-crank] Oracle pubkey: ${oracleKeypair.publicKey.toBase58()}`);

  // Set up provider
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new anchor.Wallet(oracleKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Load program IDL from target/idl
  const idl = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../target/idl/microshield.json"),
      "utf8"
    )
  );
  const program = new anchor.Program(idl, PROGRAM_ID, provider) as Program<any>;

  const [stateKey] = statePda();

  while (true) {
    console.log(`\n[oracle-crank] ${new Date().toISOString()} — scanning active policies…`);

    try {
      // Fetch all Policy accounts from on-chain
      const policyAccounts = await program.account.policy.all([
        {
          memcmp: {
            offset: 8 + 32 + 16 + 8 + 8 + 4 + 8 + 8, // offset to `status` field
            bytes: anchor.utils.bytes.bs58.encode(Buffer.from([0])), // PolicyStatus::Active = 0
          },
        },
      ]);

      console.log(`[oracle-crank] Found ${policyAccounts.length} active policies`);

      for (const { publicKey: policyKey, account: policy } of policyAccounts) {
        const now = Math.floor(Date.now() / 1000);

        // Skip expired policies (they need expire_refund, not delay report)
        if (now >= policy.expiresAt.toNumber()) {
          console.log(`  [oracle] Policy #${policy.policyId}: expired, skipping`);
          continue;
        }

        // Decode flight number from [u8; 16]
        const rawBytes = policy.flightNumber as number[];
        const flightStr = Buffer.from(rawBytes)
          .toString("ascii")
          .replace(/\0/g, "")
          .trim();

        console.log(`  [oracle] Checking policy #${policy.policyId}: ${flightStr}`);

        // Fetch real delay from AviationStack
        let delayMins = 0;
        if (AVIATION_STACK_KEY) {
          try {
            delayMins = await fetchFlightDelay(flightStr.replace(" ", ""));
          } catch (e) {
            console.error(`  [oracle] Failed to fetch delay for ${flightStr}:`, e);
            continue;
          }
        } else {
          // Demo mode: simulate delay for testing without API key
          delayMins = Math.floor(Math.random() * 200);
          console.log(`  [oracle] DEMO MODE (no API key): simulated ${delayMins}min delay`);
        }

        // Get holder's USDC ATA for potential payout
        const state = await program.account.programState.fetch(stateKey);
        const holderUsdc = await getOrCreateAssociatedTokenAccount(
          connection,
          oracleKeypair,
          state.usdcMint,
          policy.holder
        );

        const [vaultKey] = vaultPda(policyKey);

        try {
          const tx = await program.methods
            .reportDelay(policy.policyId, delayMins)
            .accounts({
              state: stateKey,
              policy: policyKey,
              policyVault: vaultKey,
              holderUsdcAta: holderUsdc.address,
              usdcMint: state.usdcMint,
              oracle: oracleKeypair.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .signers([oracleKeypair])
            .rpc();

          if (delayMins >= policy.delayThresholdMins) {
            console.log(`  [oracle] ✓ PAYOUT SENT for policy #${policy.policyId}! Tx: ${tx}`);
          } else {
            console.log(`  [oracle] ✓ Delay updated: ${delayMins}min < ${policy.delayThresholdMins}min threshold. Tx: ${tx}`);
          }
        } catch (e: any) {
          console.error(`  [oracle] Failed to call report_delay for policy #${policy.policyId}:`, e.message);
        }
      }
    } catch (e: any) {
      console.error("[oracle-crank] Error during crank loop:", e.message);
    }

    if (!WATCH_MODE) break;

    console.log(`[oracle-crank] Sleeping ${POLL_INTERVAL_MS / 1000}s until next poll…`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

runCrank().catch((e) => {
  console.error("[oracle-crank] Fatal error:", e);
  process.exit(1);
});
