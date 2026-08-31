use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::ProgramState;

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// ProgramState singleton PDA — created here, never re-created
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"state"],
        bump,
    )]
    pub state: Account<'info, ProgramState>,

    /// USDC SPL mint to lock into the program (devnet or mainnet)
    pub usdc_mint: Account<'info, Mint>,

    /// Deployer — pays for state account rent and becomes the authority
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Handler ──────────────────────────────────────────────────────────────────

pub fn handler(ctx: Context<Initialize>, oracle_authority: Pubkey) -> Result<()> {
    let state = &mut ctx.accounts.state;

    state.authority = ctx.accounts.authority.key();
    state.oracle_authority = oracle_authority;
    state.usdc_mint = ctx.accounts.usdc_mint.key();
    state.total_policies = 0;
    state.total_payouts_usdc = 0;
    state.bump = ctx.bumps.state;

    msg!(
        "[MicroShield] Initialized. Authority: {} | Oracle: {} | USDC Mint: {}",
        state.authority,
        oracle_authority,
        state.usdc_mint
    );

    Ok(())
}
