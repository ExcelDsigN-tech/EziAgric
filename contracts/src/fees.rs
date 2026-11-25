use soroban_sdk::{contracttype, Address, Env};

/// Storage keys for fee configuration.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum FeeKey {
    PlatformFeeBps,
    FeeAddress,
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
