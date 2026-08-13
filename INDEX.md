# MarketMate Documentation Index
## Complete Product Suite Specification (All Phases)

**Last updated:** 2026-08-11  
**Status:** Production-ready for Phase 1 → Phase 2 build  
**Total documentation:** 7 modular, cross-referenced documents  

---

## Document Guide (Read in This Order)

### 1. **PRODUCT-OVERVIEW.md** (10 min read)
**Start here.** Complete vision across all 3 phases.

**Contains:**
- Market opportunity & TAM
- Complete user journey (Phase 1 → 3)
- Business model & monetization
- Success metrics by phase
- Risk mitigation
- Timeline & phasing strategy

**Key for:** Everyone (product, eng, design, stakeholders)

---

### 2. **PHASE-1-MVP.md** (20 min read)
**Detailed Phase 1 specification.** Ready to build now.

**Contains:**
- User stories with acceptance criteria
- UI/UX wireframes
- Database schema (Phase 1 only)
- API surface (scaffolded for Phase 2)
- Frontend component structure
- Testing strategy + E2E tests
- Definition of done & phase gates

**Key for:** Frontend engineers, product, designers

**Start building from:** This document

---

### 3. **ARCHITECTURE.md** (30 min read)
**Full system design** for all phases, offline-first foundation.

**Contains:**
- System overview (Phase 1 vs Phase 2+)
- Offline-first service worker strategy
- Phase 2+ cloud sync architecture
- Sync metadata & auth flow
- Row-level security (RLS) policies
- Deployment architecture (Vercel + Supabase)
- Scaling & performance considerations
- Disaster recovery

**Key for:** Backend engineers, architects, tech leads

---

### 4. **DATABASE-SCHEMA.md** (20 min read)
**Complete SQL schema** for all phases with detailed annotations.

**Contains:**
- Phase 1 schema (products, transactions)
- Phase 2+ extensions (users, prices, audit_log)
- Indexes for each phase
- Row-level security policies
- Views for analytics
- Migration strategy (Phase 1 → 2)
- Performance optimization tips

**Key for:** Database engineers, backend leads

**Use for:** Copy-paste into Supabase for production

---

### 5. **API-REFERENCE.md** (25 min read)
**Complete REST API specification** for all endpoints.

**Contains:**
- Auth endpoints (SMS/OTP, JWT refresh, logout)
- Products CRUD (GET, POST, PATCH, DELETE)
- Transactions endpoints (log sales/restocks)
- Sync endpoint (Phase 2+ offline→cloud)
- Dashboard & analytics endpoints
- AI/chat endpoints (Phase 3+)
- Rate limiting & pagination
- Error handling & status codes

**Key for:** Frontend developers, API consumers, QA

**Use for:** OpenAPI/Swagger integration, Postman collection

---

### 6. **OFFLINE-SYNC-STRATEGY.md** (25 min read)
**Deep dive on sync algorithm** and conflict resolution.

**Contains:**
- Sync lifecycle & state machine
- Last-Write-Wins (LWW) conflict resolution
- Detailed conflict scenarios (1–4) with solutions
- Client-side merge strategy
- Edge cases (clock skew, concurrent edits, deletes)
- Unit test examples
- E2E test scenarios (Playwright)
- Monitoring & debugging
- Data loss recovery

**Key for:** Backend engineers, sync specialists, QA

**Critical for:** Phase 2 implementation

---

### 7. **DEPLOYMENT-&-INFRA.md** (30 min read)
**Production deployment guide** for Vercel + Supabase.

**Contains:**
- Phase 1 Vercel deployment only
- Phase 2+ Supabase setup (PostgreSQL)
- Environment variable configuration
- Database migration & schema setup
- SMS auth configuration (Twilio/Vonage)
- DNS & Cloudflare setup
- Monitoring setup (Sentry, Uptimerobot, Supabase)
- Scaling strategy (1 → 100 → 1k+ users)
- CI/CD pipeline (GitHub Actions)
- Backup & disaster recovery
- Cost estimation
- Operational runbook

