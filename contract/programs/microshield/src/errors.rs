use anchor_lang::prelude::*;

#[error_code]
pub enum MicroshieldError {
    /// Caller is not the designated oracle authority
    #[msg("Unauthorized: only the oracle authority can report delays")]
    UnauthorizedOracle,

    /// Caller is not the program authority (admin)
    #[msg("Unauthorized: only the program authority can perform this action")]
    UnauthorizedAuthority,

    /// Policy must be Active to accept delay reports or be refunded
    #[msg("Policy is not active: already paid out or refunded")]
    PolicyNotActive,

    /// Policy hasn't passed its expiry timestamp yet
    #[msg("Policy has not expired yet; cannot refund before expiry")]
    PolicyNotExpired,

    /// premium_tier must be 0, 1, or 2
    #[msg("Invalid premium tier: use 0 (Basic/1 USDC), 1 (Standard/2 USDC), or 2 (Premium/5 USDC)")]
    InvalidPremiumTier,

    /// delay_threshold_mins must be one of the accepted values
    #[msg("Invalid delay threshold: accepted values are 60, 120, 180, or 300 minutes")]
    InvalidDelayThreshold,

    /// Flight number string is empty
    #[msg("Flight number cannot be empty")]
    FlightNumberEmpty,

    /// Flight number exceeds max length
    #[msg("Flight number too long: maximum 16 characters (e.g. 'AI 131')")]
    FlightNumberTooLong,

    /// Policy is not in a closeable state
    #[msg("Policy cannot be closed: status must be PayoutSent or Refunded")]
    PolicyCannotBeClosed,

    /// Safe-math overflow
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    /// USDC mint mismatch
    #[msg("USDC mint does not match program state")]
    MintMismatch,
}
