import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Microshield } from "../target/types/microshield";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert } from "chai";

// ─── Helpers ────────────────────────────────────────────────────────────────

const USDC_DECIMALS = 6;
const USDC_FACTOR = 10 ** USDC_DECIMALS;

function usdcAmount(amount: number): BN {
  return new BN(amount * USDC_FACTOR);
}

/** Derive Policy PDA */
function policyPda(
  holder: PublicKey,
  policyId: BN,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("policy"),
      holder.toBuffer(),
      policyId.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

/** Derive Vault PDA (token account) */
function vaultPda(policyKey: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), policyKey.toBuffer()],
    programId
  );
}

/** Derive ProgramState PDA */
function statePda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("state")], programId);
}

/** Sleep helper */
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Test suite ─────────────────────────────────────────────────────────────

describe("microshield", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Microshield as Program<Microshield>;
  const programId = program.programId;

  // Keypairs
  const authority = provider.wallet as anchor.Wallet;
  const oracle = Keypair.generate();
  const holder = Keypair.generate();

  // Token state
  let usdcMint: PublicKey;
  let holderUsdc: PublicKey;

  // State PDA
  const [stateKey] = statePda(programId);

  // ── Before: fund accounts + create mock USDC mint ────────────────────────

  before(async () => {
    // Airdrop SOL to test wallets
    await Promise.all([
      provider.connection.requestAirdrop(oracle.publicKey, 2e9),
      provider.connection.requestAirdrop(holder.publicKey, 2e9),
    ]);
    await sleep(1000); // wait for finalization

    // Create a local mock USDC mint (authority = program deployer)
    usdcMint = await createMint(
      provider.connection,
      (authority as any).payer,
      authority.publicKey,
      null,
      USDC_DECIMALS
    );

    // Create holder's USDC ATA and mint 100 USDC for testing
    holderUsdc = await createAssociatedTokenAccount(
      provider.connection,
      (authority as any).payer,
      usdcMint,
      holder.publicKey
    );

    await mintTo(
      provider.connection,
      (authority as any).payer,
      usdcMint,
      holderUsdc,
      authority.publicKey,
      100 * USDC_FACTOR
    );

    console.log("  ✓ Test setup: USDC mint created, holder funded with 100 USDC");
    console.log("  • Oracle pubkey:", oracle.publicKey.toBase58());
    console.log("  • Holder pubkey:", holder.publicKey.toBase58());
    console.log("  • USDC mint:", usdcMint.toBase58());
  });

  // ── 1. Initialize ────────────────────────────────────────────────────────

  it("initializes the program state", async () => {
    await program.methods
      .initialize(oracle.publicKey)
      .accounts({
        state: stateKey,
        usdcMint,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const state = await program.account.programState.fetch(stateKey);
    assert.equal(state.authority.toBase58(), authority.publicKey.toBase58());
    assert.equal(state.oracleAuthority.toBase58(), oracle.publicKey.toBase58());
    assert.equal(state.usdcMint.toBase58(), usdcMint.toBase58());
    assert.equal(state.totalPolicies.toNumber(), 0);
    assert.equal(state.totalPayoutsUsdc.toNumber(), 0);

    console.log("  ✓ ProgramState initialized at:", stateKey.toBase58());
  });

  // ── 2. Buy Policy — Basic tier ───────────────────────────────────────────

  it("buys a Basic policy (1 USDC, 3h threshold)", async () => {
    const state = await program.account.programState.fetch(stateKey);
    const policyId = state.totalPolicies;

    const [policyKey] = policyPda(holder.publicKey, policyId, programId);
    const [vaultKey] = vaultPda(policyKey, programId);

    const balanceBefore = (await getAccount(provider.connection, holderUsdc)).amount;

    await program.methods
      .buyPolicy("AI 131", 0, 180) // Basic, 3h threshold
      .accounts({
        state: stateKey,
        policy: policyKey,
        policyVault: vaultKey,
        holderUsdcAta: holderUsdc,
        usdcMint,
        holder: holder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([holder])
      .rpc();

    const policy = await program.account.policy.fetch(policyKey);
    const vault = await getAccount(provider.connection, vaultKey);
    const balanceAfter = (await getAccount(provider.connection, holderUsdc)).amount;

    // Assertions
    assert.equal(policy.holder.toBase58(), holder.publicKey.toBase58());
    assert.equal(policy.premium.toNumber(), 1 * USDC_FACTOR);
    assert.equal(policy.maxPayout.toNumber(), 5 * USDC_FACTOR);
    assert.equal(policy.delayThresholdMins, 180);
    assert.deepEqual(policy.status, { active: {} }); // Anchor enum
    assert.equal(Number(vault.amount), 1 * USDC_FACTOR);
    assert.equal(Number(balanceBefore) - Number(balanceAfter), 1 * USDC_FACTOR);

    console.log("  ✓ Policy #0 created:", policyKey.toBase58());
    console.log("  • Vault holds 1 USDC:", vaultKey.toBase58());
  });

  // ── 3. Buy Policy — Standard tier ───────────────────────────────────────

  it("buys a Standard policy (2 USDC, 2h threshold)", async () => {
    const state = await program.account.programState.fetch(stateKey);
    const policyId = state.totalPolicies;

    const [policyKey] = policyPda(holder.publicKey, policyId, programId);
    const [vaultKey] = vaultPda(policyKey, programId);

    await program.methods
      .buyPolicy("6E 456", 1, 120) // Standard, 2h threshold
      .accounts({
        state: stateKey,
        policy: policyKey,
        policyVault: vaultKey,
        holderUsdcAta: holderUsdc,
        usdcMint,
        holder: holder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([holder])
      .rpc();

    const policy = await program.account.policy.fetch(policyKey);
    assert.equal(policy.premium.toNumber(), 2 * USDC_FACTOR);
    assert.equal(policy.maxPayout.toNumber(), 10 * USDC_FACTOR);
    console.log("  ✓ Policy #1 created (Standard, 10 USDC max payout)");
  });

  // ── 4. report_delay — below threshold (no payout) ───────────────────────

  it("reports a delay below threshold — no payout triggered", async () => {
    const policyId = new BN(0); // Policy #0 (AI 131, threshold=180)
    const [policyKey] = policyPda(holder.publicKey, policyId, programId);
    const [vaultKey] = vaultPda(policyKey, programId);

    const balanceBefore = (await getAccount(provider.connection, holderUsdc)).amount;

    await program.methods
      .reportDelay(policyId, 60) // 60 min < 180 min threshold
      .accounts({
        state: stateKey,
        policy: policyKey,
        policyVault: vaultKey,
        holderUsdcAta: holderUsdc,
        usdcMint,
        oracle: oracle.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([oracle])
      .rpc();

    const policy = await program.account.policy.fetch(policyKey);
    const balanceAfter = (await getAccount(provider.connection, holderUsdc)).amount;

    assert.equal(policy.delayMinutesReported, 60);
    assert.deepEqual(policy.status, { active: {} }); // still Active
    assert.equal(Number(balanceBefore), Number(balanceAfter)); // no payout

    console.log("  ✓ 60min delay reported — policy still Active, no payout");
  });

  // ── 5. report_delay — at threshold (payout triggered) ───────────────────

  it("reports delay at threshold — USDC payout auto-triggered", async () => {
    const policyId = new BN(0); // Policy #0 (AI 131, threshold=180min)
    const [policyKey] = policyPda(holder.publicKey, policyId, programId);
    const [vaultKey] = vaultPda(policyKey, programId);

    const balanceBefore = (await getAccount(provider.connection, holderUsdc)).amount;

    await program.methods
      .reportDelay(policyId, 185) // 185 min ≥ 180 min threshold → payout!
      .accounts({
        state: stateKey,
        policy: policyKey,
        policyVault: vaultKey,
        holderUsdcAta: holderUsdc,
        usdcMint,
        oracle: oracle.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([oracle])
      .rpc();

    const policy = await program.account.policy.fetch(policyKey);
    const vault = await getAccount(provider.connection, vaultKey);
    const balanceAfter = (await getAccount(provider.connection, holderUsdc)).amount;
    const stateAfter = await program.account.programState.fetch(stateKey);

    assert.deepEqual(policy.status, { payoutSent: {} });
    assert.equal(Number(vault.amount), 0); // vault drained
    assert.equal(
      Number(balanceAfter) - Number(balanceBefore),
      5 * USDC_FACTOR // received 5 USDC payout
    );
    assert.equal(stateAfter.totalPayoutsUsdc.toNumber(), 5 * USDC_FACTOR);

    console.log("  ✓ 185min delay → PAYOUT triggered! Holder received 5 USDC");
    console.log("  • Holder balance delta: +5 USDC");
    console.log("  • Vault balance: 0 USDC (drained)");
  });

  // ── 6. close_policy — after payout ──────────────────────────────────────

  it("closes policy #0 after payout, reclaims rent", async () => {
    const policyId = new BN(0);
    const [policyKey] = policyPda(holder.publicKey, policyId, programId);
    const [vaultKey] = vaultPda(policyKey, programId);

    const solBefore = await provider.connection.getBalance(holder.publicKey);

    await program.methods
      .closePolicy(policyId)
      .accounts({
        state: stateKey,
        policy: policyKey,
        policyVault: vaultKey,
        usdcMint,
        holder: holder.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([holder])
      .rpc();

    const solAfter = await provider.connection.getBalance(holder.publicKey);

    // Policy account should be gone
    const policyAccountInfo = await provider.connection.getAccountInfo(policyKey);
    assert.isNull(policyAccountInfo);

    // Holder should have reclaimed rent (minus tx fee)
    assert.isAbove(solAfter, solBefore - 5_000); // net positive after tx fee

    console.log("  ✓ Policy #0 closed. Rent reclaimed: ~" +
      ((solAfter - solBefore) / 1e9).toFixed(6) + " SOL (net of tx fee)");
  });

  // ── 7. Error: unauthorized oracle ───────────────────────────────────────

  it("rejects report_delay from non-oracle signer", async () => {
    const faker = Keypair.generate();
    await provider.connection.requestAirdrop(faker.publicKey, 1e9);
    await sleep(500);

    const policyId = new BN(1); // Policy #1 still Active
    const [policyKey] = policyPda(holder.publicKey, policyId, programId);
    const [vaultKey] = vaultPda(policyKey, programId);

    try {
      await program.methods
        .reportDelay(policyId, 200)
        .accounts({
          state: stateKey,
          policy: policyKey,
          policyVault: vaultKey,
          holderUsdcAta: holderUsdc,
          usdcMint,
          oracle: faker.publicKey, // Wrong oracle!
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([faker])
        .rpc();
      assert.fail("Should have thrown UnauthorizedOracle");
    } catch (e: any) {
      assert.include(e.message, "UnauthorizedOracle");
      console.log("  ✓ Correctly rejected unauthorized oracle");
    }
  });

  // ── 8. Error: invalid premium tier ──────────────────────────────────────

  it("rejects buy_policy with invalid premium tier", async () => {
    const state = await program.account.programState.fetch(stateKey);
    const policyId = state.totalPolicies;
    const [policyKey] = policyPda(holder.publicKey, policyId, programId);
    const [vaultKey] = vaultPda(policyKey, programId);

    try {
      await program.methods
        .buyPolicy("UK 995", 9, 180) // tier 9 is invalid
        .accounts({
          state: stateKey,
          policy: policyKey,
          policyVault: vaultKey,
          holderUsdcAta: holderUsdc,
          usdcMint,
          holder: holder.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([holder])
        .rpc();
      assert.fail("Should have thrown InvalidPremiumTier");
    } catch (e: any) {
      assert.include(e.message, "InvalidPremiumTier");
      console.log("  ✓ Correctly rejected invalid premium tier 9");
    }
  });

  // ── 9. Error: empty flight number ────────────────────────────────────────

  it("rejects buy_policy with empty flight number", async () => {
    const state = await program.account.programState.fetch(stateKey);
    const policyId = state.totalPolicies;
    const [policyKey] = policyPda(holder.publicKey, policyId, programId);
    const [vaultKey] = vaultPda(policyKey, programId);

    try {
      await program.methods
        .buyPolicy("", 0, 180) // empty flight number
        .accounts({
          state: stateKey,
          policy: policyKey,
          policyVault: vaultKey,
          holderUsdcAta: holderUsdc,
          usdcMint,
          holder: holder.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([holder])
        .rpc();
      assert.fail("Should have thrown FlightNumberEmpty");
    } catch (e: any) {
      assert.include(e.message, "FlightNumberEmpty");
      console.log("  ✓ Correctly rejected empty flight number");
    }
  });

  // ── Summary ─────────────────────────────────────────────────────────────

  after(async () => {
    const state = await program.account.programState.fetch(stateKey);
    console.log("\n  ─── Final State ─────────────────────────────────");
    console.log("  Total policies created:", state.totalPolicies.toNumber());
    console.log(
      "  Total USDC paid out:   ",
      state.totalPayoutsUsdc.toNumber() / USDC_FACTOR,
      "USDC"
    );
    console.log("  ─────────────────────────────────────────────────");
  });
});
