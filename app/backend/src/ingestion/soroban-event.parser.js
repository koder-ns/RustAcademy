"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SorobanEventParser = exports.MAX_SUPPORTED_SCHEMA_VERSION = void 0;
var common_1 = require("@nestjs/common");
var stellar_sdk_1 = require("@stellar/stellar-sdk");
var event_schema_1 = require("./event-schema");
/** Maximum schema version this indexer understands. */
exports.MAX_SUPPORTED_SCHEMA_VERSION = 2;
/**
 * Parses raw Horizon Soroban contract event records into typed domain events.
 *
 * Canonical topic layout:
 *  Topic[0] = stable  RustAcademy testnet namespace (for example TOPIC_ESCROW)
 *  Topic[1] = event name symbol
 *  Topic[2+] = indexed fields (commitment, owner, admin, etc.)
 *
 * Data = struct with remaining fields encoded as XDR ScVal.
 *
 * Legacy events used Topic[0] = event name. The parser keeps a compatibility
 * path for those events and marks them with schemaVersion=1.
 */
var SorobanEventParser = /** @class */ (function () {
    function SorobanEventParser(onUnknownSchemaVersion) {
        this.onUnknownSchemaVersion = onUnknownSchemaVersion;
        this.logger = new common_1.Logger(SorobanEventParser.name);
    }
    /**
     * Attempt to parse a raw Horizon contract event.
     * Returns null when the event is unrecognised, malformed, or carries an
     * unsupported schema version.
     */
    SorobanEventParser.prototype.parse = function (raw) {
        var _a;
        try {
            var topics = raw.topic.map(function (t) { return stellar_sdk_1.xdr.ScVal.fromXDR(t, "base64"); });
            var dataVal = stellar_sdk_1.xdr.ScVal.fromXDR(raw.value.xdr, "base64");
            if (topics.length === 0)
                return null;
            var layout = this.resolveTopicLayout(topics);
            if (!layout)
                return null;
            var schemaVersion = this.extractSchemaVersionFromData(dataVal);
            if (schemaVersion > exports.MAX_SUPPORTED_SCHEMA_VERSION) {
                this.logger.warn("Skipping event ".concat(layout.eventName, " paging_token=").concat(raw.paging_token, ": ") +
                    "schema_version=".concat(schemaVersion, " exceeds max supported (").concat(exports.MAX_SUPPORTED_SCHEMA_VERSION, ")"));
                (_a = this.onUnknownSchemaVersion) === null || _a === void 0 ? void 0 : _a.call(this, layout.eventName, schemaVersion, raw.paging_token);
                return null;
            }
            if (!this.isCompatibleSchemaVersion(layout.eventName, schemaVersion)) {
                this.logger.warn("Unsupported ".concat(layout.eventName, " schema version ").concat(schemaVersion));
                return null;
            }
            var contractLedgerSequence = this.extractLedgerSequenceFromData(dataVal);
            if (contractLedgerSequence !== undefined && contractLedgerSequence !== raw.ledger) {
                this.logger.warn("Replay metadata mismatch for ".concat(layout.eventName, " paging_token=").concat(raw.paging_token, ": ") +
                    "contract_ledger_sequence=".concat(contractLedgerSequence, " but Horizon ledger=").concat(raw.ledger, ". ") +
                    "Event will still be parsed; investigate potential replay tampering.");
            }
            var base = {
                schemaVersion: schemaVersion,
                topicNamespace: layout.topicNamespace,
                txHash: raw.transaction_hash,
                ledgerSequence: raw.ledger,
                pagingToken: raw.paging_token,
                contractTimestamp: this.extractTimestampFromData(dataVal),
                contractLedgerSequence: contractLedgerSequence,
            };
            switch (layout.eventName) {
                case "EscrowDeposited":
                    return this.parseEscrowDeposited(topics, dataVal, base, layout.indexedOffset);
                case "EscrowWithdrawn":
                    return this.parseEscrowWithdrawn(topics, dataVal, base, layout.indexedOffset);
                case "EscrowRefunded":
                    return this.parseEscrowRefunded(topics, dataVal, base, layout.indexedOffset);
                case "EscrowDisputed":
                    return this.parseEscrowDisputed(topics, dataVal, base, layout.indexedOffset);
                case "EscrowFinalized":
                    return this.parseEscrowFinalized(topics, dataVal, base, layout.indexedOffset);
                case "PartialPayment":
                    return this.parsePartialPayment(topics, dataVal, base, layout.indexedOffset);
                case "ArbiterVoteCast":
                    return this.parseArbiterVoteCast(topics, dataVal, base, layout.indexedOffset);
                case "DisputeResolved":
                    return this.parseDisputeResolved(topics, dataVal, base, layout.indexedOffset);
                case "DisputeTimeoutSet":
                    return this.parseDisputeTimeoutSet(topics, dataVal, base, layout.indexedOffset);
                case "DisputeAutoResolved":
                    return this.parseDisputeAutoResolved(topics, dataVal, base, layout.indexedOffset);
                case "PrivacyToggled":
                    return this.parsePrivacyToggled(topics, dataVal, base, layout.indexedOffset);
                case "EphemeralKeyRegistered":
                    return this.parseEphemeralKeyRegistered(topics, dataVal, base, layout.indexedOffset);
                case "StealthWithdrawn":
                    return this.parseStealthWithdrawn(topics, dataVal, base, layout.indexedOffset);
                case "AdminChanged":
                    return this.parseAdminChanged(topics, dataVal, base, layout.indexedOffset);
                case "ContractInitialized":
                    return this.parseContractInitialized(topics, dataVal, base, layout.indexedOffset);
                case "ContractMigrated":
                    return this.parseContractMigrated(topics, dataVal, base, layout.indexedOffset);
                case "ContractPaused":
                    return this.parseContractPaused(topics, dataVal, base, layout.indexedOffset);
                case "ContractUpgraded":
                    return this.parseContractUpgraded(topics, dataVal, base, layout.indexedOffset);
                case "DisputeExpiryActionSet":
                    return this.parseDisputeExpiryActionSet(topics, dataVal, base, layout.indexedOffset);
                case "DisputeTimeoutConfigSet":
                    return this.parseDisputeTimeoutConfigSet(topics, dataVal, base, layout.indexedOffset);
                case "EmergencyModeActivated":
                    return this.parseEmergencyModeActivated(topics, dataVal, base, layout.indexedOffset);
                case "FeeCollectorRotated":
                    return this.parseFeeCollectorRotated(topics, dataVal, base, layout.indexedOffset);
                case "FeeConfigChanged":
                    return this.parseFeeConfigChanged(topics, dataVal, base, layout.indexedOffset);
                case "HookRegistered":
                    return this.parseHookRegistered(topics, dataVal, base, layout.indexedOffset);
                case "HookUnregistered":
                    return this.parseHookUnregistered(topics, dataVal, base, layout.indexedOffset);
                case "PauseFlagsChanged":
                    return this.parsePauseFlagsChanged(topics, dataVal, base, layout.indexedOffset);
                case "PerAssetFeeSet":
                    return this.parsePerAssetFeeSet(topics, dataVal, base, layout.indexedOffset);
                case "PlatformWalletChanged":
                    return this.parsePlatformWalletChanged(topics, dataVal, base, layout.indexedOffset);
                case "UpgradeCompleted":
                    return this.parseUpgradeCompleted(topics, dataVal, base, layout.indexedOffset);
                case "UpgradeStarted":
                    return this.parseUpgradeStarted(topics, dataVal, base, layout.indexedOffset);
                case "UpgradeWindowSet":
                    return this.parseUpgradeWindowSet(topics, dataVal, base, layout.indexedOffset);
                default:
                    this.logger.debug("Unrecognised event name: ".concat(layout.eventName));
                    return null;
            }
        }
        catch (err) {
            this.logger.warn("Failed to parse contract event ".concat(raw.paging_token, ": ").concat(err.message));
            return null;
        }
    };
    // ---------------------------------------------------------------------------
    // Escrow event parsers
    // ---------------------------------------------------------------------------
    SorobanEventParser.prototype.parseEscrowDeposited = function (topics, data, base, indexedOffset) {
        var _a, _b;
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var owner = this.decodeAddress(topics[indexedOffset + 1]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "EscrowDeposited" }, base), { commitment: commitment, owner: owner, token: this.decodeAddress(map["token"]), amount: BigInt((0, stellar_sdk_1.scValToNative)((_a = map["amount_due"]) !== null && _a !== void 0 ? _a : map["amount"])), amountPaid: BigInt((0, stellar_sdk_1.scValToNative)((_b = map["amount_paid"]) !== null && _b !== void 0 ? _b : map["amount"])), expiresAt: BigInt((0, stellar_sdk_1.scValToNative)(map["expires_at"])) });
    };
    SorobanEventParser.prototype.parseEscrowWithdrawn = function (topics, data, base, indexedOffset) {
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var owner = this.decodeAddress(topics[indexedOffset + 1]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "EscrowWithdrawn" }, base), { commitment: commitment, owner: owner, token: this.decodeAddress(map["token"]), amount: BigInt((0, stellar_sdk_1.scValToNative)(map["amount"])) });
    };
    SorobanEventParser.prototype.parseEscrowRefunded = function (topics, data, base, indexedOffset) {
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var owner = this.decodeAddress(topics[indexedOffset + 1]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "EscrowRefunded" }, base), { commitment: commitment, owner: owner, token: this.decodeAddress(map["token"]), amount: BigInt((0, stellar_sdk_1.scValToNative)(map["amount"])) });
    };
    SorobanEventParser.prototype.parseEscrowDisputed = function (topics, data, base, indexedOffset) {
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var arbiter = this.decodeAddress(topics[indexedOffset + 1]);
        return __assign(__assign({ eventType: "EscrowDisputed" }, base), { commitment: commitment, arbiter: arbiter });
    };
    SorobanEventParser.prototype.parseEscrowFinalized = function (topics, data, base, indexedOffset) {
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var owner = this.decodeAddress(topics[indexedOffset + 1]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "EscrowFinalized" }, base), { commitment: commitment, owner: owner, token: this.decodeAddress(map["token"]), totalAmount: BigInt((0, stellar_sdk_1.scValToNative)(map["total_amount"])) });
    };
    SorobanEventParser.prototype.parsePartialPayment = function (topics, data, base, indexedOffset) {
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var payer = this.decodeAddress(topics[indexedOffset + 1]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "PartialPayment" }, base), { commitment: commitment, payer: payer, token: this.decodeAddress(map["token"]), paymentAmount: BigInt((0, stellar_sdk_1.scValToNative)(map["payment_amount"])), amountPaid: BigInt((0, stellar_sdk_1.scValToNative)(map["amount_paid"])), amountDue: BigInt((0, stellar_sdk_1.scValToNative)(map["amount_due"])) });
    };
    // ---------------------------------------------------------------------------
    // Dispute event parsers
    // ---------------------------------------------------------------------------
    SorobanEventParser.prototype.parseArbiterVoteCast = function (topics, data, base, indexedOffset) {
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var arbiter = this.decodeAddress(topics[indexedOffset + 1]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "ArbiterVoteCast" }, base), { commitment: commitment, arbiter: arbiter, resolveForOwner: Boolean((0, stellar_sdk_1.scValToNative)(map["resolve_for_owner"])), voteCount: Number((0, stellar_sdk_1.scValToNative)(map["vote_count"])), threshold: Number((0, stellar_sdk_1.scValToNative)(map["threshold"])) });
    };
    SorobanEventParser.prototype.parseDisputeResolved = function (topics, data, base, indexedOffset) {
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var resolvedForOwner = Boolean((0, stellar_sdk_1.scValToNative)(topics[indexedOffset + 1]));
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "DisputeResolved" }, base), { commitment: commitment, resolvedForOwner: resolvedForOwner, totalVotes: Number((0, stellar_sdk_1.scValToNative)(map["total_votes"])), threshold: Number((0, stellar_sdk_1.scValToNative)(map["threshold"])), amount: BigInt((0, stellar_sdk_1.scValToNative)(map["amount"])) });
    };
    SorobanEventParser.prototype.parseDisputeTimeoutSet = function (topics, data, base, indexedOffset) {
        var _a;
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "DisputeTimeoutSet" }, base), { commitment: commitment, action: (_a = this.decodeSymbol(map["action"])) !== null && _a !== void 0 ? _a : "", expiresAt: BigInt((0, stellar_sdk_1.scValToNative)(map["expires_at"])) });
    };
    SorobanEventParser.prototype.parseDisputeAutoResolved = function (topics, data, base, indexedOffset) {
        var _a;
        var commitment = this.decodeBytes32Hex(topics[indexedOffset]);
        var action = (_a = this.decodeSymbol(topics[indexedOffset + 1])) !== null && _a !== void 0 ? _a : "";
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "DisputeAutoResolved" }, base), { commitment: commitment, action: action, recipient: this.decodeAddress(map["recipient"]), amount: BigInt((0, stellar_sdk_1.scValToNative)(map["amount"])) });
    };
    // ---------------------------------------------------------------------------
    // Admin / Privacy event parsers
    // ---------------------------------------------------------------------------
    SorobanEventParser.prototype.parsePrivacyToggled = function (topics, data, base, indexedOffset) {
        var owner = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "PrivacyToggled" }, base), { owner: owner, enabled: Boolean((0, stellar_sdk_1.scValToNative)(map["enabled"])) });
    };
    SorobanEventParser.prototype.parseContractPaused = function (topics, data, base, indexedOffset) {
        var admin = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "ContractPaused" }, base), { admin: admin, paused: Boolean((0, stellar_sdk_1.scValToNative)(map["paused"])) });
    };
    SorobanEventParser.prototype.parseAdminChanged = function (topics, data, base, indexedOffset) {
        var oldAdmin = this.decodeAddress(topics[indexedOffset]);
        var newAdmin = this.decodeAddress(topics[indexedOffset + 1]);
        return __assign(__assign({ eventType: "AdminChanged" }, base), { oldAdmin: oldAdmin, newAdmin: newAdmin });
    };
    SorobanEventParser.prototype.parseContractUpgraded = function (topics, data, base, indexedOffset) {
        var newWasmHash = this.decodeBytes32Hex(topics[indexedOffset]);
        var admin = this.decodeAddress(topics[indexedOffset + 1]);
        return __assign(__assign({ eventType: "ContractUpgraded" }, base), { newWasmHash: newWasmHash, admin: admin });
    };
    SorobanEventParser.prototype.parseContractInitialized = function (topics, data, base, indexedOffset) {
        var admin = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "ContractInitialized" }, base), { admin: admin, contractVersion: Number((0, stellar_sdk_1.scValToNative)(map["contract_version"])), eventSchemaVersion: Number((0, stellar_sdk_1.scValToNative)(map["event_schema_version"])), paused: Boolean((0, stellar_sdk_1.scValToNative)(map["paused"])) });
    };
    SorobanEventParser.prototype.parseContractMigrated = function (topics, data, base, indexedOffset) {
        var admin = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "ContractMigrated" }, base), { admin: admin, fromVersion: Number((0, stellar_sdk_1.scValToNative)(map["from_version"])), toVersion: Number((0, stellar_sdk_1.scValToNative)(map["to_version"])) });
    };
    SorobanEventParser.prototype.parseDisputeExpiryActionSet = function (topics, data, base, _indexedOffset) {
        var _a;
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "DisputeExpiryActionSet" }, base), { action: (_a = this.decodeSymbol(map["action"])) !== null && _a !== void 0 ? _a : "" });
    };
    SorobanEventParser.prototype.parseDisputeTimeoutConfigSet = function (topics, data, base, _indexedOffset) {
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "DisputeTimeoutConfigSet" }, base), { timeoutSecs: BigInt((0, stellar_sdk_1.scValToNative)(map["timeout_secs"])) });
    };
    SorobanEventParser.prototype.parseEmergencyModeActivated = function (topics, data, base, indexedOffset) {
        var admin = this.decodeAddress(topics[indexedOffset]);
        return __assign(__assign({ eventType: "EmergencyModeActivated" }, base), { admin: admin });
    };
    SorobanEventParser.prototype.parseFeeCollectorRotated = function (topics, data, base, indexedOffset) {
        var newCollector = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "FeeCollectorRotated" }, base), { newCollector: newCollector, rotationIndex: Number((0, stellar_sdk_1.scValToNative)(map["rotation_index"])) });
    };
    SorobanEventParser.prototype.parseFeeConfigChanged = function (topics, data, base, _indexedOffset) {
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "FeeConfigChanged" }, base), { feeBps: Number((0, stellar_sdk_1.scValToNative)(map["fee_bps"])) });
    };
    SorobanEventParser.prototype.parseHookRegistered = function (topics, data, base, indexedOffset) {
        var hookContract = this.decodeAddress(topics[indexedOffset]);
        return __assign(__assign({ eventType: "HookRegistered" }, base), { hookContract: hookContract });
    };
    SorobanEventParser.prototype.parseHookUnregistered = function (topics, data, base, indexedOffset) {
        var hookContract = this.decodeAddress(topics[indexedOffset]);
        return __assign(__assign({ eventType: "HookUnregistered" }, base), { hookContract: hookContract });
    };
    SorobanEventParser.prototype.parsePauseFlagsChanged = function (topics, data, base, indexedOffset) {
        var admin = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "PauseFlagsChanged" }, base), { admin: admin, flagsEnabled: BigInt((0, stellar_sdk_1.scValToNative)(map["flags_enabled"])), flagsDisabled: BigInt((0, stellar_sdk_1.scValToNative)(map["flags_disabled"])) });
    };
    SorobanEventParser.prototype.parsePerAssetFeeSet = function (topics, data, base, indexedOffset) {
        var token = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "PerAssetFeeSet" }, base), { token: token, feeBps: Number((0, stellar_sdk_1.scValToNative)(map["fee_bps"])), arbiterBps: Number((0, stellar_sdk_1.scValToNative)(map["arbiter_bps"])) });
    };
    SorobanEventParser.prototype.parsePlatformWalletChanged = function (topics, data, base, indexedOffset) {
        var wallet = this.decodeAddress(topics[indexedOffset]);
        return __assign(__assign({ eventType: "PlatformWalletChanged" }, base), { wallet: wallet });
    };
    SorobanEventParser.prototype.parseUpgradeCompleted = function (topics, data, base, indexedOffset) {
        var admin = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "UpgradeCompleted" }, base), { admin: admin, oldVersion: Number((0, stellar_sdk_1.scValToNative)(map["old_version"])), newVersion: Number((0, stellar_sdk_1.scValToNative)(map["new_version"])) });
    };
    SorobanEventParser.prototype.parseUpgradeStarted = function (topics, data, base, indexedOffset) {
        var admin = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "UpgradeStarted" }, base), { admin: admin, oldVersion: Number((0, stellar_sdk_1.scValToNative)(map["old_version"])), newVersion: Number((0, stellar_sdk_1.scValToNative)(map["new_version"])), newWasmHash: this.decodeBytes32HexFromMap(map["new_wasm_hash"]), windowStart: BigInt((0, stellar_sdk_1.scValToNative)(map["window_start"])), windowEnd: BigInt((0, stellar_sdk_1.scValToNative)(map["window_end"])) });
    };
    SorobanEventParser.prototype.parseUpgradeWindowSet = function (topics, data, base, indexedOffset) {
        var admin = this.decodeAddress(topics[indexedOffset]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "UpgradeWindowSet" }, base), { admin: admin, windowStart: BigInt((0, stellar_sdk_1.scValToNative)(map["window_start"])), windowEnd: BigInt((0, stellar_sdk_1.scValToNative)(map["window_end"])) });
    };
    // ---------------------------------------------------------------------------
    // Stealth address event parsers (Privacy v2 – Issue #157)
    // ---------------------------------------------------------------------------
    SorobanEventParser.prototype.parseEphemeralKeyRegistered = function (topics, data, base, indexedOffset) {
        var _a;
        var stealthAddress = this.decodeBytes32Hex(topics[indexedOffset]);
        var ephPub = this.decodeBytes32Hex(topics[indexedOffset + 1]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "EphemeralKeyRegistered" }, base), { stealthAddress: stealthAddress, ephPub: ephPub, token: this.decodeAddress(map["token"]), amount: BigInt((0, stellar_sdk_1.scValToNative)((_a = map["amount_due"]) !== null && _a !== void 0 ? _a : map["amount"])), expiresAt: BigInt((0, stellar_sdk_1.scValToNative)(map["expires_at"])) });
    };
    SorobanEventParser.prototype.parseStealthWithdrawn = function (topics, data, base, indexedOffset) {
        var stealthAddress = this.decodeBytes32Hex(topics[indexedOffset]);
        var recipient = this.decodeAddress(topics[indexedOffset + 1]);
        var map = this.dataToMap(data);
        return __assign(__assign({ eventType: "StealthWithdrawn" }, base), { stealthAddress: stealthAddress, recipient: recipient, token: this.decodeAddress(map["token"]), amount: BigInt((0, stellar_sdk_1.scValToNative)(map["amount"])) });
    };
    // ---------------------------------------------------------------------------
    // XDR decode helpers
    // ---------------------------------------------------------------------------
    SorobanEventParser.prototype.decodeSymbol = function (val) {
        try {
            return val.sym().toString();
        }
        catch (_a) {
            return null;
        }
    };
    SorobanEventParser.prototype.resolveTopicLayout = function (topics) {
        var first = this.decodeSymbol(topics[0]);
        if (!first)
            return null;
        var canonicalTopics = new Set(Object.values(event_schema_1.RustAcademy_EVENT_TOPICS));
        if (canonicalTopics.has(first)) {
            var second = topics[1] ? this.decodeSymbol(topics[1]) : null;
            if (!second || !(second in event_schema_1.RustAcademy_EVENT_SCHEMA_CONTRACTS))
                return null;
            var contract = event_schema_1.RustAcademy_EVENT_SCHEMA_CONTRACTS[second];
            if (contract.topic !== first)
                return null;
            return {
                eventName: second,
                topicNamespace: first,
                indexedOffset: 2,
            };
        }
        if (first in event_schema_1.RustAcademy_EVENT_SCHEMA_CONTRACTS) {
            return {
                eventName: first,
                topicNamespace: "LEGACY",
                indexedOffset: 1,
            };
        }
        return null;
    };
    SorobanEventParser.prototype.isCompatibleSchemaVersion = function (eventName, schemaVersion) {
        var contract = event_schema_1.RustAcademy_EVENT_SCHEMA_CONTRACTS[eventName];
        return contract.compatibleVersions.includes(schemaVersion);
    };
    SorobanEventParser.prototype.decodeAddress = function (val) {
        var native = (0, stellar_sdk_1.scValToNative)(val);
        if (typeof native === "string")
            return native;
        // It may already be an Address object
        return stellar_sdk_1.Address.fromScVal(val).toString();
    };
    SorobanEventParser.prototype.decodeBytes32Hex = function (val) {
        var bytes = (0, stellar_sdk_1.scValToNative)(val);
        return bytes.toString("hex");
    };
    SorobanEventParser.prototype.decodeBytes32HexFromMap = function (val) {
        var bytes = (0, stellar_sdk_1.scValToNative)(val);
        return bytes.toString("hex");
    };
    /**
     * Converts a Soroban map ScVal into a plain JS Record keyed by field name.
     */
    SorobanEventParser.prototype.dataToMap = function (data) {
        var result = {};
        var mapEntries = data.map();
        for (var _i = 0, mapEntries_1 = mapEntries; _i < mapEntries_1.length; _i++) {
            var entry = mapEntries_1[_i];
            var key = entry.key().sym().toString();
            result[key] = entry.val();
        }
        return result;
    };
    SorobanEventParser.prototype.extractSchemaVersionFromData = function (data) {
        try {
            var map = this.dataToMap(data);
            if (map["schema_version"]) {
                return Number((0, stellar_sdk_1.scValToNative)(map["schema_version"]));
            }
        }
        catch (_a) {
            // Legacy events did not include schema_version.
        }
        return 1;
    };
    SorobanEventParser.prototype.extractTimestampFromData = function (data) {
        try {
            var map = this.dataToMap(data);
            if (map["timestamp"]) {
                return BigInt((0, stellar_sdk_1.scValToNative)(map["timestamp"]));
            }
        }
        catch (_a) {
            // ignore
        }
        return 0n;
    };
    SorobanEventParser.prototype.extractLedgerSequenceFromData = function (data) {
        try {
            var map = this.dataToMap(data);
            if (map["ledger_sequence"]) {
                return Number((0, stellar_sdk_1.scValToNative)(map["ledger_sequence"]));
            }
        }
        catch (_a) {
            // Optional field — absent in legacy v1 events
        }
        return undefined;
    };
    return SorobanEventParser;
}());
exports.SorobanEventParser = SorobanEventParser;
