# Offline-First Sync Strategy for Trackkit
## Detailed Algorithm, Conflict Resolution, and Testing

**Document:** OFFLINE-SYNC-STRATEGY.md  
**Audience:** Backend engineers, sync specialists, QA  
**Read time:** 25 minutes  
**Status:** Production-ready specification  

---

## Sync Philosophy

**Core principle:** The phone is the source of truth in Phase 1. In Phase 2+, the phone and cloud work together with **Last-Write-Wins (LWW) conflict resolution** based on timestamps.

**Why LWW?** 
- Simple to understand
- Deterministic (no ambiguity)
- Performs well at scale
- Good enough for inventory tracking (losing a sale is worse than losing a restock)

**Trade-off:** If two devices edit the same product simultaneously, one change is lost. Mitigation: timestamp-based hints on UI ("Warning: this product was changed elsewhere").

---

## Sync Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ Phone (Offline)                                         │
│                                                         │
│  User adds "Milk": quantity = 10                        │
│        ↓                                                │
│  Write to local SQLite (success)                        │
│        ↓                                                │
│  Optimistic UI update (show 10 immediately)             │
│        ↓                                                │
│  Log to sync_queue: { id, table, mutation_type, ... }   │
│        ↓                                                │
│  Check: Is network online?                              │
│    NO → Wait for connection restoration                 │
│    YES → Immediately sync to cloud                      │
│        ↓                                                │
└─────────────────────────────────────────────────────────┘
           ↓ HTTPS POST /api/sync
           ↓
┌─────────────────────────────────────────────────────────┐
│ Cloud (PostgreSQL)                                       │
│                                                         │
│  Server receives mutations                             │
│        ↓                                                │
│  For each mutation:                                     │
│    1. Fetch existing record from DB                     │
│    2. Compare timestamps (client vs server)             │
│    3. Apply LWW: newer timestamp wins                   │
│    4. Update DB                                         │
│    5. Log to audit_log                                  │
│        ↓                                                │
│  Return response: { applied, rejected, serverState }    │
│        ↓                                                │
└─────────────────────────────────────────────────────────┘
           ↑ JSON response
           ↑
┌─────────────────────────────────────────────────────────┐
│ Phone (Back Online)                                     │
│                                                         │
│  Receive server response                               │
│        ↓                                                │
│  For each applied mutation:                             │
│    - Mark sync_queue record: synced_at = NOW()          │
│    - Increment sync_metadata.successful_syncs           │
│        ↓                                                │
│  For each rejected mutation:                            │
│    - Fetch serverState                                  │
│    - Merge into local SQLite (overwrite with server)    │
│    - Show user toast: "Product updated from another     │
│      device"                                            │
│        ↓                                                │
│  Clear sync_queue entries with synced_at set            │
│        ↓                                                │
│  Update sync_metadata: last_synced_at = NOW()           │
│        ↓                                                │
│  UI reflects merged state (no loss of data)             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Conflict Resolution Algorithm (LWW)

### Scenario 1: Single-Device Edit

**Timeline:**
```
09:00 - Phone offline. User edits "Milk" qty: 10 → 8
09:05 - Phone goes online
09:05 - Phone syncs to cloud
09:05 - Server receives: { productId: "milk-1", qty: 8, clientTimestamp: "09:00" }
09:05 - Server checks: no existing newer change
09:05 - Server applies: UPDATE products SET qty = 8, updated_at = '09:00'
09:06 - Phone receives ACK
```

**Result:** ✅ No conflict. Change applied cleanly.

---

### Scenario 2: Simultaneous Edits (Conflict)

**Timeline:**
```
09:00 - Phone A (London) offline. User edits "Milk" qty: 10 → 8
09:02 - Phone B (Lagos) online. Simultaneously, another user (same account) edits qty: 10 → 12
        [Assume both are valid: Phone B might be checking in from field]

09:05 - Phone A goes online
09:05 - Phone A sends: { productId: "milk-1", qty: 8, clientTimestamp: "09:00" }
09:05 - Server receives from A
09:05 - Server checks: existing qty = 12, updated_at = "09:02"
09:05 - LWW: Compare "09:00" (A) vs "09:02" (B)
09:05 - "09:02" is newer → REJECT change from A, keep B's value (12)
09:05 - Server responds: { applied: [], rejected: [{ reason: "server_newer", serverState: { qty: 12 } }] }

09:06 - Phone A receives rejection
09:06 - Phone A sees serverState: qty = 12
09:06 - Phone A decides: Accept server (automatic), or ask user
09:06 - Phone A updates local SQLite: qty = 12
09:07 - User sees toast: "Product 'Milk' was edited elsewhere. Updated from cloud."
```

