/**
 * MicroShield — On-Chain Actions
 *
 * All write operations to the smart contract live here.
 * Each action returns the transaction signature on success.
 */

import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import {
  getMicroshieldProgram,
  statePda,
  policyPda,
  vaultPda,
  toBN,
} from "./program";
import { DEVNET_USDC_MINT, USDC_DECIMALS } from "./idl";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuyPolicyParams {
  /** Anchor wallet (from useAnchorWallet()) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any;
  /** IATA flight code e.g. "AI 131" */
  flightNumber: string;
  /** 0 = Basic, 1 = Standard, 2 = Premium */
  premiumTier: 0 | 1 | 2;
  /** Minutes: 60 | 120 | 180 | 300 */
  delayThresholdMins: 60 | 120 | 180 | 300;
}

export interface PolicyOnChain {
  policyId: number;
  holder: string;
  flightNumber: string;
  premium: number;        // in USDC (not micro)
  maxPayout: number;      // in USDC (not micro)
  delayThresholdMins: number;
  createdAt: number;      // unix timestamp
  expiresAt: number;      // unix timestamp
  status: "active" | "payoutSent" | "refunded";
  delayMinutesReported: number;
  publicKey: string;      // policy PDA address
}

// ─── buyPolicy action ─────────────────────────────────────────────────────────

/**
 * Calls `buy_policy` on-chain. Transfers premium USDC from holder's ATA
 * into the escrow vault PDA.
 *
 * @returns transaction signature
 * @throws if wallet is not connected or tx fails
 */
export async function buyPolicyAction({
  wallet,
  flightNumber,
  premiumTier,
  delayThresholdMins,
}: BuyPolicyParams): Promise<string> {
  const program = getMicroshieldProgram(wallet);
  const holder = wallet.publicKey as PublicKey;

  // Fetch current state to get policy counter + USDC mint
  const [stateKey] = statePda();
  let stateAccount;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stateAccount = await (program.account as any).programState.fetch(stateKey);
  } catch {
    throw new Error(
      "MicroShield program not yet initialized on this network. Please contact the team."
    );
  }

  const usdcMint = new PublicKey(stateAccount.usdcMint ?? DEVNET_USDC_MINT);
  const policyId = stateAccount.totalPolicies as BN;

  // Derive policy + vault PDAs
  const [policyKey] = policyPda(holder, BigInt(policyId.toString()));
  const [vaultKey] = vaultPda(policyKey);

  // Get or create holder's USDC ATA
  const holderUsdc = await getAssociatedTokenAddress(usdcMint, holder);
  const holderUsdcInfo = await program.provider.connection.getAccountInfo(holderUsdc);

  const preInstructions = [];
  if (!holderUsdcInfo) {
    preInstructions.push(
      createAssociatedTokenAccountInstruction(holder, holderUsdc, holder, usdcMint)
    );
  }

  // Call buy_policy
  const tx = await (program.methods as any)
    .buyPolicy(flightNumber, premiumTier, delayThresholdMins)
    .accounts({
      state: stateKey,
      policy: policyKey,
      policyVault: vaultKey,
      holderUsdcAta: holderUsdc,
      usdcMint,
      holder,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .preInstructions(preInstructions)
    .rpc();

  return tx;
}

// ─── fetchUserPolicies ────────────────────────────────────────────────────────

/**
 * Fetches all Policy accounts owned by `holder`.
 * Uses `memcmp` filter on the holder field (offset 8 bytes for discriminator).
 */
export async function fetchUserPolicies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any,
  holder: PublicKey
): Promise<PolicyOnChain[]> {
  const program = getMicroshieldProgram(wallet);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = await (program.account as any).policy.all([
    {
      memcmp: {
        offset: 8, // discriminator is 8 bytes
        bytes: holder.toBase58(),
      },
    },
  ]);

  return accounts.map(
    ({ publicKey, account }: { publicKey: PublicKey; account: any }) => {
      // Decode flight number from [u8; 16]
      const raw: number[] = account.flightNumber;
      const flightStr = Buffer.from(raw)
        .toString("ascii")
        .replace(/\0/g, "")
        .trim();

      // Determine status string
      let status: PolicyOnChain["status"] = "active";
      if (account.status.payoutSent !== undefined) status = "payoutSent";
      else if (account.status.refunded !== undefined) status = "refunded";

      return {
        policyId: (account.policyId as BN).toNumber(),
        holder: (account.holder as PublicKey).toBase58(),
        flightNumber: flightStr,
        premium: (account.premium as BN).toNumber() / USDC_DECIMALS,
        maxPayout: (account.maxPayout as BN).toNumber() / USDC_DECIMALS,
        delayThresholdMins: account.delayThresholdMins as number,
        createdAt: (account.createdAt as BN).toNumber(),
        expiresAt: (account.expiresAt as BN).toNumber(),
        status,
        delayMinutesReported: account.delayMinutesReported as number,
        publicKey: publicKey.toBase58(),
      } satisfies PolicyOnChain;
    }
  );
}

