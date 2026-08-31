#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

// ─── IMPORTANT ────────────────────────────────────────────────────────────────
// After first `anchor build`, run:
//   anchor keys list
// Copy the generated program ID here and into Anchor.toml [programs.*] sections.
// ──────────────────────────────────────────────────────────────────────────────
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod microshield {
    use super::*;

    /// One-time initialization. Sets oracle authority and USDC mint.
    /// Must be called by the deployer immediately after deployment.
    pub fn initialize(ctx: Context<Initialize>, oracle_authority: Pubkey) -> Result<()> {
        instructions::initialize::handler(ctx, oracle_authority)
    }

    /// Purchase a parametric flight insurance policy.
    ///
    /// Locks `premium` USDC from the holder's ATA into a per-policy escrow vault.
    /// The policy expires 48 hours after creation.
    ///
    /// # Arguments
    /// * `flight_number`      — IATA flight code, e.g. "AI 131" (max 16 chars)
    /// * `premium_tier`       — 0 = Basic (1 USDC → 5 USDC max), 1 = Standard (2→10), 2 = Premium (5→25)
    /// * `delay_threshold_mins` — Minutes of delay that trigger payout: 60, 120, 180, or 300
    pub fn buy_policy(
        ctx: Context<BuyPolicy>,
        flight_number: String,
        premium_tier: u8,
        delay_threshold_mins: u32,
    ) -> Result<()> {
        instructions::buy_policy::handler(ctx, flight_number, premium_tier, delay_threshold_mins)
    }

    /// Oracle reports the current flight delay for a policy.
    ///
    /// If `delay_minutes >= policy.delay_threshold_mins`, automatically transfers
    /// `max_payout` USDC from the escrow vault to the holder's wallet.
    ///
    /// Only callable by `state.oracle_authority`.
    pub fn report_delay(
        ctx: Context<ReportDelay>,
        policy_id: u64,
        delay_minutes: u32,
    ) -> Result<()> {
        instructions::report_delay::handler(ctx, policy_id, delay_minutes)
    }

    /// Refund the premium to the holder after policy expiry with no triggered payout.
    ///
    /// Callable by anyone after `policy.expires_at` — the refund always goes to
    /// the original holder. Useful as a permissionless crank for UX.
    pub fn expire_refund(ctx: Context<ExpireRefund>, policy_id: u64) -> Result<()> {
        instructions::expire_refund::handler(ctx, policy_id)
    }

    /// Close the policy account and its empty USDC vault, reclaiming rent SOL.
    ///
    /// Only callable after status is `PayoutSent` or `Refunded`.
    /// Rent goes back to the holder.
    pub fn close_policy(ctx: Context<ClosePolicy>, policy_id: u64) -> Result<()> {
        instructions::close_policy::handler(ctx, policy_id)
    }
}