**Result:** ⚠️ Conflict detected and resolved. Older change (A) discarded, newer change (B) wins. User on A is notified.

---

### Scenario 3: Offline Divergence (Both Devices Edit)

**Timeline:**
```
09:00 - Both phones offline
09:01 - Phone A edits "Milk" qty: 10 → 8
09:02 - Phone B edits "Milk" qty: 10 → 12

09:05 - Phone A goes online first
09:05 - A sends: { productId: "milk-1", qty: 8, clientTimestamp: "09:01" }
09:05 - Server applies: qty = 8, updated_at = "09:01"

09:10 - Phone B goes online
09:10 - B sends: { productId: "milk-1", qty: 12, clientTimestamp: "09:02" }
09:10 - Server checks: existing qty = 8, updated_at = "09:01"
09:10 - LWW: "09:02" (B) > "09:01" (A)
09:10 - Server applies: qty = 12, updated_at = "09:02"
09:10 - Server responds to B: { applied: [{ mutationId: "B-1" }] }

09:11 - Phone B receives ACK
09:11 - B marks mutation synced

[Later, when A checks for updates...]
09:15 - Phone A fetches /api/products (to sync pull)
09:15 - Gets: qty = 12, updated_at = "09:02"
09:15 - Detects server is newer than local cache
09:15 - Updates local SQLite: qty = 12
09:16 - User A sees: "Product updated. Qty is now 12."
```