**Key for:** DevOps, SREs, infrastructure engineers

**Use for:** Production deployment checklist

---

## Quick Reference: What to Use When

### Building Phase 1 (MVP)
1. Read: PRODUCT-OVERVIEW.md (context)
2. Read: PHASE-1-MVP.md (detailed spec)
3. Reference: DATABASE-SCHEMA.md (Phase 1 tables)
4. Reference: ARCHITECTURE.md (offline-first service worker)
5. Build from: PHASE-1-MVP.md user stories + acceptance criteria

### Building Phase 2 (Cloud Sync)
1. Review: PHASE-1-MVP.md (ensure Phase 1 complete)
2. Read: ARCHITECTURE.md (sync strategy)
3. Read: OFFLINE-SYNC-STRATEGY.md (conflict resolution)
4. Reference: DATABASE-SCHEMA.md (Phase 2+ extensions)
5. Reference: API-REFERENCE.md (new endpoints)
6. Deploy: DEPLOYMENT-&-INFRA.md (Supabase setup)

### Building Phase 3 (AI & Analytics)
1. Read: PRODUCT-OVERVIEW.md (Phase 3 features)
2. Reference: API-REFERENCE.md (AI/chat endpoints)
3. Reference: DATABASE-SCHEMA.md (Phase 3+ tables: ai_cache, analytics_daily)
4. Implement: AI chat endpoint (Claude API integration)
5. Monitor: DEPLOYMENT-&-INFRA.md (scaling for 1k+ users)

### Deploying to Production
1. Use: DEPLOYMENT-&-INFRA.md (step-by-step)
2. Reference: DATABASE-SCHEMA.md (migrations)
3. Reference: ARCHITECTURE.md (RLS policies)
4. Test: OFFLINE-SYNC-STRATEGY.md (sync E2E tests)

---

## Cross-Document References

**How documents relate:**

```
PRODUCT-OVERVIEW.md
  ├─ References → PHASE-1-MVP.md (Phase 1 details)
  ├─ References → PHASE-2-PROFIT.md (implied, see PRODUCT-OVERVIEW)
  ├─ References → PHASE-3-AI.md (implied, see PRODUCT-OVERVIEW)
  
PHASE-1-MVP.md
  ├─ References → DATABASE-SCHEMA.md (Section: "Database Schema (Phase 1)")
  ├─ References → ARCHITECTURE.md (Section: "Phase 1: Offline-Only")
  
ARCHITECTURE.md
  ├─ References → DATABASE-SCHEMA.md (RLS policies, indexes)
  ├─ References → OFFLINE-SYNC-STRATEGY.md (Sync engine details)
  ├─ References → DEPLOYMENT-&-INFRA.md (Infrastructure setup)
  
DATABASE-SCHEMA.md
  ├─ References → ARCHITECTURE.md (RLS policies context)
  ├─ References → OFFLINE-SYNC-STRATEGY.md (Sync metadata tables)
  
API-REFERENCE.md
  ├─ References → ARCHITECTURE.md (Auth flow, sync endpoint)
  ├─ References → DATABASE-SCHEMA.md (Table structures)
  
OFFLINE-SYNC-STRATEGY.md
  ├─ References → ARCHITECTURE.md (System overview)
  ├─ References → DATABASE-SCHEMA.md (Sync metadata & audit tables)
  
DEPLOYMENT-&-INFRA.md
  ├─ References → DATABASE-SCHEMA.md (Migrations)
  ├─ References → ARCHITECTURE.md (RLS, sync architecture)
```

---

## How to Use These Docs with AI Code Agents

### For Claude Code (Recommended)

**Step 1: Give context**
```
I want to build MarketMate Phase 1.
Read these docs: PRODUCT-OVERVIEW.md, PHASE-1-MVP.md
Then read: ARCHITECTURE.md (Phase 1 section)
```

