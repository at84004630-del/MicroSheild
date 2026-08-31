use anchor_lang::prelude::*;

/// MicroShield Program State (singleton PDA)
/// Seeds: [b"state"]
#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    /// Program admin (can update oracle authority)
    pub authority: Pubkey,
    /// Trusted oracle keypair that calls report_delay
    pub oracle_authority: Pubkey,
    /// USDC SPL token mint
    pub usdc_mint: Pubkey,
    /// Total policies ever created (used as policy_id counter)
    pub total_policies: u64,
    /// Cumulative USDC paid out (in micro-USDC, 6 decimals)
    pub total_payouts_usdc: u64,
    /// PDA bump seed
    pub bump: u8,
}

/// Individual Flight Insurance Policy
/// Seeds: [b"policy", holder.key().as_ref(), &policy_id.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct Policy {
    /// Wallet that purchased and owns this policy
    pub holder: Pubkey,
    /// Flight number (up to 16 ASCII chars, zero-padded)
    pub flight_number: [u8; 16],
    /// Premium paid, in micro-USDC (1 USDC = 1_000_000)
    pub premium: u64,
    /// Maximum payout, in micro-USDC
    pub max_payout: u64,
    /// Delay in minutes that triggers payout (e.g. 180 = 3 hrs)
    pub delay_threshold_mins: u32,
    /// Unix timestamp when policy was created
    pub created_at: i64,
    /// Unix timestamp when policy expires (created_at + 48h)
    pub expires_at: i64,
    /// Current policy status
    pub status: PolicyStatus,
    /// Last delay reported by oracle (minutes)
    pub delay_minutes_reported: u32,
    /// Sequential policy ID (same as index in ProgramState.total_policies)
    pub policy_id: u64,
    /// Bump seed for the policy's USDC vault token account
    pub vault_bump: u8,
    /// PDA bump seed for this policy
    pub bump: u8,
}

impl Policy {
    /// Returns the flight number as a trimmed UTF-8 string
    pub fn flight_number_str(&self) -> String {
        let end = self.flight_number.iter().position(|&b| b == 0).unwrap_or(16);
        String::from_utf8_lossy(&self.flight_number[..end]).to_string()
    }
}

/// Policy lifecycle status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum PolicyStatus {
    /// Policy is live and monitoring flight status
    Active,
    /// Oracle triggered payout — USDC sent to holder
    PayoutSent,
    /// Policy expired without delay — premium refunded to holder
    Refunded,
}

impl Default for PolicyStatus {
    fn default() -> Self {
        PolicyStatus::Active
    }
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct PolicyCreated {
    pub policy_id: u64,
    pub holder: Pubkey,
    pub flight_number: String,
    pub premium: u64,
    pub max_payout: u64,
    pub delay_threshold_mins: u32,
    pub expires_at: i64,
}

#[event]
pub struct DelayReported {
    pub policy_id: u64,
    pub delay_minutes: u32,
    pub threshold: u32,
    pub payout_triggered: bool,
}

#[event]
pub struct PayoutSent {
    pub policy_id: u64,
    pub holder: Pubkey,
    pub amount_usdc: u64,
}

#[event]
pub struct PremiumRefunded {
    pub policy_id: u64,
    pub holder: Pubkey,
    pub amount_usdc: u64,
}
