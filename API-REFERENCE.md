# MarketMate API Reference
## REST API Specification for All Phases

**Document:** API-REFERENCE.md  
**Audience:** Frontend engineers, mobile developers, API consumers  
**Read time:** 25 minutes  
**Version:** 1.0 (All phases)  

---

## API Overview

**Base URL:** `https://api.marketmate.app` (production)  
**API Version:** `v1`  
**Authentication:** JWT (Phase 2+), Bearer token in `Authorization` header  
**Content-Type:** `application/json`  
**Response format:** JSON  

**Protocol:**
- HTTPS only (TLS 1.3+)
- All timestamps: ISO 8601 UTC
- All amounts: Decimal, string format to avoid floating-point errors
- All IDs: UUID v4

### HTTP Status Codes

| **Code** | **Meaning** | **Example** |
|---|---|---|
| `200 OK` | Successful GET, PATCH | Fetched products |
| `201 Created` | Successful POST (resource created) | Created product |
| `204 No Content` | Successful DELETE, or update with no response body | Deleted product |
| `400 Bad Request` | Validation error | Invalid product name |
| `401 Unauthorized` | Missing/invalid JWT | Token expired |
| `403 Forbidden` | RLS denied access | Accessing another user's product |
| `404 Not Found` | Resource doesn't exist | Product ID not found |
| `409 Conflict` | Sync conflict (Phase 2) | Stale version, server newer |
| `422 Unprocessable Entity` | Business logic error | Insufficient quantity |
| `429 Too Many Requests` | Rate limit exceeded | >100 requests/minute |
| `500 Internal Server Error` | Unexpected error | Database connection failed |
| `503 Service Unavailable` | Server maintenance | Database is down |

### Error Response Format

```json
{
  "error": "string",
  "code": "string",
  "details": {},
  "requestId": "string"
}
```

**Example:**
```json
{
  "error": "Product quantity cannot be negative",
  "code": "INVALID_QUANTITY",
  "details": {
    "field": "current_quantity",
    "value": -5,
    "constraint": ">= 0"
  },
  "requestId": "req-2026-08-11-12345"
}
```

---

## Phase 1 API (Offline-Only)

**Note:** Phase 1 has NO backend API. All operations are local (SQLite in browser). These endpoints are scaffolded but not wired yet.

---

## Phase 2+ API (Cloud Sync & Multi-User)

### Authentication Endpoints

#### POST `/api/auth/request-otp`

**Request OTP via SMS**

```http
POST /api/auth/request-otp HTTP/1.1
Host: api.marketmate.app
Content-Type: application/json

{
  "phoneNumber": "+2341234567890",
  "method": "sms"  // or "whatsapp"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to +2341234567890",
  "expiresIn": 600
}
```

**Error Examples:**

```json
// 400 - Invalid phone number
{
  "error": "Invalid phone number format",
  "code": "INVALID_PHONE"
}

// 429 - Rate limit (max 3 attempts/5 minutes)
{
  "error": "Too many OTP requests. Try again in 2 minutes.",
  "code": "RATE_LIMIT_OTP"
}
```

---

#### POST `/api/auth/verify-otp`

**Verify OTP and get JWT**

```http
POST /api/auth/verify-otp HTTP/1.1
Host: api.marketmate.app
Content-Type: application/json

{
  "phoneNumber": "+2341234567890",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+2341234567890",
    "shopName": null,
    "createdAt": "2026-08-11T10:00:00Z"
  }
}
```

**Error Examples:**

```json
// 400 - Wrong OTP
{
  "error": "Invalid or expired OTP",
  "code": "INVALID_OTP",
  "attemptsRemaining": 2
}

// 401 - OTP expired (>10 minutes)
{
  "error": "OTP has expired",
  "code": "OTP_EXPIRED"
}
```

---

#### POST `/api/auth/refresh`

**Refresh JWT (before expiry)**

