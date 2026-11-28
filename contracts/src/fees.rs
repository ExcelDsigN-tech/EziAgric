//! Platform fee calculation and distribution.
//!
//! Fees are expressed in **basis points** (bps), where `1 bps = 0.01%` and
//! `10_000 bps = 100%`. The platform fee charged on a trade is computed as:
//!
//! ```text
//! fee = amount * fee_bps / 10_000
//! ```
//!
//! Integer arithmetic is used throughout, so the result is **truncated toward
//! zero** (floor for non-negative amounts). Any fractional remainder below one
//! stroop is not charged. For example, with `amount = 1_000` and
//! `fee_bps = 250` (2.5%):
//!
//! ```text
//! fee = 1_000 * 250 / 10_000 = 250_000 / 10_000 = 25
//! ```
//!
//! The seller receives `amount - fee` and the fee is credited to the platform
//! fee collector. Callers should be aware that very small amounts combined with
//! small `fee_bps` values can round down to a zero fee.

use soroban_sdk::{contracttype, Address, Env};

/// Storage keys for fee configuration.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum FeeKey {
    PlatformFeeBps,
    FeeAddress,
    TotalFeesCollected,
}

/// Default platform fee in basis points (0 = no fee).
pub const DEFAULT_PLATFORM_FEE_BPS: u32 = 0;

/// Read the configured platform fee in basis points.
///
/// The value is read from persistent contract storage and is expected to be in
/// the range `0..=10_000` (0% to 100%).
pub fn get_platform_fee_bps(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&FeeKey::PlatformFeeBps)
        .unwrap_or(DEFAULT_PLATFORM_FEE_BPS)
}

/// Persist the platform fee in basis points.
pub fn set_platform_fee_bps(env: &Env, bps: u32) {
    env.storage()
        .instance()
        .set(&FeeKey::PlatformFeeBps, &bps);
}

/// Read the configured fee recipient address, if any.
pub fn get_fee_address(env: &Env) -> Option<Address> {
    env.storage().instance().get(&FeeKey::FeeAddress)
}

/// Persist the fee recipient address.
pub fn set_fee_address(env: &Env, address: &Address) {
    env.storage()
        .instance()
        .set(&FeeKey::FeeAddress, address);
}

/// Read the cumulative total of fees collected across all settlements.
pub fn get_total_fees(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&FeeKey::TotalFeesCollected)
        .unwrap_or(0)
}

/// Add `amount` to the cumulative fee counter.
pub fn add_total_fees(env: &Env, amount: i128) {
    let total = get_total_fees(env) + amount;
    env.storage()
        .instance()
        .set(&FeeKey::TotalFeesCollected, &total);
}

/// Computes the platform fee owed on `amount` at the given `fee_bps`.
///
/// Uses the formula `amount * fee_bps / 10_000` with integer arithmetic, so the
/// result is truncated toward zero. See the module-level docs for a worked
/// example.
///
/// # Overflow
///
/// `amount * fee_bps` is evaluated in `i128`; callers must ensure the product
/// fits within `i128` to avoid a panic.
pub fn calculate_fee(amount: i128, fee_bps: u32) -> i128 {
    amount * fee_bps as i128 / 10_000
}

/// Computes the platform fee for `amount` using the fee rate stored on-chain.
///
/// Reads the configured fee via [`get_platform_fee_bps`] and delegates to
/// [`calculate_fee`], so the same truncation and overflow behaviour applies.
pub fn calculate_platform_fee(env: &Env, amount: i128) -> i128 {
    calculate_fee(amount, get_platform_fee_bps(env))
}

/// Splits `amount` into the seller payout and the platform fee.
///
/// The fee is computed with [`calculate_platform_fee`] and subtracted from the
/// gross amount; the remainder is returned as the seller payout. Because the
/// fee is truncated, `seller_amount + fee == amount` always holds.
pub fn split_fee(env: &Env, amount: i128) -> (i128, i128) {
    let fee = calculate_platform_fee(env, amount);
    (amount - fee, fee)
}