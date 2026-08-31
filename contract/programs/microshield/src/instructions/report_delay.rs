use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::MicroshieldError;
use crate::instructions::buy_policy::USDC_DECIMALS;
use crate::state::{DelayReported, PayoutSent, Policy, PolicyStatus, ProgramState};

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(policy_id: u64)]
pub struct ReportDelay<'info> {
    /// ProgramState — to verify oracle_authority and update total_payouts_usdc
    #[account(
        mut,
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, ProgramState>,

    /// Target policy — must be Active, identified by holder + policy_id
    #[account(
        mut,
        seeds = [
            b"policy",
            policy.holder.as_ref(),
            &policy_id.to_le_bytes(),
        ],
        bump = policy.bump,
        constraint = policy.policy_id == policy_id,
    )]
    pub policy: Account<'info, Policy>,

    /// Policy escrow vault (source of payout if threshold met)
    /// Authority is the policy PDA itself
    #[account(
        mut,
        seeds = [b"vault", policy.key().as_ref()],
        bump = policy.vault_bump,
    )]
    pub policy_vault: Account<'info, TokenAccount>,

    /// Holder's USDC ATA — receives payout if threshold is met
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = policy.holder,
    )]
    pub holder_usdc_ata: Account<'info, TokenAccount>,

    /// USDC mint — for token constraint validation
    #[account(constraint = usdc_mint.key() == state.usdc_mint @ MicroshieldError::MintMismatch)]
    pub usdc_mint: Account<'info, Mint>,

    /// Oracle authority — must match state.oracle_authority
    #[account(constraint = oracle.key() == state.oracle_authority @ MicroshieldError::UnauthorizedOracle)]
    pub oracle: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────

pub fn handler(ctx: Context<ReportDelay>, policy_id: u64, delay_minutes: u32) -> Result<()> {
    // Snapshot values before mutable borrow (Rust borrow-checker requirement)
    let holder_key = ctx.accounts.policy.holder;
    let threshold = ctx.accounts.policy.delay_threshold_mins;
    let max_payout = ctx.accounts.policy.max_payout;
    let policy_bump = ctx.accounts.policy.bump;

    require!(
        ctx.accounts.policy.status == PolicyStatus::Active,
        MicroshieldError::PolicyNotActive
    );

    // Update delay reading
    ctx.accounts.policy.delay_minutes_reported = delay_minutes;

    let payout_triggered = delay_minutes >= threshold;

    if payout_triggered {
        // ── Payout: vault → holder ATA (signed by Policy PDA) ───────────────
        let policy_id_bytes = policy_id.to_le_bytes();
        let policy_bump_slice = [policy_bump];
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"policy",
            holder_key.as_ref(),
            policy_id_bytes.as_ref(),
            policy_bump_slice.as_ref(),
        ]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.policy_vault.to_account_info(),
                to: ctx.accounts.holder_usdc_ata.to_account_info(),
                authority: ctx.accounts.policy.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi_ctx, max_payout)?;

        // Update policy status
        ctx.accounts.policy.status = PolicyStatus::PayoutSent;

        // Update global payout counter
        ctx.accounts.state.total_payouts_usdc = ctx
            .accounts
            .state
            .total_payouts_usdc
            .checked_add(max_payout)
            .ok_or(MicroshieldError::ArithmeticOverflow)?;

        emit!(PayoutSent {
            policy_id,
            holder: holder_key,
            amount_usdc: max_payout,
        });

        msg!(
            "[MicroShield] PAYOUT TRIGGERED | Policy #{} | {} USDC → {} | Delay: {}min ≥ {}min threshold",
            policy_id,
            max_payout / USDC_DECIMALS,
            holder_key,
            delay_minutes,
            threshold,
        );
    } else {
        msg!(
            "[MicroShield] Delay update | Policy #{} | {}min (threshold: {}min) — no payout yet",
            policy_id,
            delay_minutes,
            threshold,
        );
    }

    emit!(DelayReported {
        policy_id,
        delay_minutes,
        threshold,
        payout_triggered,
    });

    Ok(())
}
