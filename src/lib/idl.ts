/**
 * MicroShield Anchor IDL (Anchor 0.30 compatible)
 * Generated from programs/microshield/src/lib.rs + state.rs + instructions/
 */

export const IDL = {
  "version": "0.1.0",
  "name": "microshield",
  "address": "AmA7WxBdyLCLrNPD3pjjwQx1f4jShve8oGJN4zKqTTQv",
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdcMint",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "oracleAuthority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "buyPolicy",
      "discriminator": [
        0,
        59,
        201,
        101,
        183,
        3,
        41,
        24
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "policy",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "policyVault",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "holderUsdcAta",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdcMint",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "holder",
          "writable": true,
          "signer": true,
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "flightNumber",
          "type": "string"
        },
        {
          "name": "premiumTier",
          "type": "u8"
        },
        {
          "name": "delayThresholdMins",
          "type": "u32"
        }
      ]
    },
    {
      "name": "reportDelay",
      "discriminator": [
        4,
        131,
        215,
        72,
        82,
        216,
        63,
        212
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "policy",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "policyVault",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "holderUsdcAta",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdcMint",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oracle",
          "writable": false,
          "signer": true,
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "policyId",
          "type": "u64"
        },
        {
          "name": "delayMinutes",
          "type": "u32"
        }
      ]
    },
    {
      "name": "expireRefund",
      "discriminator": [
        254,
        82,
        2,
        76,
        59,
        107,
        145,
        112
      ],
      "accounts": [
        {
          "name": "state",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "policy",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "policyVault",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "holderUsdcAta",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdcMint",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "holder",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true,
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "policyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closePolicy",
      "discriminator": [
        55,
        42,
        248,
        229,
        222,
        138,
        26,
        252
      ],
      "accounts": [
        {
          "name": "state",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "policy",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "policyVault",
          "writable": true,
          "signer": false,
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdcMint",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "holder",
          "writable": true,
          "signer": true,
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "writable": false,
          "signer": false,
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "policyId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ProgramState",
      "discriminator": [
        77,
        209,
        137,
        229,
        149,
        67,
        167,
        230
      ]
    },
    {
      "name": "Policy",
      "discriminator": [
        222,
        135,
        7,
        163,
        235,
        177,
        33,
        68
      ]
    }
  ],
  "events": [
    {
      "name": "PolicyCreated",
      "discriminator": [
        59,
        189,
        65,
        121,
        86,
        157,
        108,
        10
      ]
    },
    {
      "name": "DelayReported",
      "discriminator": [
        70,
        12,
        60,
        43,
        71,
        79,
        5,
        143
      ]
    },
    {
      "name": "PayoutSent",
      "discriminator": [
        118,
        83,
        220,
        84,
        61,
        77,
        124,
        10
      ]
    },
    {
      "name": "PremiumRefunded",
      "discriminator": [
        93,
        30,
        163,
        183,
        164,
        253,
        39,
        253
      ]
    }
  ],
  "types": [
    {
      "name": "ProgramState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "oracleAuthority",
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          },
          {
            "name": "totalPolicies",
            "type": "u64"
          },
          {
            "name": "totalPayoutsUsdc",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Policy",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "holder",
            "type": "pubkey"
          },
          {
            "name": "flightNumber",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "premium",
            "type": "u64"
          },
          {
            "name": "maxPayout",
            "type": "u64"
          },
          {
            "name": "delayThresholdMins",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "PolicyStatus"
              }
            }
          },
          {
            "name": "delayMinutesReported",
            "type": "u32"
          },
          {
            "name": "policyId",
            "type": "u64"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "PolicyStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Active"
          },
          {
            "name": "PayoutSent"
          },
          {
            "name": "Refunded"
          }
        ]
      }
    },
    {
      "name": "PolicyCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "policyId",
            "type": "u64"
          },
          {
            "name": "holder",
            "type": "pubkey"
          },
          {
            "name": "flightNumber",
            "type": "string"
          },
          {
            "name": "premium",
            "type": "u64"
          },
          {
            "name": "maxPayout",
            "type": "u64"
          },
          {
            "name": "delayThresholdMins",
            "type": "u32"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "DelayReported",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "policyId",
            "type": "u64"
          },
          {
            "name": "delayMinutes",
            "type": "u32"
          },
          {
            "name": "threshold",
            "type": "u32"
          },
          {
            "name": "payoutTriggered",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "PayoutSent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "policyId",
            "type": "u64"
          },
          {
            "name": "holder",
            "type": "pubkey"
          },
          {
            "name": "amountUsdc",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "PremiumRefunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "policyId",
            "type": "u64"
          },
          {
            "name": "holder",
            "type": "pubkey"
          },
          {
            "name": "amountUsdc",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "UnauthorizedOracle",
      "msg": "Unauthorized: only the oracle authority can report delays"
    },
    {
      "code": 6001,
      "name": "UnauthorizedAuthority",
      "msg": "Unauthorized: only the program authority can perform this action"
    },
    {
      "code": 6002,
      "name": "PolicyNotActive",
      "msg": "Policy is not active: already paid out or refunded"
    },
    {
      "code": 6003,
      "name": "PolicyNotExpired",
      "msg": "Policy has not expired yet; cannot refund before expiry"
    },
    {
      "code": 6004,
      "name": "InvalidPremiumTier",
      "msg": "Invalid premium tier: use 0 (Basic/1 USDC), 1 (Standard/2 USDC), or 2 (Premium/5 USDC)"
    },
    {
      "code": 6005,
      "name": "InvalidDelayThreshold",
      "msg": "Invalid delay threshold: accepted values are 60, 120, 180, or 300 minutes"
    },
    {
      "code": 6006,
      "name": "FlightNumberEmpty",
      "msg": "Flight number cannot be empty"
    },
    {
      "code": 6007,
      "name": "FlightNumberTooLong",
      "msg": "Flight number too long: maximum 16 characters"
    },
    {
      "code": 6008,
      "name": "PolicyCannotBeClosed",
      "msg": "Policy cannot be closed: status must be PayoutSent or Refunded"
    },
    {
      "code": 6009,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6010,
      "name": "MintMismatch",
      "msg": "USDC mint does not match program state"
    }
  ]
} as const;

export type Microshield = typeof IDL;

// ─── Program ID ───────────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_PROGRAM_ID in .env.local after `anchor deploy` to override.
// The placeholder below is only active until you deploy.
export const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
  "AmA7WxBdyLCLrNPD3pjjwQx1f4jShve8oGJN4zKqTTQv";

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