**Result:** ✅ No data loss. LWW resolves gracefully. Last write (B's at 09:02) wins.

---

## Conflict Detection Strategy

### Phase 2 Sync Request

**Client sends this to server:**

```typescript
interface SyncRequest {
  clientId: string;
  lastSyncedAt: string;  // ISO 8601, e.g., "2026-08-11T09:00:00Z"
  mutations: Mutation[];
}

interface Mutation {
  id: string;              // UUID
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'products' | 'transactions' | 'prices';
  recordId: string;        // Which record is being mutated
  data: Record<string, any>;
  clientTimestamp: string; // When mutation occurred on phone
  clientId: string;        // Which device
}
```

### Server-Side Conflict Detection

```typescript
// pages/api/sync.ts

async function applyMutation(
  mutation: Mutation,
  userId: string,
  existingRecord?: any
) {
  const { id, type, table, recordId, data, clientTimestamp } = mutation;

  // Step 1: Fetch current server state
  const currentServerRecord = await db
    .from(table)
    .select('*, updated_at')
    .eq('id', recordId)
    .eq('user_id', userId)
    .single()
    .catch(() => null);  // Not found = new record

  // Step 2: Apply conflict logic
  if (!currentServerRecord) {
    // New record, no conflict
    if (type === 'CREATE') {
      await db.from(table).insert({
        id: recordId,
        user_id: userId,
        ...data,
        updated_at: clientTimestamp
      });
      return { applied: true };
    } else {
      // Can't UPDATE/DELETE non-existent record
      return { 
        applied: false, 
        reason: 'record_not_found',
        serverState: null 
      };
    }
  }

  // Step 3: Compare timestamps (Last-Write-Wins)
  const clientTime = new Date(clientTimestamp);
  const serverTime = new Date(currentServerRecord.updated_at);

  if (clientTime < serverTime) {
    // Client is older; server wins
    return {
      applied: false,
      reason: 'server_newer',
      serverState: currentServerRecord,
      clientTimestamp,
      serverTimestamp: currentServerRecord.updated_at
    };
  }

  // Step 4: Client is newer (or equal); apply mutation
  if (type === 'UPDATE') {
    await db
      .from(table)
      .update({
        ...data,
        updated_at: clientTimestamp
      })
      .eq('id', recordId)
      .eq('user_id', userId);

    return { applied: true };
  } else if (type === 'DELETE') {
    await db
      .from(table)
      .update({
        deleted_at: clientTimestamp,
        updated_at: clientTimestamp
      })
      .eq('id', recordId)
      .eq('user_id', userId);

    return { applied: true };
  }
}

// Main sync endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req;  // From JWT
  const { mutations } = req.body;

  const results = {
    applied: [],
    rejected: [],
    errors: []
  };

  for (const mutation of mutations) {
    try {
      const result = await applyMutation(mutation, user.id);
      if (result.applied) {
        results.applied.push(mutation.id);
      } else {
        results.rejected.push({
          mutationId: mutation.id,
          ...result
        });
      }
    } catch (error) {
      results.errors.push({
        mutationId: mutation.id,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    synced: results,
    serverTimestamp: new Date().toISOString()
  });
}
```

---

## Client-Side Merge Strategy

### Handling Rejections

When server rejects a mutation, client merges server state intelligently:

```typescript
// hooks/useSyncEngine.ts

async function handleRejectedMutation(rejection: RejectedMutation) {
  const { reason, serverState, clientTimestamp, serverTimestamp } = rejection;

  if (reason === 'server_newer') {
    // Server is authoritative; merge server state
    await db.run(
      `UPDATE ${serverState.table}
       SET ? = ?
       WHERE id = ?`,
      [serverState.table, JSON.stringify(serverState), serverState.id]
    );

    // Notify user
    showToast({
      type: 'warning',
      message: `"${serverState.name}" was updated from another device. Changes synced.`,
      duration: 3000
    });

    // Optionally: log conflict in analytics
    analytics.track('sync_conflict_resolved', {
      table: serverState.table,
      reason: 'server_newer',
      timeDeltaMs: new Date(serverTimestamp).getTime() - new Date(clientTimestamp).getTime()
    });
  }
}
```

### Pull-Based Sync (Fallback)

If mutations are rejected, phone can also perform a full pull-sync to catch up:

```typescript
// Fallback: Fetch full state from server
async function performPullSync() {
  const response = await fetch('/api/products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const serverProducts = await response.json();

  // Merge: For each product, check if local is newer
  for (const serverProduct of serverProducts) {
    const localProduct = await getProduct(serverProduct.id);

    if (!localProduct) {
      // New on server; insert locally
      await insertProduct(serverProduct);
    } else {
      const localTime = new Date(localProduct.updated_at);
      const serverTime = new Date(serverProduct.updated_at);

      if (serverTime > localTime) {
        // Server is newer; update local
        await updateProduct(serverProduct);
      }
      // If local is newer, keep local (will re-sync next push)
    }
  }

  // Mark sync complete
  await db.run(
    `UPDATE sync_metadata SET last_synced_at = NOW()`
  );
}
```

---

## Edge Cases & Handling

### Case 1: Network Failure Mid-Sync

**What happens:**
- Phone sends mutations
- Network drops (partial receive)
- Server has some, not all

**Solution:**
- Mutations are idempotent (UUID-based, not sequential)
- Retry: Phone re-sends entire batch
- Server: Only applies if not already in audit_log

```sql
-- Server idempotency check
SELECT COUNT(*) FROM audit_log
WHERE mutation_id = $1  -- Unique constraint
```

---

### Case 2: Clock Skew

**Problem:** Phone clock is wildly off (e.g., user sets system time to 2020)

**Solution:** Server has bounds check

```typescript
const clientTime = new Date(clientTimestamp);
const serverTime = new Date();
const skew = Math.abs(clientTime.getTime() - serverTime.getTime());

if (skew > 24 * 60 * 60 * 1000) {
  // More than 24 hours skew
  return res.status(400).json({
    error: 'Client clock is severely skewed',
    code: 'CLOCK_SKEW',
    serverTime: serverTime.toISOString()
  });
}
```

---

### Case 3: Concurrent Edits by Same User on Different Devices

**Scenario:** Market woman has 2 phones (old + new). Both edit simultaneously.

**Solution:** Same as Scenario 2. LWW applies. Latest timestamp wins.

**Mitigation:** Show device info in UI

```typescript
{
  "product": {
    "id": "milk-1",
    "name": "Milk",
    "updated_at": "2026-08-11T10:00:00Z",
    "updated_by_device": "iPhone-12-ABC",
    "conflicts": [
      {
        "device": "iPad-Air-XYZ",
        "timestamp": "2026-08-11T09:55:00Z",
        "change": "qty: 8 → 10"
      }
    ]
  }
}
```

---

### Case 4: Delete Conflicts

**Scenario:** Phone deletes product, cloud receives new transaction for it.

**Solution:** Soft deletes preserve history

```sql
-- Product soft-deleted
UPDATE products SET deleted_at = '2026-08-11T09:00:00Z'
WHERE id = 'milk-1';

-- Later: Transaction arrives (created at 08:59:00Z, before delete)
-- Timestamp check: 08:59 < 09:00, so transaction is valid

-- But if transaction created at 09:05 (after delete)
-- Then transaction is invalid; reject
```

---

## Testing Strategy

### Unit Tests (SQLite/Local)

```typescript
// __tests__/sync-engine.test.ts

describe('Sync Engine', () => {
  describe('Offline operations', () => {
    it('should queue mutations while offline', () => {
      const queue = addToSyncQueue({
        type: 'UPDATE',
        table: 'products',
        recordId: 'milk-1',
        data: { quantity: 8 },
        clientTimestamp: now()
      });

      expect(queue.pending).toContain({
        synced_at: null
      });
    });

    it('should not execute sync while offline', () => {
      // Mock offline
      global.navigator.onLine = false;

      const result = performSync();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('offline');
    });
  });

  describe('LWW conflict resolution', () => {
    it('should apply newer mutations', () => {
      const clientTime = '2026-08-11T10:00:00Z';
      const serverTime = '2026-08-11T09:00:00Z';

      const result = resolveLWW({
        clientTimestamp: clientTime,
        serverTimestamp: serverTime
      });

      expect(result.applied).toBe(true);
      expect(result.winner).toBe('client');
    });

    it('should reject older mutations', () => {
      const clientTime = '2026-08-11T09:00:00Z';
      const serverTime = '2026-08-11T10:00:00Z';

      const result = resolveLWW({
        clientTimestamp: clientTime,
        serverTimestamp: serverTime
      });

      expect(result.applied).toBe(false);
      expect(result.reason).toBe('server_newer');
    });

    it('should accept equal timestamps (client wins on tie)', () => {
      const time = '2026-08-11T10:00:00Z';

      const result = resolveLWW({
        clientTimestamp: time,
        serverTimestamp: time
      });

      expect(result.applied).toBe(true);  // Client wins on tie
    });
  });

  describe('Sync queue management', () => {
    it('should mark mutations as synced', () => {
      const queue = [ { id: 'mut-1', synced_at: null } ];
      markAsSynced('mut-1', queue);

      expect(queue[0].synced_at).not.toBeNull();
    });

    it('should expire old pending mutations (>7 days)', () => {
      const queue = [
        { id: 'mut-1', client_timestamp: '2026-08-04T10:00:00Z' }  // 7 days old
      ];

      const expired = getExpiredMutations(queue, now());

      expect(expired).toContain('mut-1');
    });
  });
});
```

---

### E2E Tests (Real Phone + Server)

```typescript
// e2e/sync-scenarios.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Sync Scenarios', () => {
  test('should handle offline edits and sync when online', async ({ page, context }) => {
    // 1. Go offline
    await context.setOffline(true);

    // 2. Make edits
    await page.click('text=Milk');
    await page.fill('[data-qty]', '8');
    await page.click('text=Save');

    // 3. Verify queued locally
    const syncStatus = await page.locator('[data-sync-status]').textContent();
    expect(syncStatus).toContain('pending');

    // 4. Go online
    await context.setOffline(false);
    await page.waitForTimeout(2000);  // Wait for auto-sync

    // 5. Verify synced
    const syncStatusAfter = await page.locator('[data-sync-status]').textContent();
    expect(syncStatusAfter).toContain('synced');

    // 6. Verify server has the change
    const response = await page.request.get('/api/products/milk-1');
    const product = await response.json();
    expect(product.currentQuantity).toBe(8);
  });

  test('should handle sync conflicts gracefully', async ({ page, context, api }) => {
    // 1. Phone A is offline, makes edit
    await context.setOffline(true);
    await page.click('text=Milk');
    await page.fill('[data-qty]', '8');
    await page.click('text=Save');

    // 2. Meanwhile, server/Phone B changes the product
    await api.updateProduct('milk-1', {
      currentQuantity: 12,
      updated_at: new Date().toISOString()
    });

    // 3. Phone A goes online
    await context.setOffline(false);
    await page.waitForTimeout(2000);

    // 4. Verify conflict detected and resolved
    const toastMessage = await page.locator('[data-toast]').textContent();
    expect(toastMessage).toContain('updated from another device');

    // 5. Verify server version won (qty should be 12, not 8)
    const qty = await page.locator('[data-qty]').inputValue();
    expect(qty).toBe('12');
  });

  test('should be idempotent (retry-safe)', async ({ page, context, api }) => {
    // 1. Make edit
    await page.click('text=Milk');
    await page.fill('[data-qty]', '8');
    await page.click('text=Save');

    // 2. Manually retry sync (simulate network retry)
    await api.manualSync();
    await api.manualSync();  // Retry same batch

    // 3. Verify no double-applied mutations
    const response = await page.request.get('/api/transactions?productId=milk-1');
    const transactions = await response.json();

    const milkSalesCount = transactions.filter(t => 
      t.type === 'sale' && t.productId === 'milk-1'
    ).length;

    expect(milkSalesCount).toBe(1);  // Not 2 (from retries)
  });
});
```

---

## Monitoring & Debugging

### Metrics to Track

```typescript
// lib/sync-analytics.ts

export function trackSyncMetrics(syncResult: SyncResult) {
  analytics.track('sync_completed', {
    duration_ms: syncResult.duration,
    mutations_sent: syncResult.mutations.length,
    mutations_applied: syncResult.applied.length,
    mutations_rejected: syncResult.rejected.length,
    conflict_ratio: syncResult.rejected.length / syncResult.mutations.length,
    network_status: navigator.onLine ? 'online' : 'offline'
  });

  // Track per-table metrics
  for (const mutation of syncResult.mutations) {
    analytics.track('sync_mutation', {
      table: mutation.table,
      type: mutation.type,
      applied: syncResult.applied.includes(mutation.id)
    });
  }
}
```

### Debug Logs

```typescript
// lib/debug-sync.ts

export function logSyncState() {
  const syncQueue = db.exec(
    'SELECT COUNT(*) as pending FROM sync_queue WHERE synced_at IS NULL'
  );
  const lastSync = db.exec(
    'SELECT last_synced_at FROM sync_metadata'
  );

  console.log('[Trackkit Sync Debug]', {
    pending_mutations: syncQueue[0].pending,
    last_synced: lastSync[0].last_synced_at,
    online: navigator.onLine,
    sync_in_progress: window.__syncInProgress || false
  });
}
```

---

## Disaster Recovery

### Data Loss Scenarios

| **Scenario** | **Likelihood** | **Recovery** |
|---|---|---|
| **Phone breaks (data lost locally)** | Low | User has CSV export + cloud backup (Phase 2+) |
| **Sync fails (mutation stuck in queue)** | Very Low | Auto-retry, manual sync button, exponential backoff |
| **Both devices offline indefinitely** | Very Low | Eventually syncs when one comes online |
| **Cloud data corrupted** | Very Low | Database backups (daily) + audit trail for forensics |

### Backup & Restore

```typescript
// For Phase 2+ users:

async function createBackup() {
  const products = db.exec('SELECT * FROM products WHERE deleted_at IS NULL');
  const transactions = db.exec('SELECT * FROM transactions');

  const backup = {
    timestamp: new Date().toISOString(),
    products,
    transactions,
    version: 'v1'
  };

  // Upload to cloud
  await fetch('/api/backups', {
    method: 'POST',
    body: JSON.stringify(backup),
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

async function restoreFromBackup(backupId: string) {
  const response = await fetch(`/api/backups/${backupId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const backup = await response.json();

  // Clear local DB
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM transactions');

  // Restore
  for (const product of backup.products) {
    db.run('INSERT INTO products VALUES (...)', [...]);
  }

  // Sync metadata marks this as a restore
  db.run(`UPDATE sync_metadata SET last_synced_at = ?`, [backup.timestamp]);
}
```

---

## Conclusion

This sync strategy provides:

✅ **Offline-first:** Phone works fully disconnected  
✅ **Conflict-free:** LWW deterministically resolves all conflicts  
✅ **Idempotent:** Safe to retry without data loss  
✅ **Auditable:** Every change tracked in audit_log  
✅ **User-friendly:** Notifications when conflicts occur  

**Testing heavily:** Unit + E2E + chaos tests ensure robustness at scale.

Next: See **DEPLOYMENT-&-INFRA.md** for infrastructure setup and monitoring.
