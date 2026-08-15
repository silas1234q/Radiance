# PostHog Data Warehouse Setup Report

## Summary

No data warehouse sources were automatically created in this run. All five detected sources require manual completion in the PostHog UI — either due to a network connectivity issue (PostgreSQL/Neon) or credential collection being cancelled by the user. Deep-link URLs are provided below for each source.

## Sources Status

### PostgreSQL (Neon) — Needs browser setup

**What happened:** Credentials were collected (host, port, database, user, password), but PostHog's schema validation failed with a connectivity error:
> "PostHog reached the network but couldn't open a connection to the database host. This usually means the host only accepts IPv6 connections (PostHog connects over IPv4), or a firewall is blocking PostHog's IP addresses."

**Action required before connecting:**
- Neon defaults to IPv6-only endpoints. Enable Neon's **IPv4 add-on** (paid feature), or add [PostHog's egress IP addresses](https://posthog.com/docs/cdp/sources/postgres) to your Neon project's IP allowlist.
- Once IPv4 access is enabled, complete the connection in the PostHog UI:

**Deep link:** [Connect PostgreSQL in PostHog](https://us.i.posthog.com/project/554491/data-warehouse/new-source?kind=Postgres&utm_source=wizard&utm_campaign=warehouse-source)

---

### Clerk — Needs browser setup

**Action required:** Have your Clerk **secret key** ready (starts with `sk_live_…` — found in [Clerk Dashboard → API Keys](https://dashboard.clerk.com/)). This is different from the publishable key (`pk_live_`) or the webhook secret.

**Deep link:** [Connect Clerk in PostHog](https://us.i.posthog.com/project/554491/data-warehouse/new-source?kind=Clerk&utm_source=wizard&utm_campaign=warehouse-source)

---

### RevenueCat — Needs browser setup

**Action required:** Generate a **v2 secret API key** in [RevenueCat → Projects → API Keys](https://app.revenuecat.com/projects/_/api-keys) with read access to customers, products, entitlements, offerings, and apps. You'll also need your **Project ID** (starts with `proj…`, visible in the dashboard URL).

**Deep link:** [Connect RevenueCat in PostHog](https://us.i.posthog.com/project/554491/data-warehouse/new-source?kind=RevenueCat&utm_source=wizard&utm_campaign=warehouse-source)

---

### OpenAI — Needs browser setup

**Action required:** Create an **Admin API key** (prefixed `sk-admin…`) in [OpenAI → Organization Settings → Admin Keys](https://platform.openai.com/settings/organization/admin-keys). Only organization owners can create one. Your existing `OPENAI_API_KEY` in `.env` is a project key and cannot read organization usage/cost data.

**Deep link:** [Connect OpenAI in PostHog](https://us.i.posthog.com/project/554491/data-warehouse/new-source?kind=OpenAI&utm_source=wizard&utm_campaign=warehouse-source)

---

### Svix — Needs browser setup

**Action required:** Create an API key under **Settings → API Access** in the [Svix dashboard](https://dashboard.svix.com/).

**Deep link:** [Connect Svix in PostHog](https://us.i.posthog.com/project/554491/data-warehouse/new-source?kind=Svix&utm_source=wizard&utm_campaign=warehouse-source)

---

## Files Modified or Created

| File | Change |
|------|--------|
| `posthog-warehouse-report.md` | Created (this file) |

No application source files were modified. This skill only connects external data sources to PostHog — it does not edit your project code.

## Next Steps

1. **Fix Neon IPv4 access** — Enable Neon's IPv4 add-on or allowlist PostHog's egress IPs, then use the PostgreSQL deep link above.
2. **Open each deep link** to complete the remaining four sources in the PostHog UI.
3. After connection, PostHog will begin syncing tables. Check sync status at [PostHog Data Warehouse](https://us.i.posthog.com/project/554491/data-warehouse).
