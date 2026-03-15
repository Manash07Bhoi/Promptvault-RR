# PromptVault — Project Documentation

> Created: March 14, 2026

This directory contains the complete technical reference documentation for finalising,
debugging, securing, and testing the PromptVault platform.

---

## Documents

### [Final-Work.md](./Final-Work.md)
**Complete inventory of all remaining development work.**

Covers:
- Mock data and hardcoded content that must be removed
- Every missing screen (70+ items) with route, status, and priority
- Missing database tables and fields (~28 tables)
- Missing API endpoints (50+ endpoints)
- Incomplete feature functionality by domain
- UI/UX audit per screen
- Logic bugs and edge cases
- Missing infrastructure (SEO, performance, production setup)

**Start here** to understand the full scope of remaining work.

---

### [Debug.md](./Debug.md)
**Comprehensive bug report and security audit.**

Covers:
- Security vulnerabilities (21 issues, including price tampering, auth bypass, XSS)
- Application bugs by severity (Critical → Low)
- Routing and navigation bugs
- Database performance issues
- Environment and configuration problems
- Debugging playbook with commands
- Production readiness checklist

**Use this** for every bug fix sprint and pre-deployment security review.

---

### [E2E-Testing.md](./E2E-Testing.md)
**End-to-end testing guide — manual and automated.**

Covers:
- Test environment setup
- Test accounts and seed data requirements
- Playwright automated test setup and configuration
- 50 manual test cases across all screens and features
- Security test cases with curl commands
- Performance and accessibility testing (Lighthouse)
- 4 complete Playwright test specifications with full code
- Required `data-testid` attribute inventory
- Regression checklist
- Test completion criteria

**Use this** to verify every feature works before deployment.

---

## Quick Reference — Priority Order

For sprint planning, work in this order:

1. **Mock data cleanup** (blocks all other testing)
2. **P0 Critical items** — user profiles, prompt interactions, notification delivery, appreciate/like system
3. **Security fixes** — price tampering, download/review gates, CORS lock, admin self-protection
4. **UI/UX screen fixes** — broken layouts, loading states, error states
5. **Logic bugs** — race conditions, state sync, pagination edge cases
6. **P1 items** — creator tools, subscriptions, social features, affiliate program
7. **Infrastructure** — SEO meta tags, sitemap, robots.txt, performance
8. **E2E test suite** — run after all fixes; all must pass before deployment
9. **P2 items** — AI personalisation, accessibility, advanced admin
10. **P3 items** — mobile app, developer API platform
