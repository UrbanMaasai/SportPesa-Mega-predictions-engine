# Security Specification and Threat Modeling

This document outlines the security architecture and threat models for Firestore collections used in the SportPesa Jackpot Accumulator client-persistence system.

## 1. Data Invariants

1. **User Ownership Constraint**: A user can only read, create, update, or delete profiles and coupon records that belong directly to their own Authenticated UID (`request.auth.uid`). No cross-user reads or modifications are allowed.
2. **Strict Structure**: Elements in `selections` must represent valid outcomes (`'1', 'X', '2'`).
3. **Verified Sign-In**: To block bot-spam and anonymous resource poisoning, only users authenticated with a verified email can record profiles and coupons. (`request.auth.token.email_verified == true`).
4. **ID Matches Holder Location**: The document ID for the UserProfile must exactly match the `userId` in the document body and the verified credential UID in `request.auth.uid`.
5. **No Immutable Overwrites**: Once `createdAt` has been synchronized on creation to `request.time`, it cannot be modified by any update.

---

## 2. The "Dirty Dozen" Security Violations Payloads

Here are twelve payloads designed to bypass client validation and exploit gaps:

### P1: Spoofed Profile Creation (Privilege Escalation attempt)
An authenticated user attempts to write another user's profile.
- **Path**: `/users/another_victim_uid`
- **Payload**: `{"uid": "another_victim_uid", "email": "victim@gmail.com"}`
- **Desired Result**: `PERMISSION_DENIED`

### P2: Anonymous User Write (Unverified Resource Exhaustion)
An unverified or anonymous user attempts to write a user profile.
- **Path**: `/users/attacker_uid` (unverified email)
- **Payload**: `{"uid": "attacker_uid", "email": "attacker@gmail.com"}`
- **Desired Result**: `PERMISSION_DENIED`

### P3: Immutable field tamper (Overwrite original create date)
An authenticated user attempts to rewrite `createdAt` in an existing coupon.
- **Path**: `/users/my_uid/coupons/coupon_1`
- **Payload**: `{"id": "coupon_1", "userId": "my_uid", "name": "Hack Slip", "subJackpotSize": 17, "selections": {}, "createdAt": "2020-01-01T00:00:00Z"}`
- **Desired Result**: `PERMISSION_DENIED`

### P4: ID Poisoning Attack (Oversized payload injection)
An attacker attempts to write a coupon using an extremely large string as the ID to cause resource exhaustion.
- **Path**: `/users/my_uid/coupons/extremely_large_hex_string_exceeding_128_characters`
- **Payload**: `{"id": "...", "userId": "my_uid", "name": "Big ID", "subJackpotSize": 17, "selections": {}, "createdAt": "request.time"}`
- **Desired Result**: `PERMISSION_DENIED`

### P5: Blanket query attack (Unrestricted Listing)
An authenticated user attempts to query across all users' coupons without filter.
- **Filter**: None (fetching `/users/{any}/coupons`)
- **Desired Result**: `PERMISSION_DENIED` (Every query must check `resource.data.userId == request.auth.uid` or reside in the isolated user sub-collection)

### P6: Empty Name Schema Violation
A user attempts to save a coupon with an empty name or missing schema keys.
- **Path**: `/users/my_uid/coupons/coupon_1`
- **Payload**: `{"id": "coupon_1", "userId": "my_uid", "subJackpotSize": 17, "selections": {}}`
- **Desired Result**: `PERMISSION_DENIED` (Required fields like `name` and `createdAt` are missing)

### P7: Ghost Attribute Injection (Anti-Update-Gap)
An attacker attempts to include a "Ghost Field" like `isVerifiedAdmin: true` into their user document.
- **Path**: `/users/my_uid`
- **Payload**: `{"uid": "my_uid", "email": "me@gmail.com", "isVerifiedAdmin": true}`
- **Desired Result**: `PERMISSION_DENIED`

### P8: Size Limit Bypass (Denial of Wallet)
An attacker attempts to write an enormous array model or huge name string to inflate storage charges.
- **Path**: `/users/my_uid/coupons/coupon_1`
- **Payload**: `{"id": "coupon_1", "userId": "my_uid", "name": "A...[1MB name]...", "subJackpotSize": 17, "selections": {}, "createdAt": "request.time"}`
- **Desired Result**: `PERMISSION_DENIED`

### P9: Invalid Sub-Jackpot sizes
A user attempts to save a coupon with a sub-jackpot size of 4.
- **Path**: `/users/my_uid/coupons/coupon_1`
- **Payload**: `{"id": "coupon_1", "userId": "my_uid", "name": "Test Size", "subJackpotSize": 4, "selections": {}, "createdAt": "request.time"}`
- **Desired Result**: `PERMISSION_DENIED` (Size must be standard Kenyan MJP values e.g. 12, 13, 14, 15, 17)

### P10: Self-Assigned Role change
An authenticated user attempts to add an administrative marker document under the `admins` collection.
- **Path**: `/admins/my_uid`
- **Payload**: `{"role": "superuser"}`
- **Desired Result**: `PERMISSION_DENIED`

### P11: Poison Outcome Types
An attacker saves a selection map where choices are booleans instead of valid string outcomes ('1', 'X', '2').
- **Path**: `/users/my_uid/coupons/coupon_1`
- **Payload**: `{"id": "coupon_1", "userId": "my_uid", "name": "Fake choices", "subJackpotSize": 17, "selections": {"1": [true, false]}, "createdAt": "request.time"}`
- **Desired Result**: `PERMISSION_DENIED`

### P12: Cross-Tenant Coupon Injection
A user tries to create a coupon belonging to `victim_uid` inside their own collection slot.
- **Path**: `/users/my_uid/coupons/coupon_1`
- **Payload**: `{"id": "coupon_1", "userId": "victim_uid", "name": "Spoofed Owner", "subJackpotSize": 17, "selections": {}, "createdAt": "request.time"}`
- **Desired Result**: `PERMISSION_DENIED` (userId inside coupon must match the request.auth.uid and path parameter user identifier)

---

## 3. Test Runner Specification

The verifying unit tests would test each scenario using `@firebase/rules-unit-testing` or similar infrastructure blocks, asserting complete rejection across all 12 paths.
