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
