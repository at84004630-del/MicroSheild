use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount};

use crate::errors::MicroshieldError;
use crate::state::{Policy, PolicyStatus, ProgramState};

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(policy_id: u64)]
pub struct ClosePolicy<'info> {
    /// ProgramState — read-only for usdc_mint constraint
    #[account(
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, ProgramState>,

    /// Policy to close — must be in a terminal state (PayoutSent or Refunded)
    /// `close = holder` makes Anchor transfer the rent lamports to holder on exit
    #[account(
        mut,
        seeds = [
            b"policy",
            holder.key().as_ref(),
            &policy_id.to_le_bytes(),
        ],
        bump = policy.bump,
        constraint = policy.policy_id == policy_id,
        constraint = policy.holder == holder.key(),
        close = holder,
    )]
    pub policy: Account<'info, Policy>,

    /// Empty escrow vault — closed here via token::close_account CPI
    /// Rent (lamports) returned to holder
    #[account(
        mut,
        seeds = [b"vault", policy.key().as_ref()],
        bump = policy.vault_bump,
    )]
    pub policy_vault: Account<'info, TokenAccount>,

    /// USDC mint (for token account constraint validation)
    #[account(constraint = usdc_mint.key() == state.usdc_mint @ MicroshieldError::MintMismatch)]
    pub usdc_mint: Account<'info, Mint>,

    /// Policy holder — must sign to close, receives all reclaimed rent
    #[account(mut)]
    pub holder: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────

pub fn handler(ctx: Context<ClosePolicy>, policy_id: u64) -> Result<()> {
    // Only allow closing settled policies
    require!(
        ctx.accounts.policy.status == PolicyStatus::PayoutSent
            || ctx.accounts.policy.status == PolicyStatus::Refunded,
        MicroshieldError::PolicyCannotBeClosed
    );

    let holder_key = ctx.accounts.policy.holder;
    let policy_bump = ctx.accounts.policy.bump;
    let policy_id_bytes = policy_id.to_le_bytes();
    let policy_bump_slice = [policy_bump];

    // ── Close vault token account: returns rent to holder ───────────────────
    // The vault is already empty (payout/refund happened in previous instructions).
    // We use token::close_account with the Policy PDA as authority.
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"policy",
        holder_key.as_ref(),
        policy_id_bytes.as_ref(),
        policy_bump_slice.as_ref(),
    ]];

    let close_cpi = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.policy_vault.to_account_info(),
            destination: ctx.accounts.holder.to_account_info(),
            authority: ctx.accounts.policy.to_account_info(),
        },
        signer_seeds,
    );
    token::close_account(close_cpi)?;

    // The Policy PDA itself is closed by Anchor via `close = holder` on the account attribute
    // (lamports are automatically moved to holder after handler returns).

    msg!(
        "[MicroShield] Policy #{} closed. Rent reclaimed to {}",
        policy_id,
        holder_key
    );

    Ok(())
}
