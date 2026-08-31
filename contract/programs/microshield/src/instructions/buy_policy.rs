use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::MicroshieldError;
use crate::state::{Policy, PolicyCreated, PolicyStatus, ProgramState};

// ─── Constants ────────────────────────────────────────────────────────────────

/// 1 USDC = 1_000_000 (6 decimal places)
pub const USDC_DECIMALS: u64 = 1_000_000;

/// Coverage tiers: (premium_micro_usdc, max_payout_micro_usdc)
pub const TIERS: [(u64, u64); 3] = [
    (1 * USDC_DECIMALS, 5 * USDC_DECIMALS),   // Basic:    1 USDC → 5 USDC
    (2 * USDC_DECIMALS, 10 * USDC_DECIMALS),  // Standard: 2 USDC → 10 USDC
    (5 * USDC_DECIMALS, 25 * USDC_DECIMALS),  // Premium:  5 USDC → 25 USDC
];

/// Accepted delay thresholds (minutes)
pub const VALID_THRESHOLDS: [u32; 4] = [60, 120, 180, 300];

/// Policy validity window after purchase (48 hours in seconds)
pub const POLICY_VALIDITY_SECS: i64 = 48 * 60 * 60;

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(flight_number: String, premium_tier: u8, delay_threshold_mins: u32)]
pub struct BuyPolicy<'info> {
    /// ProgramState — read to get current policy counter + usdc_mint; incremented
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, ProgramState>,

    /// New Policy PDA — created here
    /// Seeds include the current policy counter so each policy is unique per holder
    #[account(
        init,
        payer = holder,
        space = 8 + Policy::INIT_SPACE,
        seeds = [
            b"policy",
            holder.key().as_ref(),
            &state.total_policies.to_le_bytes(),
        ],
        bump,
    )]
    pub policy: Account<'info, Policy>,

    /// USDC escrow vault — PDA token account owned by the Policy PDA
    /// Holds the premium until payout or refund
    #[account(
        init,
        payer = holder,
        seeds = [b"vault", policy.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = policy,
    )]
    pub policy_vault: Account<'info, TokenAccount>,

    /// Holder's USDC token account (source of premium payment)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = holder,
    )]
    pub holder_usdc_ata: Account<'info, TokenAccount>,

    /// USDC mint — must match the one registered in ProgramState
    #[account(constraint = usdc_mint.key() == state.usdc_mint @ MicroshieldError::MintMismatch)]
    pub usdc_mint: Account<'info, Mint>,

    /// Policy purchaser — signs + pays for account creation rent
    #[account(mut)]
    pub holder: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────

pub fn handler(
    ctx: Context<BuyPolicy>,
    flight_number: String,
    premium_tier: u8,
    delay_threshold_mins: u32,
) -> Result<()> {
    // ── Validate inputs ──────────────────────────────────────────────────────
    require!(!flight_number.is_empty(), MicroshieldError::FlightNumberEmpty);
    require!(flight_number.len() <= 16, MicroshieldError::FlightNumberTooLong);
    require!(premium_tier < 3, MicroshieldError::InvalidPremiumTier);
    require!(
        VALID_THRESHOLDS.contains(&delay_threshold_mins),
        MicroshieldError::InvalidDelayThreshold
    );

    let (premium, max_payout) = TIERS[premium_tier as usize];

    // ── Transfer premium: holder ATA → escrow vault ──────────────────────────
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.holder_usdc_ata.to_account_info(),
            to: ctx.accounts.policy_vault.to_account_info(),
            authority: ctx.accounts.holder.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, premium)?;

    // ── Store flight number as fixed [u8; 16] ────────────────────────────────
    let mut flight_bytes = [0u8; 16];
    let src = flight_number.as_bytes();
    flight_bytes[..src.len()].copy_from_slice(src);

    // ── Initialize Policy account ────────────────────────────────────────────
    let clock = Clock::get()?;
    let state = &mut ctx.accounts.state;
    let policy_id = state.total_policies;

    let policy = &mut ctx.accounts.policy;
    policy.holder = ctx.accounts.holder.key();
    policy.flight_number = flight_bytes;
    policy.premium = premium;
    policy.max_payout = max_payout;
    policy.delay_threshold_mins = delay_threshold_mins;
    policy.created_at = clock.unix_timestamp;
    policy.expires_at = clock.unix_timestamp + POLICY_VALIDITY_SECS;
    policy.status = PolicyStatus::Active;
    policy.delay_minutes_reported = 0;
    policy.policy_id = policy_id;
    policy.vault_bump = ctx.bumps.policy_vault;
    policy.bump = ctx.bumps.policy;

    // ── Increment global policy counter ──────────────────────────────────────
    state.total_policies = state
        .total_policies
        .checked_add(1)
        .ok_or(MicroshieldError::ArithmeticOverflow)?;

    // ── Emit event for off-chain indexing ────────────────────────────────────
    emit!(PolicyCreated {
        policy_id,
        holder: ctx.accounts.holder.key(),
        flight_number: flight_number.clone(),
        premium,
        max_payout,
        delay_threshold_mins,
        expires_at: policy.expires_at,
    });

    msg!(
        "[MicroShield] Policy #{} created | Flight: {} | Premium: {} USDC | Max payout: {} USDC | Threshold: {}min | Expires: {}",
        policy_id,
        flight_number,
        premium / USDC_DECIMALS,
        max_payout / USDC_DECIMALS,
        delay_threshold_mins,
        policy.expires_at,
    );

    Ok(())
}