```http
POST /api/auth/refresh HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {refreshToken}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

#### POST `/api/auth/logout`

**Invalidate current session**

```http
POST /api/auth/logout HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
```

**Response (204):** No content

---

### Products Endpoints

#### GET `/api/products`

**Fetch all products for authenticated user**

```http
GET /api/products HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
```

**Query parameters:**
- `category` (optional): Filter by category. Example: `?category=Dairy`
- `includeDeleted` (optional): Include soft-deleted products. Default: `false`
- `limit` (optional): Results per page. Default: `50`, max: `500`
- `offset` (optional): Pagination offset. Default: `0`

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Milk",
      "category": "Dairy",
      "currentQuantity": 10,
      "unit": "Tin",
      "lowStockThreshold": 3,
      "sellingPricePerUnit": "800.00",
      "createdAt": "2026-08-10T14:30:00Z",
      "updatedAt": "2026-08-11T10:00:00Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

#### GET `/api/products/:id`

**Fetch single product by ID**

```http
GET /api/products/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Milk",
  "category": "Dairy",
  "currentQuantity": 10,
  "unit": "Tin",
  "lowStockThreshold": 3,
  "sellingPricePerUnit": "800.00",
  "createdAt": "2026-08-10T14:30:00Z",
  "updatedAt": "2026-08-11T10:00:00Z",
  "deletedAt": null,
  "stats": {
    "totalSales": 45,
    "averageSaleQuantity": 2.3,
    "lastSale": "2026-08-11T09:30:00Z"
  }
}
```

**Errors:**
```json
// 404
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}

// 403 - RLS denied
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```

---

#### POST `/api/products`

**Create new product**

```http
POST /api/products HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Sugar",
  "category": "Sugar/Flour",
  "currentQuantity": 20,
  "unit": "Bag",
  "lowStockThreshold": 5,
  "sellingPricePerUnit": "75.00"
}
```

**Response (201):**
```json
{
  "id": "660f9501-f40c-52e5-b827-557766551111",
  "name": "Sugar",
  "category": "Sugar/Flour",
  "currentQuantity": 20,
  "unit": "Bag",
  "lowStockThreshold": 5,
  "sellingPricePerUnit": "75.00",
  "createdAt": "2026-08-11T10:00:00Z",
  "updatedAt": "2026-08-11T10:00:00Z"
}
```

**Validation Errors (400):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "Product name is required",
    "unit": "Unit is required"
  }
}

// Duplicate product name
{
  "error": "Product already exists",
  "code": "DUPLICATE_PRODUCT",
  "details": {
    "field": "name",
    "existingId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

#### PATCH `/api/products/:id`

**Update product**

```http
PATCH /api/products/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
Content-Type: application/json

{
  "lowStockThreshold": 5,
  "sellingPricePerUnit": "820.00"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Milk",
  "category": "Dairy",
  "currentQuantity": 10,
  "unit": "Tin",
  "lowStockThreshold": 5,
  "sellingPricePerUnit": "820.00",
  "updatedAt": "2026-08-11T10:05:00Z"
}
```

**Conflict Error (409) — Sync conflict, server version is newer:**
```json
{
  "error": "Sync conflict: server version is newer",
  "code": "SYNC_CONFLICT",
  "serverVersion": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "updatedAt": "2026-08-11T10:10:00Z",
    "currentQuantity": 8
  },
  "clientTimestamp": "2026-08-11T10:05:00Z",
  "resolution": "last-write-wins"
}
```

---

#### DELETE `/api/products/:id`

**Soft-delete product (mark as deleted, preserve history)**

```http
DELETE /api/products/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
```

**Response (204):** No content

**Error:**
```json
// 404
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

### Transactions Endpoints

#### GET `/api/transactions`

**Fetch transaction history**

```http
GET /api/transactions?productId=550e8400-e29b-41d4-a716-446655440000&limit=50 HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
```

**Query parameters:**
- `productId` (optional): Filter by product
- `type` (optional): Filter by type (`sale` or `restock`)
- `startDate` (optional): ISO 8601 date. Example: `2026-08-01`
- `endDate` (optional): ISO 8601 date. Example: `2026-08-11`
- `limit` (optional): Default: `100`, max: `1000`
- `offset` (optional): Default: `0`

