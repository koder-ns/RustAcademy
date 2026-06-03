

# ⚡ RustAcademy Soroban Contracts

> Trustless reward distribution and credential verification on Stellar.

---

## Overview

RustAcademy uses Soroban smart contracts to manage:

* Rewards
* Reputation
* Certificates
* Badges
* Governance
* Escrow

---

## Contracts

### reward_pool

Handles XLM reward distribution.

Functions:

```rust
create_pool()
deposit_rewards()
release_reward()
get_balance()
```

---

### course_registry

Stores course metadata.

Functions:

```rust
register_course()
update_course()
archive_course()
```

---

### reputation

Tracks learner and tutor reputation.

Functions:

```rust
increase_score()
decrease_score()
get_score()
```

---

### certificate_nft

Issues course completion certificates.

Functions:

```rust
mint_certificate()
verify_certificate()
revoke_certificate()
```

---

### badge_nft

Achievement badge system.

Functions:

```rust
mint_badge()
get_badges()
```

---

### escrow_payout

Handles tutor earnings.

Functions:

```rust
create_escrow()
release_escrow()
cancel_escrow()
```

---

### governance

Community governance.

Functions:

```rust
create_proposal()
vote()
execute_proposal()
```

---

## Contract Architecture

```text
Course Completion
        ↓
 AI Grading
        ↓
 Tutor Verification
        ↓
 reward_pool
        ↓
 reputation
        ↓
 certificate_nft
        ↓
 badge_nft
```

---

## Build Contracts

```bash
cargo build \
--target wasm32-unknown-unknown \
--release
```

---

## Run Tests

```bash
cargo test
```

---

## Deploy

```bash
stellar contract deploy \
--network testnet \
--wasm target/wasm32-unknown-unknown/release/reward_pool.wasm
```

---

## Contract Security Principles

### Anti-Cheat

* Oracle verification
* Duplicate submission prevention
* Reward throttling

### Access Control

* Admin-only functions
* Tutor-only functions
* Governance-controlled upgrades

### Financial Safety

* No floating-point arithmetic
* i128 token calculations
* Escrow-based payouts
* Replay protection

---

## Events

### Reward Released

```rust
(
  "reward_released",
  learner
)
```

### Certificate Minted

```rust
(
  "certificate_minted",
  learner
)
```

### Reputation Updated

```rust
(
  "reputation_updated",
  account
)
```

---

## Testing Requirements

All contracts must maintain:

```text
≥ 90% test coverage
```

before deployment to production.

---