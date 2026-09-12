/**
 * MicroShield Anchor IDL
 * Hand-crafted from programs/microshield/src/lib.rs + state.rs + instructions/
 * Replace with anchor build output once deployed to devnet.
 */

export const IDL = {
  version: "0.1.0",
  name: "microshield",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "oracleAuthority", type: "publicKey" }],
    },
    {
      name: "buyPolicy",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "policy", isMut: true, isSigner: false },
        { name: "policyVault", isMut: true, isSigner: false },
        { name: "holderUsdcAta", isMut: true, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        { name: "holder", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "flightNumber", type: "string" },
        { name: "premiumTier", type: "u8" },
        { name: "delayThresholdMins", type: "u32" },
      ],
    },
    {
      name: "reportDelay",
      accounts: [
        { name: "state", isMut: true, isSigner: false },
        { name: "policy", isMut: true, isSigner: false },
        { name: "policyVault", isMut: true, isSigner: false },
        { name: "holderUsdcAta", isMut: true, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        { name: "oracle", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "policyId", type: "u64" },
        { name: "delayMinutes", type: "u32" },
      ],
    },
    {
      name: "expireRefund",
      accounts: [
        { name: "state", isMut: false, isSigner: false },
        { name: "policy", isMut: true, isSigner: false },
        { name: "policyVault", isMut: true, isSigner: false },
        { name: "holderUsdcAta", isMut: true, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        // holder is an UncheckedAccount in the Rust (not signer) — refund always goes to them
        { name: "holder", isMut: false, isSigner: false },
        // payer can be anyone (permissionless crank) — the connected wallet pays the tx fee
        { name: "payer", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "policyId", type: "u64" }],
    },
    {
      name: "closePolicy",
      accounts: [
        { name: "state", isMut: false, isSigner: false },
        { name: "policy", isMut: true, isSigner: false },
        { name: "policyVault", isMut: true, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        { name: "holder", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "policyId", type: "u64" }],
    },
  ],
  accounts: [
    {
      name: "ProgramState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "oracleAuthority", type: "publicKey" },
          { name: "usdcMint", type: "publicKey" },
          { name: "totalPolicies", type: "u64" },
          { name: "totalPayoutsUsdc", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Policy",
      type: {
        kind: "struct",
        fields: [
          { name: "holder", type: "publicKey" },
          { name: "flightNumber", type: { array: ["u8", 16] } },
          { name: "premium", type: "u64" },
          { name: "maxPayout", type: "u64" },
          { name: "delayThresholdMins", type: "u32" },
          { name: "createdAt", type: "i64" },
          { name: "expiresAt", type: "i64" },
          {
            name: "status",
            type: {
              defined: "PolicyStatus",
            },
          },
          { name: "delayMinutesReported", type: "u32" },
          { name: "policyId", type: "u64" },
          { name: "vaultBump", type: "u8" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  types: [
    {
      name: "PolicyStatus",
      type: {
        kind: "enum",
        variants: [
          { name: "Active" },
          { name: "PayoutSent" },
          { name: "Refunded" },
        ],
      },
    },
  ],
  events: [
    {
      name: "PolicyCreated",
      fields: [
        { name: "policyId", type: "u64", index: false },
        { name: "holder", type: "publicKey", index: false },
        { name: "flightNumber", type: "string", index: false },
        { name: "premium", type: "u64", index: false },
        { name: "maxPayout", type: "u64", index: false },
        { name: "delayThresholdMins", type: "u32", index: false },
        { name: "expiresAt", type: "i64", index: false },
      ],
    },
    {
      name: "DelayReported",
      fields: [
        { name: "policyId",        type: "u64",  index: false },
        { name: "delayMinutes",    type: "u32",  index: false },
        { name: "threshold",       type: "u32",  index: false },
        { name: "payoutTriggered", type: "bool", index: false },
      ],
    },
    {
      name: "PayoutSent",
      fields: [
        { name: "policyId",    type: "u64",       index: false },
        { name: "holder",      type: "publicKey", index: false },
        { name: "amountUsdc",  type: "u64",       index: false },
      ],
    },
    {
      name: "PremiumRefunded",
      fields: [
        { name: "policyId",   type: "u64",       index: false },
        { name: "holder",     type: "publicKey", index: false },
        { name: "amountUsdc", type: "u64",       index: false },
      ],
    },
  ],
  errors: [
    { code: 6000, name: "UnauthorizedOracle", msg: "Unauthorized: only the oracle authority can report delays" },
    { code: 6001, name: "UnauthorizedAuthority", msg: "Unauthorized: only the program authority can perform this action" },
    { code: 6002, name: "PolicyNotActive", msg: "Policy is not active: already paid out or refunded" },
    { code: 6003, name: "PolicyNotExpired", msg: "Policy has not expired yet; cannot refund before expiry" },
    { code: 6004, name: "InvalidPremiumTier", msg: "Invalid premium tier: use 0 (Basic/1 USDC), 1 (Standard/2 USDC), or 2 (Premium/5 USDC)" },
    { code: 6005, name: "InvalidDelayThreshold", msg: "Invalid delay threshold: accepted values are 60, 120, 180, or 300 minutes" },
    { code: 6006, name: "FlightNumberEmpty", msg: "Flight number cannot be empty" },
    { code: 6007, name: "FlightNumberTooLong", msg: "Flight number too long: maximum 16 characters" },
    { code: 6008, name: "PolicyCannotBeClosed", msg: "Policy cannot be closed: status must be PayoutSent or Refunded" },
    { code: 6009, name: "ArithmeticOverflow", msg: "Arithmetic overflow" },
    { code: 6010, name: "MintMismatch", msg: "USDC mint does not match program state" },
  ],
} as const;

export type Microshield = typeof IDL;

// ─── Program ID ───────────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_PROGRAM_ID in .env.local after `anchor deploy` to override.
// The placeholder below is only active until you deploy.
export const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";

// ─── Devnet USDC Mint ─────────────────────────────────────────────────────────
// Circle's verified devnet USDC mint — use this for all devnet testing.
export const DEVNET_USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

// ─── Coverage tiers (mirrors contract constants) ──────────────────────────────
export const USDC_DECIMALS = 1_000_000; // 1 USDC = 1_000_000 micro-USDC

export const TIERS = [
  { tier: 0, label: "Basic",    premium: 1, maxPayout: 5,  desc: "Short-haul domestic" },
  { tier: 1, label: "Standard", premium: 2, maxPayout: 10, desc: "Most popular",  popular: true },
  { tier: 2, label: "Premium",  premium: 5, maxPayout: 25, desc: "Long-haul / international" },
] as const;

export const VALID_THRESHOLDS = [60, 120, 180, 300] as const;
