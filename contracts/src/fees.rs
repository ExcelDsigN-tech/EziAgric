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

use soroban_sdk::{Address, Env};

use crate::storage::{get_fee_bps, get_fee_collector, set_fee_collector};

/// Returns the platform fee, in basis points, currently configured in storage.
///
/// The value is read from persistent contract storage and is expected to be in
/// the range `0..=10_000` (0% to 100%).
///
/// # Returns
///
/// The configured fee in basis points.
pub fn get_platform_fee_bps(env: &Env) -> u32 {
    get_fee_bps(env)
}

/// Computes the platform fee owed on `amount` at the given `fee_bps`.
///
/// Uses the formula `amount * fee_bps / 10_000` with integer arithmetic, so the
/// result is truncated toward zero. See the module-level docs for a worked
/// example.
///
/// # Parameters
///
/// - `amount`: the gross trade amount, in the smallest token unit.
/// - `fee_bps`: the fee rate in basis points (`10_000` = 100%).
///
/// # Returns
///
/// The fee amount, in the same unit as `amount`.
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
///
/// # Parameters
///
/// - `env`: the contract environment used to read the configured fee.
/// - `amount`: the gross trade amount, in the smallest token unit.
///
/// # Returns
///
/// The fee amount, in the same unit as `amount`.
pub fn calculate_platform_fee(env: &Env, amount: i128) -> i128 {
    calculate_fee(amount, get_platform_fee_bps(env))
}

/// Splits `amount` into the seller payout and the platform fee.
///
/// The fee is computed with [`calculate_platform_fee`] and subtracted from the
/// gross amount; the remainder is returned as the seller payout. Because the
/// fee is truncated, `seller_amount + fee == amount` always holds.
///
/// # Parameters
///
/// - `env`: the contract environment used to read the configured fee.
/// - `amount`: the gross trade amount, in the smallest token unit.
///
/// # Returns
///
/// A tuple `(seller_amount, fee)` where `seller_amount = amount - fee`.
pub fn split_fee(env: &Env, amount: i128) -> (i128, i128) {
    let fee = calculate_platform_fee(env, amount);
    (amount - fee, fee)
}

/// Returns the address that collects platform fees, if one is configured.
///
/// # Returns
///
/// `Some(address)` when a fee collector has been set, otherwise `None`.
pub fn get_platform_fee_collector(env: &Env) -> Option<Address> {
    get_fee_collector(env)
}

/// Sets the address that collects platform fees.
///
/// Overwrites any previously configured collector. Authorization is expected to
/// be enforced by the calling contract entry point.
///
/// # Parameters
///
/// - `env`: the contract environment used to persist the collector.
/// - `collector`: the address that will receive platform fees.
pub fn set_platform_fee_collector(env: &Env, collector: &Address) {
    set_fee_collector(env, collector);
}