**Response (200):**
```json
{
  "data": [
    {
      "id": "770g9612-g51d-63f6-c938-668877662222",
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "transactionType": "sale",
      "quantity": 2,
      "pricePerUnit": "800.00",
      "notes": null,
      "createdAt": "2026-08-11T09:30:00Z"
    },
    {
      "id": "880h0723-h62e-74g7-d049-779988773333",
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "transactionType": "restock",
      "quantity": 10,
      "pricePerUnit": "500.00",
      "notes": "Bought from supplier X",
      "createdAt": "2026-08-10T16:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

---

#### POST `/api/transactions`

**Log sale or restock**

```http
POST /api/transactions HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "transactionType": "sale",
  "quantity": 2,
  "pricePerUnit": "800.00",
  "notes": null
}
```

**Response (201):**
```json
{
  "id": "990i1834-i73f-85h8-e150-8809999844444",
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "transactionType": "sale",
  "quantity": 2,
  "pricePerUnit": "800.00",
  "createdAt": "2026-08-11T10:00:00Z",
  "productSnapshot": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Milk",
    "currentQuantityBefore": 10,
    "currentQuantityAfter": 8
  }
}
```

**Validation Errors (400):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "quantity": "Must be > 0",
    "transactionType": "Must be 'sale' or 'restock'"
  }
}

// Insufficient quantity for sale
{
  "error": "Insufficient quantity",
  "code": "INSUFFICIENT_QUANTITY",
  "details": {
    "requested": 15,
    "available": 10,
    "shortage": 5
  }
}
```

---

### Sync Endpoint (Phase 2+)

#### POST `/api/sync`

**Sync offline mutations to cloud**

This is the core endpoint for Phase 2+ offline-first sync. Phone sends all queued mutations; server applies them, resolves conflicts, and returns server state.

```http
POST /api/sync HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "device-iphone-12-abc123",
  "lastSyncedAt": "2026-08-11T09:00:00Z",
  "mutations": [
    {
      "id": "mutation-001",
      "type": "CREATE",
      "table": "products",
      "recordId": "new-product-id",
      "data": {
        "name": "Cocoa Milk",
        "category": "Dairy",
        "currentQuantity": 15,
        "unit": "Tin"
      },
      "clientTimestamp": "2026-08-11T09:30:00Z"
    },
    {
      "id": "mutation-002",
      "type": "UPDATE",
      "table": "products",
      "recordId": "550e8400-e29b-41d4-a716-446655440000",
      "data": {
        "currentQuantity": 8,
        "updatedAt": "2026-08-11T09:45:00Z"
      },
      "clientTimestamp": "2026-08-11T09:45:00Z"
    },
    {
      "id": "mutation-003",
      "type": "CREATE",
      "table": "transactions",
      "recordId": "transaction-new-id",
      "data": {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "transactionType": "sale",
        "quantity": 2
      },
      "clientTimestamp": "2026-08-11T09:40:00Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "synced": {
    "applied": [
      "mutation-001",
      "mutation-002",
      "mutation-003"
    ],
    "rejected": [],
    "serverTimestamp": "2026-08-11T10:00:00Z"
  },
  "serverState": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Milk",
        "currentQuantity": 8,
        "updatedAt": "2026-08-11T09:45:00Z"
      }
    ]
  },
  "messages": []
}
```

**Conflict Response (200 with rejections):**
```json
{
  "success": true,
  "synced": {
    "applied": [
      "mutation-001"
    ],
    "rejected": [
      {
        "mutationId": "mutation-002",
        "reason": "server_newer",
        "message": "Server version is newer; client version rejected",
        "serverVersion": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "currentQuantity": 6,
          "updatedAt": "2026-08-11T10:00:00Z"
        },
        "clientVersion": {
          "currentQuantity": 8,
          "clientTimestamp": "2026-08-11T09:45:00Z"
        }
      }
    ]
  }
}
```

**Server error (500):**
```json
{
  "error": "Sync failed",
  "code": "SYNC_FAILED",
  "details": {
    "failedMutations": [
      {
        "mutationId": "mutation-002",
        "reason": "Database error: connection timeout"
      }
    ],
    "retryable": true,
    "retryAfter": 30
  }
}
```

---

### Dashboard / Analytics Endpoints (Phase 2+)

#### GET `/api/dashboard`

**Get inventory summary for dashboard**

