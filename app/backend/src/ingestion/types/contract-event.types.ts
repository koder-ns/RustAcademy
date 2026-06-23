/**
 * Domain types for  RustAcademy Soroban contract events.
 * These mirror the Rust event structs defined in contracts/ RustAcademy/src/events.rs
 */

export type SorobanEventType =
  | "EscrowDeposited"
  | "EscrowWithdrawn"
  | "EscrowRefunded"
  | "EscrowDisputed"
  | "EscrowFinalized"
  | "PartialPayment"
  | "ArbiterVoteCast"
  | "DisputeResolved"
  | "DisputeTimeoutSet"
  | "DisputeAutoResolved"
  | "PrivacyToggled"
  | "EphemeralKeyRegistered"
  | "StealthWithdrawn"
  | "AdminChanged"
  | "ContractInitialized"
  | "ContractMigrated"
  | "ContractPaused"
  | "ContractUpgraded"
  | "DisputeExpiryActionSet"
  | "DisputeTimeoutConfigSet"
  | "EmergencyModeActivated"
  | "FeeCollectorRotated"
  | "FeeConfigChanged"
  | "HookRegistered"
  | "HookUnregistered"
  | "PauseFlagsChanged"
  | "PerAssetFeeSet"
  | "PlatformWalletChanged"
  | "UpgradeCompleted"
  | "UpgradeStarted"
  | "UpgradeWindowSet";

export interface BaseContractEvent {
  eventType: SorobanEventType;
  /** Schema version read from the event payload (1 = legacy, 2+ = versioned). */
  schemaVersion: number;
  topicNamespace?: string;
  txHash: string;
  ledgerSequence: number;
  pagingToken: string;
  contractTimestamp: bigint;
  /**
   * Ledger sequence reported by the contract itself (from `env.ledger().sequence()`).
   * Present in v2+ events that include the `ledger_sequence` payload field.
   * Backends SHOULD validate this matches the Horizon-reported `ledgerSequence` to
   * detect tampered or mis-routed event payloads. Use together with `txHash` and
   * `pagingToken` as a complete, stable deduplication key for replay safety.
   */
  contractLedgerSequence?: number;
}

// ── Escrow events ─────────────────────────────────────────────────────────────

export interface EscrowDepositedEvent extends BaseContractEvent {
  eventType: "EscrowDeposited";
  commitment: string; // hex
  owner: string;
  token: string;
  amount: bigint;
  amountPaid?: bigint;
  expiresAt: bigint;
}

export interface EscrowWithdrawnEvent extends BaseContractEvent {
  eventType: "EscrowWithdrawn";
  commitment: string;
  owner: string;
  token: string;
  amount: bigint;
}

export interface EscrowRefundedEvent extends BaseContractEvent {
  eventType: "EscrowRefunded";
  commitment: string;
  owner: string;
  token: string;
  amount: bigint;
}

export interface EscrowDisputedEvent extends BaseContractEvent {
  eventType: "EscrowDisputed";
  commitment: string;
  arbiter: string;
}

export interface EscrowFinalizedEvent extends BaseContractEvent {
  eventType: "EscrowFinalized";
  commitment: string;
  owner: string;
  token: string;
  totalAmount: bigint;
}

export interface PartialPaymentEvent extends BaseContractEvent {
  eventType: "PartialPayment";
  commitment: string;
  payer: string;
  token: string;
  paymentAmount: bigint;
  amountPaid: bigint;
  amountDue: bigint;
}

// ── Dispute events ────────────────────────────────────────────────────────────

export interface ArbiterVoteCastEvent extends BaseContractEvent {
  eventType: "ArbiterVoteCast";
  commitment: string;
  arbiter: string;
  resolveForOwner: boolean;
  voteCount: number;
  threshold: number;
}

export interface DisputeResolvedEvent extends BaseContractEvent {
  eventType: "DisputeResolved";
  commitment: string;
  resolvedForOwner: boolean;
  totalVotes: number;
  threshold: number;
  amount: bigint;
}

export interface DisputeTimeoutSetEvent extends BaseContractEvent {
  eventType: "DisputeTimeoutSet";
  commitment: string;
  action: string;
  expiresAt: bigint;
}

export interface DisputeAutoResolvedEvent extends BaseContractEvent {
  eventType: "DisputeAutoResolved";
  commitment: string;
  action: string;
  recipient: string;
  amount: bigint;
}

// ── Privacy events ────────────────────────────────────────────────────────────

export interface PrivacyToggledEvent extends BaseContractEvent {
  eventType: "PrivacyToggled";
  owner: string;
  enabled: boolean;
}

// ── Stealth events ────────────────────────────────────────────────────────────

/** Emitted when a sender registers an ephemeral public key and locks funds for a stealth recipient. */
export interface EphemeralKeyRegisteredEvent extends BaseContractEvent {
  eventType: "EphemeralKeyRegistered";
  /** One-time stealth address (hex). */
  stealthAddress: string;
  /** Sender's ephemeral public key (hex). */
  ephPub: string;
  token: string;
  amount: bigint;
  expiresAt: bigint;
}

/** Emitted when a recipient withdraws funds from a stealth escrow. */
export interface StealthWithdrawnEvent extends BaseContractEvent {
  eventType: "StealthWithdrawn";
  /** One-time stealth address (hex). */
  stealthAddress: string;
  /** Recipient's real address – only revealed at withdrawal time. */
  recipient: string;
  token: string;
  amount: bigint;
}