// ─── expireRefundAction ───────────────────────────────────────────────────────

/**
 * Calls `expire_refund` on-chain for a policy that has passed its expiry
 * without a payout. Returns the USDC premium to the holder.
 * Callable by anyone (permissionless crank), but refund always goes to holder.
 *
 * @returns transaction signature
 */
export async function expireRefundAction({
  wallet,
  policyPublicKey,
  policyId,
  holder,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any;
  policyPublicKey: string;
  policyId: number;
  holder: string;
}): Promise<string> {
  const program = getMicroshieldProgram(wallet);
  const [stateKey] = statePda();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateAccount = await (program.account as any).programState.fetch(stateKey);
  const usdcMint = new PublicKey(stateAccount.usdcMint ?? DEVNET_USDC_MINT);

  const policyKey  = new PublicKey(policyPublicKey);
  const [vaultKey] = vaultPda(policyKey);
  const holderKey  = new PublicKey(holder);
  const holderUsdc = await getAssociatedTokenAddress(usdcMint, holderKey);
  // payer = the connected wallet (pays tx fee; can be anyone — permissionless crank)
  const payerKey   = wallet.publicKey as PublicKey;

  const tx = await (program.methods as any)
    .expireRefund(new BN(policyId))
    .accounts({
      state:         stateKey,
      policy:        policyKey,
      policyVault:   vaultKey,
      holderUsdcAta: holderUsdc,
      usdcMint,
      // holder is UncheckedAccount (no signer) — Rust validates via policy constraint
      holder:        holderKey,
      // payer is Signer — the connected wallet pays the tx fee
      payer:         payerKey,
      tokenProgram:  TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}

// ─── closePolicyAction ───────────────────────────────────────────────────────

/**
 * Calls `close_policy` on-chain for a settled policy (PayoutSent or Refunded).
 * Closes both the Policy PDA and its empty vault token account.
 * Reclaims rent lamports to the holder's wallet.
 *
 * Only callable by the holder (requires their signature).
 * @returns transaction signature
 */
export async function closePolicyAction({
  wallet,
  policyPublicKey,
  policyId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any;
  policyPublicKey: string;
  policyId: number;
}): Promise<string> {
  const program = getMicroshieldProgram(wallet);
  const [stateKey] = statePda();
  const holder = wallet.publicKey as PublicKey;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateAccount = await (program.account as any).programState.fetch(stateKey);
  const usdcMint = new PublicKey(stateAccount.usdcMint ?? DEVNET_USDC_MINT);

  const policyKey  = new PublicKey(policyPublicKey);
  const [vaultKey] = vaultPda(policyKey);

  const tx = await (program.methods as any)
    .closePolicy(new BN(policyId))
    .accounts({
      state:       stateKey,
      policy:      policyKey,
      policyVault: vaultKey,
      usdcMint,
      holder,
      tokenProgram:  TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ─── fetchProgramStats ────────────────────────────────────────────────────────

export interface ProgramStats {
  totalPolicies: number;
  totalPayoutsUsdc: number;
}

export async function fetchProgramStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any
): Promise<ProgramStats | null> {
  try {
    const program = getMicroshieldProgram(wallet);
    const [stateKey] = statePda();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = await (program.account as any).programState.fetch(stateKey);
    return {
      totalPolicies: (state.totalPolicies as BN).toNumber(),
      totalPayoutsUsdc: (state.totalPayoutsUsdc as BN).toNumber() / USDC_DECIMALS,
    };
  } catch {
    return null;
  }
}