```http
GET /api/dashboard HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "summary": {
    "totalProducts": 12,
    "totalInventoryValue": "45000.00",
    "lowStockCount": 3,
    "lastUpdated": "2026-08-11T10:05:00Z"
  },
  "lowStockAlerts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Milk",
      "currentQuantity": 2,
      "lowStockThreshold": 3,
      "unit": "Tin"
    }
  ],
  "recentTransactions": [
    {
      "id": "770g9612-g51d-63f6-c938-668877662222",
      "productName": "Milk",
      "type": "sale",
      "quantity": 2,
      "createdAt": "2026-08-11T09:30:00Z"
    }
  ]
}
```

---

### AI & Analytics Endpoints (Phase 3+)

#### POST `/api/ai/chat`

**Chat with AI assistant (Phase 3+)**

```http
POST /api/ai/chat HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "How much milk sold this week?",
  "context": {
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "timeRange": "week"
  }
}
```

**Response (200):**
```json
{
  "response": "You sold 24 tins of milk this week. That's 3.4 tins per day on average. Your margin is 12% per tin, so profit = ₦2,880 this week.",
  "confidence": 0.95,
  "sources": [
    {
      "type": "transaction_analysis",
      "data": { "total": 24, "average": 3.4 }
    }
  ],
  "suggestions": [
    "Cocoa milk is faster-selling (5.2 tins/day). Consider increasing stock.",
    "Weekend sales 3x weekday sales. Plan restocks for Friday."
  ]
}
```

---

#### GET `/api/analytics/trends`

**Fetch sales trends (Phase 3+)**

```http
GET /api/analytics/trends?productId=550e8400-e29b-41d4-a716-446655440000&period=week HTTP/1.1
Host: api.marketmate.app
Authorization: Bearer {token}
```

**Query parameters:**
- `productId` (optional): Single product, or all if omitted
- `period` (optional): `day`, `week`, `month`. Default: `week`

**Response (200):**
```json
{
  "data": [
    {
      "date": "2026-08-05",
      "salesQuantity": 18,
      "salesValue": "14400.00",
      "profit": "1728.00"
    },
    {
      "date": "2026-08-06",
      "salesQuantity": 22,
      "salesValue": "17600.00",
      "profit": "2112.00"
    }
  ],
  "summary": {
    "totalSales": 24,
    "totalValue": "19200.00",
    "totalProfit": "2304.00",
    "averagePerDay": 3.4
  },
  "forecast": {
    "nextWeekEstimate": 168,
    "confidence": 0.85
  }
}
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

```
Standard: 100 requests/minute per user
Premium: 1000 requests/minute per user
Sync endpoint: 10 requests/minute (prevent sync bombs)
```

**Rate limit headers in response:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1691742900  (Unix timestamp)
```

**When limit exceeded (429):**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 45
}
```

---

## Pagination

For list endpoints, pagination uses limit/offset:

```http
GET /api/products?limit=50&offset=100
```

**Response includes pagination metadata:**
```json
{
  "data": [...],
  "pagination": {
    "total": 287,
    "limit": 50,
    "offset": 100,
    "hasMore": true
  }
}
```

---

## Versioning & Deprecation

**Current API version:** `v1` (in all URLs)

**Deprecation policy:**
- 6-month notice before breaking changes
- Old versions supported for 12 months
- New versions available 3 months before old version sunset
- Migration guides published for each change

**Deprecation header (if applicable):**
```
Deprecation: true
Sunset: Sun, 11 Aug 2027 00:00:00 GMT
Link: </api/v2/docs>; rel="successor-version"
```

---

## Webhooks (Future, Phase 3+)

Planned for future versions: Server-to-client push notifications for:
- Low-stock alerts
- Sync status updates
- AI insights
- Team collaboration (multi-user shops)

---

## Conclusion

This API supports all three phases:

✅ **Phase 1:** Local only (no API calls)  
✅ **Phase 2:** Cloud sync, multi-user auth, CRUD operations  
✅ **Phase 3:** AI chat, analytics, forecasting  

**Next:** See **OFFLINE-SYNC-STRATEGY.md** for deep dive on conflict resolution, and **DEPLOYMENT-&-INFRA.md** for deployment setup.
