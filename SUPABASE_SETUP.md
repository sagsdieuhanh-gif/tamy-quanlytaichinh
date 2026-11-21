# Supabase + GitHub Pages setup (Mộc Finance)

## Status

The production branch remains the working **local-only** version until a dedicated Supabase project is selected and configured. This feature branch implements the registration/login and private cloud-save UI.

## Supabase project

Create a new dedicated Supabase project in the organization you approve. Avoid reusing a project from another app without explicit permission. Project creation price shown by connected Supabase service: **USD 0/month** for the organization's available tier at the time of checking, but usage limits may apply.

1. In that project, execute \`supabase/schema.sql\` (Supabase SQL Editor or MCP migration).
2. Confirm the \`public.finance_states\` table has RLS enabled, only grants to authenticated, and all four policies are present.
3. Open **Authentication → Providers → Email**, ensure email/password signups are enabled. Keep email confirmation enabled.
4. Open **Authentication → URL Configuration**:
   - Site URL: \`https://sagsdieuhanh-gif.github.io/tamy-quanlytaichinh/\`
   - Redirect URL allow list: add \`https://sagsdieuhanh-gif.github.io/tamy-quanlytaichinh/\`
5. In **Project Settings → API Keys**, copy **Publishable** key (starts with \`sb_publishable_\`) and project URL (https://PROJECTREF.supabase.co).
6. Fill \`supabase-config.js\` with project URL and **publishable** key only. Never expose a secret/service_role key.
7. Merge feature branch into \`main\` to publish.

## Usage

- **Đăng ký** uses email/password. User confirms email, then signs in.
- **Đăng nhập** restores the account and fetches the private finance JSON document.
- Each user's RLS policy only permits rows with \`user_id = auth.uid()\`.
- The local in-app JSON import can migrate an old offline backup. No automatic migration of demo data.
- The app queues changes to Supabase; if offline, saves a pending copy on that device and sends it once online again.
- Data sync strategy is **last-writer-wins**. Avoid using multiple devices at exactly the same time until conflict detection is added.
- Cash and bank entries remain manual, there is no banking integration.
- Supabase can require additional SMTP configuration for reliable production registration emails; check Auth Email limits and settings before inviting users.

## Safety note

The public GitHub repository never contains a private Supabase key. Row-level security is mandatory; **publishable key alone is not a security boundary**. JSON financial content can also be cached by local browser storage for offline retry; use a trusted phone and sign out when sharing it.