// ── Admin events ──────────────────────────────────────────────────────────────

export interface AdminChangedEvent extends BaseContractEvent {
  eventType: "AdminChanged";
  oldAdmin: string;
  newAdmin: string;
}

export interface ContractInitializedEvent extends BaseContractEvent {
  eventType: "ContractInitialized";
  admin: string;
  contractVersion: number;
  eventSchemaVersion: number;
  paused: boolean;
}

export interface ContractMigratedEvent extends BaseContractEvent {
  eventType: "ContractMigrated";
  admin: string;
  fromVersion: number;
  toVersion: number;
}

export interface ContractPausedEvent extends BaseContractEvent {
  eventType: "ContractPaused";
  admin: string;
  paused: boolean;
}

export interface ContractUpgradedEvent extends BaseContractEvent {
  eventType: "ContractUpgraded";
  newWasmHash: string;
  admin: string;
}

export interface DisputeExpiryActionSetEvent extends BaseContractEvent {
  eventType: "DisputeExpiryActionSet";
  action: string;
}

export interface DisputeTimeoutConfigSetEvent extends BaseContractEvent {
  eventType: "DisputeTimeoutConfigSet";
  timeoutSecs: bigint;
}

export interface EmergencyModeActivatedEvent extends BaseContractEvent {
  eventType: "EmergencyModeActivated";
  admin: string;
}

export interface FeeCollectorRotatedEvent extends BaseContractEvent {
  eventType: "FeeCollectorRotated";
  newCollector: string;
  rotationIndex: number;
}

export interface FeeConfigChangedEvent extends BaseContractEvent {
  eventType: "FeeConfigChanged";
  feeBps: number;
}

export interface HookRegisteredEvent extends BaseContractEvent {
  eventType: "HookRegistered";
  hookContract: string;
}

export interface HookUnregisteredEvent extends BaseContractEvent {
  eventType: "HookUnregistered";
  hookContract: string;
}

export interface PauseFlagsChangedEvent extends BaseContractEvent {
  eventType: "PauseFlagsChanged";
  admin: string;
  flagsEnabled: bigint;
  flagsDisabled: bigint;
}

export interface PerAssetFeeSetEvent extends BaseContractEvent {
  eventType: "PerAssetFeeSet";
  token: string;
  feeBps: number;
  arbiterBps: number;
}

export interface PlatformWalletChangedEvent extends BaseContractEvent {
  eventType: "PlatformWalletChanged";
  wallet: string;
}

export interface UpgradeCompletedEvent extends BaseContractEvent {
  eventType: "UpgradeCompleted";
  admin: string;
  oldVersion: number;
  newVersion: number;
}

export interface UpgradeStartedEvent extends BaseContractEvent {
  eventType: "UpgradeStarted";
  admin: string;
  oldVersion: number;
  newVersion: number;
  newWasmHash: string;
  windowStart: bigint;
  windowEnd: bigint;
}

export interface UpgradeWindowSetEvent extends BaseContractEvent {
  eventType: "UpgradeWindowSet";
  admin: string;
  windowStart: bigint;
  windowEnd: bigint;
}

// ── Union types ───────────────────────────────────────────────────────────────

export type RustAcademyContractEvent =
  | EscrowDepositedEvent
  | EscrowWithdrawnEvent
  | EscrowRefundedEvent
  | EscrowDisputedEvent
  | EscrowFinalizedEvent
  | PartialPaymentEvent
  | ArbiterVoteCastEvent
  | DisputeResolvedEvent
  | DisputeTimeoutSetEvent
  | DisputeAutoResolvedEvent
  | PrivacyToggledEvent
  | EphemeralKeyRegisteredEvent
  | StealthWithdrawnEvent
  | AdminChangedEvent
  | ContractInitializedEvent
  | ContractMigratedEvent
  | ContractPausedEvent
  | ContractUpgradedEvent
  | DisputeExpiryActionSetEvent
  | DisputeTimeoutConfigSetEvent
  | EmergencyModeActivatedEvent
  | FeeCollectorRotatedEvent
  | FeeConfigChangedEvent
  | HookRegisteredEvent
  | HookUnregisteredEvent
  | PauseFlagsChangedEvent
  | PerAssetFeeSetEvent
  | PlatformWalletChangedEvent
  | UpgradeCompletedEvent
  | UpgradeStartedEvent
  | UpgradeWindowSetEvent;

export type EscrowEvent =
  | EscrowDepositedEvent
  | EscrowWithdrawnEvent
  | EscrowRefundedEvent;

export type AdminEvent =
  | ContractPausedEvent
  | AdminChangedEvent
  | ContractUpgradedEvent
  | ContractInitializedEvent
  | ContractMigratedEvent
  | EmergencyModeActivatedEvent
  | FeeCollectorRotatedEvent
  | FeeConfigChangedEvent
  | HookRegisteredEvent
  | HookUnregisteredEvent
  | PauseFlagsChangedEvent
  | PerAssetFeeSetEvent
  | PlatformWalletChangedEvent
  | UpgradeCompletedEvent
  | UpgradeStartedEvent
  | UpgradeWindowSetEvent
  | DisputeExpiryActionSetEvent
  | DisputeTimeoutConfigSetEvent;

export type StealthEvent = EphemeralKeyRegisteredEvent | StealthWithdrawnEvent;

export type DisputeEvent =
  | ArbiterVoteCastEvent
  | DisputeResolvedEvent
  | DisputeTimeoutSetEvent
  | DisputeAutoResolvedEvent;
