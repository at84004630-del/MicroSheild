/**
 * MicroShield — Anchor Program Factory & PDA Helpers
 *
 * Creates a typed program client using @coral-xyz/anchor + @solana/wallet-adapter.
 */

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { IDL, PROGRAM_ID } from "./idl";

// ─── Network config ───────────────────────────────────────────────────────────

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet");

export const PROGRAM_PUBLIC_KEY = new PublicKey(PROGRAM_ID);

// ─── Program factory ──────────────────────────────────────────────────────────

/**
 * Creates an Anchor Program instance from a wallet adapter wallet.
 * Safe to call client-side only (uses window.solana).
 */
export function getMicroshieldProgram(wallet: AnchorProvider["wallet"]) {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(IDL as any, provider);
}

/**
 * Returns a read-only Connection for fetching on-chain data without a signer.
 */
export function getConnection() {
  return new Connection(RPC_ENDPOINT, "confirmed");
}

// ─── PDA derivation helpers ───────────────────────────────────────────────────

export function statePda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    PROGRAM_PUBLIC_KEY
  );
}

export function policyPda(
  holder: PublicKey,
  policyId: number | bigint | BN
): [PublicKey, number] {
  const id = typeof policyId === "bigint" ? policyId : BigInt(policyId.toString());
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  view.setBigUint64(0, id, true);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), holder.toBuffer(), buf],
    PROGRAM_PUBLIC_KEY
  );
}

export function vaultPda(policyKey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), policyKey.toBuffer()],
    PROGRAM_PUBLIC_KEY
  );
}

// ─── BN helpers ───────────────────────────────────────────────────────────────

export function toBN(n: number | bigint): BN {
  return new BN(n.toString());
}
