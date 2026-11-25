//! Soroban contract entrypoints for the platform.
//!
//! This crate exposes the on-chain surface used by the frontend and backend:
//! fee configuration, admin management, and the core lifecycle operations.

#![no_std]

mod fees;

use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env};

use crate::fees::{self, FeeConfig};

#[contract]
pub struct PlatformContract;

#[contractimpl]
impl PlatformContract {
    /// Initialize the contract with the admin and initial fee configuration.
    pub fn initialize(env: Env, admin: Address, fee_address: Address, platform_fee_bps: u32) {
        fees::initialize(&env, &admin, &fee_address, platform_fee_bps);
    }

    /// Update the platform fee (basis points). Admin only.
    pub fn set_platform_fee_bps(env: Env, platform_fee_bps: u32) {
        fees::set_platform_fee_bps(&env, platform_fee_bps);
    }

    /// Update the address that receives platform fees. Admin only.
    pub fn set_fee_address(env: Env, fee_address: Address) {
        fees::set_fee_address(&env, &fee_address);
    }

    /// Read-only: current platform fee in basis points.
    pub fn get_platform_fee_bps(env: Env) -> u32 {
        fees::get_platform_fee_bps(&env)
    }

    /// Read-only: current address that receives platform fees.
    pub fn get_fee_address(env: Env) -> Address {
        fees::get_fee_address(&env)
    }

    /// Read-only: full fee configuration snapshot.
    pub fn get_fee_config(env: Env) -> FeeConfig {
        fees::get_fee_config(&env)
    }

    /// Upgrade the contract WASM to `new_wasm_hash`. Admin only.
    ///
    /// Requires the stored admin's authorization and verifies the caller is the
    /// stored admin before invoking the Soroban host function
    /// `update_current_contract_wasm`. Emits an upgrade event carrying the new
    /// WASM hash. Existing contract storage (e.g. trade state) is preserved.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>, admin: Address) {
        admin.require_auth();

        let stored_admin = fees::get_admin(&env);
        if admin != stored_admin {
            panic!("only the contract admin can upgrade");
        }

        env.deployer()
            .update_current_contract_wasm(new_wasm_hash.clone());

        env.events()
            .publish((symbol_short!("upgrade"),), new_wasm_hash);
    }
}

#[cfg(test)]
mod test;

#[cfg(test)]
mod lifecycle_test;
