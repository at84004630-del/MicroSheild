use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::MicroshieldError;
use crate::instructions::buy_policy::USDC_DECIMALS;
use crate::state::{Policy, PolicyStatus, PremiumRefunded, ProgramState};

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(policy_id: u64)]
pub struct ExpireRefund<'info> {
    /// ProgramState — read-only for usdc_mint constraint
    #[account(
        seeds = [b"state"],
        bump = state.bump,
    )]
    pub state: Account<'info, ProgramState>,

    /// Policy to expire — must be Active + past expires_at
    /// The holder is NOT required to be the signer (permissionless crank)
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
    )]
    pub policy: Account<'info, Policy>,

    /// Escrow vault — sends premium back to holder
    #[account(
        mut,
        seeds = [b"vault", policy.key().as_ref()],
        bump = policy.vault_bump,
    )]
    pub policy_vault: Account<'info, TokenAccount>,

    /// Holder's USDC ATA — receives the refunded premium
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = holder,
    )]
    pub holder_usdc_ata: Account<'info, TokenAccount>,

    /// USDC mint
    #[account(constraint = usdc_mint.key() == state.usdc_mint @ MicroshieldError::MintMismatch)]
    pub usdc_mint: Account<'info, Mint>,

    /// Holder account — not required to sign; refund always goes to them.
    /// CHECK: validated by constraint that policy.holder == holder.key()
    pub holder: UncheckedAccount<'info>,

    /// Any account can pay the tx fee (crank/relayer or holder themselves)
    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────

pub fn handler(ctx: Context<ExpireRefund>, policy_id: u64) -> Result<()> {
    // Check policy is still active (not already paid/refunded)
    require!(
        ctx.accounts.policy.status == PolicyStatus::Active,
        MicroshieldError::PolicyNotActive
    );

    // Check that policy has actually expired
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= ctx.accounts.policy.expires_at,
        MicroshieldError::PolicyNotExpired
    );

    let holder_key = ctx.accounts.policy.holder;
    let premium = ctx.accounts.policy.premium;
    let policy_bump = ctx.accounts.policy.bump;
    let policy_id_bytes = policy_id.to_le_bytes();
    let policy_bump_slice = [policy_bump];

    // ── Refund: vault → holder ATA (signed by Policy PDA) ───────────────────
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
    token::transfer(cpi_ctx, premium)?;

    ctx.accounts.policy.status = PolicyStatus::Refunded;

    emit!(PremiumRefunded {
        policy_id,
        holder: holder_key,
        amount_usdc: premium,
    });

    msg!(
        "[MicroShield] PREMIUM REFUNDED | Policy #{} | {} USDC → {} | Policy expired at {}",
        policy_id,
        premium / USDC_DECIMALS,
        holder_key,
        ctx.accounts.policy.expires_at,
    );

    Ok(())
}