**Step 2: Ask for specific build tasks**
```
Build the ProductCard component per PHASE-1-MVP.md acceptance criteria.
Reference: Database schema from DATABASE-SCHEMA.md
Use: Component structure from PHASE-1-MVP.md
```

**Step 3: Code review with gstack**
```
/review (Claude Code built the component)
/qa (Test the component offline)
/ship (Deploy to staging)
```

### For Prompt Engineering

**These docs are optimized for AI agents because:**

✅ Each document is self-contained (can be read alone)  
✅ Detailed specifications with acceptance criteria  
✅ Clear examples (SQL, TypeScript, JSON)  
✅ Explicit data models (schema, API contracts)  
✅ Test cases included (unit + E2E examples)  
✅ Layered approach (don't need full context every time)  
✅ No ambiguity (technical, not philosophical)  

---

## Document Statistics

| **Document** | **Pages** | **Sections** | **Code Examples** | **Diagrams** |
|---|---|---|---|---|
| PRODUCT-OVERVIEW.md | 8 | 8 | 3 | 2 |
| PHASE-1-MVP.md | 12 | 10 | 8 | 3 |
| ARCHITECTURE.md | 15 | 12 | 15 | 4 |
| DATABASE-SCHEMA.md | 13 | 11 | 20 | 1 |
| API-REFERENCE.md | 16 | 15 | 25 | 1 |
| OFFLINE-SYNC-STRATEGY.md | 14 | 10 | 18 | 2 |
| DEPLOYMENT-&-INFRA.md | 15 | 12 | 22 | 1 |
| **TOTAL** | **93** | **78** | **111** | **14** |

---

## What's NOT Included (Intentional)

These docs focus on the product, technical spec, and deployment. They deliberately exclude:

- ❌ Marketing copy (landing page, pitch deck) — See PRODUCT-OVERVIEW for positioning
- ❌ User research findings — See PRODUCT-OVERVIEW: target user, pain points
- ❌ Brand guidelines — See PRODUCT-OVERVIEW: messaging pillars
- ❌ Financial projections — See PRODUCT-OVERVIEW: business model
- ❌ Team org chart — N/A for MVP build

**These are intentional:** The focus is on *building* the product, not selling it yet.

---

## Next Steps

### Immediate (This Week)
1. ✅ Read PRODUCT-OVERVIEW.md (10 min)
2. ✅ Read PHASE-1-MVP.md (20 min)
3. ✅ Decide: Build solo or with co-founder?
4. ✅ Set up GitHub repo
5. Start Phase 1 build (use PHASE-1-MVP.md as spec)

### Short-term (Weeks 1–8)
1. Build Phase 1 per PHASE-1-MVP.md
2. Test with cohort of 10 market women
3. Iterate on UX based on feedback
4. Deploy to Vercel (see DEPLOYMENT-&-INFRA.md)

### Medium-term (Weeks 8–16)
1. Validate Phase 1 success metrics (80% retention, NPS 50+)
2. If successful: Start Phase 2 (cloud sync)
3. Set up Supabase (see DEPLOYMENT-&-INFRA.md)
4. Implement OFFLINE-SYNC-STRATEGY.md
5. Expand to 100+ users

### Long-term (6+ months)
1. Phase 3 (AI chat, trends)
2. Scale to 1k+ users
3. Expand to other markets

---

## Questions?

Each document has:
- Clear section headings (jump to what you need)
- Code examples (copy-paste ready)
- Detailed acceptance criteria (no guessing)
- Cross-references (navigate between docs)
- Technical depth (production-ready, not vague)

**Start with PRODUCT-OVERVIEW.md → PHASE-1-MVP.md.**

Everything else is reference material you'll use as you build.

---

**Status: Ready for Phase 1 build. Let's ship.** 🚀
