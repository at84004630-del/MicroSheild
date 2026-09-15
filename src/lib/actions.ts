/**
 * MicroShield — On-Chain Actions
 *
 * All write operations to the smart contract live here.
 * Each action returns the transaction signature on success.
 */

import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
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

// ─── claimDevnetUsdcAction ────────────────────────────────────────────────────

/**
 * Directly claims Devnet USDC from the official SPL token faucet smart contract.
 * Does not hit public Solana SOL airdrop rate limits (429).
 */
export async function claimDevnetUsdcAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any,
  amountUsdc = 100
): Promise<string> {
  const FAUCET_PROGRAM_ID = new PublicKey("4sN8PnN2ki2W4TFXAfzR645FWs8nimmsYeNtxM8RBK6A");
  const usdcMint = new PublicKey(DEVNET_USDC_MINT);
  const receiver = wallet.publicKey as PublicKey;
  const destinationAta = await getAssociatedTokenAddress(usdcMint, receiver);

  const program = getMicroshieldProgram(wallet);

  // Check SOL balance first — Solana requires gas (SOL) to sign txs & create token accounts
  const solBalance = await program.provider.connection.getBalance(receiver);
  if (solBalance < 0.005 * LAMPORTS_PER_SOL) {
    // Try requesting a devnet airdrop silently first if supported
    try {
      const airdropSig = await program.provider.connection.requestAirdrop(
        receiver,
        1 * LAMPORTS_PER_SOL
      );
      const latestBlock = await program.provider.connection.getLatestBlockhash();
      await program.provider.connection.confirmTransaction({
        blockhash: latestBlock.blockhash,
        lastValidBlockHeight: latestBlock.lastValidBlockHeight,
        signature: airdropSig,
      });
    } catch {
      // If airdrop failed and user has 0 SOL, throw an explicit, actionable error
      if (solBalance === 0) {
        throw new Error(
          "Your wallet has 0 Devnet SOL. You need a small amount of Devnet SOL to pay transaction fees and create your USDC account. Please get free Devnet SOL from https://faucet.solana.com first."
        );
      }
    }
  }

  const destinationInfo = await program.provider.connection.getAccountInfo(destinationAta);

  const preInstructions = [];
  if (!destinationInfo) {
    preInstructions.push(
      createAssociatedTokenAccountInstruction(receiver, destinationAta, receiver, usdcMint)
    );
  }

  // Anchor instruction layout: 8-byte discriminator + 1-byte bump + 8-byte u64 amount
  const disc = Buffer.from([113, 173, 36, 238, 38, 152, 22, 117]);
  const bump = Buffer.from([255]);
  const amountBuf = new BN(amountUsdc * USDC_DECIMALS).toArrayLike(Buffer, "le", 8);
  const data = Buffer.concat([disc, bump, amountBuf]);

  const ix = new TransactionInstruction({
    programId: FAUCET_PROGRAM_ID,
    keys: [
      { pubkey: usdcMint, isSigner: false, isWritable: true },
      { pubkey: destinationAta, isSigner: false, isWritable: true },
      { pubkey: receiver, isSigner: true, isWritable: true },
      { pubkey: receiver, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction();
  preInstructions.forEach((instr) => tx.add(instr));
  tx.add(ix);

  const sig = await program.provider.sendAndConfirm!(tx);
  return sig;
}

