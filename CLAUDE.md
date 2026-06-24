## Project Configuration

## Stack

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, sveltekit-adapter, mcp
- **Framework**: SvelteKit (Svelte 5)
- **Styling**: TailwindCSS
- **Testing**: Vitest (unit), Playwright (e2e)
- **Linting**: ESLint + Prettier
- **Adapter**: sveltekit-adapter
- **MCP**: Enabled

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

---

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

### Fallback reference

If MCP doesn't cover something, use: https://svelte.dev/llms-full.txt

---

## SvelteKit Architecture

### Middleware → `src/hooks.server.ts`

Runs on **every request** before anything else. Use for:

- Auth checks and session verification
- Injecting user data into `event.locals`
- Setting/reading cookies
- Blocking or redirecting requests early

```ts
export const handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session');
	event.locals.user = token ? await verifyToken(token) : null;
	return resolve(event);
};
```

`handleFetch()` — intercepts outbound `fetch()` calls inside load functions (e.g. adding auth headers to API calls).

### Server-Side Rendering — load functions

| File                | Runs when        | Use for                       |
| ------------------- | ---------------- | ----------------------------- |
| `+layout.server.ts` | Every page, once | Shared data (user, nav)       |
| `+page.server.ts`   | That route only  | DB queries, form actions      |
| `+page.ts`          | Server + client  | Public API calls (no secrets) |

```ts
// src/routes/dashboard/+page.server.ts
export const load = async ({ locals, fetch }) => {
	if (!locals.user) throw redirect(303, '/login');
	const posts = await db.getPosts(locals.user.id);
	return { posts };
};
```

### Key rules

- `.server.ts` files never ship to the browser — safe for DB credentials and secrets
- Never put sensitive logic in `+page.ts` — use `.server.ts` variants
- `+layout.server.ts` data flows down to all child routes automatically
- Use `event.locals` to pass data from `hooks.server.ts` into load functions

---

## File Conventions

```
src/
├── hooks.server.ts         # Middleware (auth, locals, session)
├── lib/
│   ├── server/             # Server-only utilities (DB, auth)
│   └── components/         # Shared Svelte components
├── routes/
│   ├── +layout.server.ts   # Shared SSR data (user, nav)
│   ├── +layout.svelte      # Root layout component
│   ├── +page.server.ts     # Per-route SSR load + form actions
│   └── +page.svelte        # Page component
```

---

## Svelte 5 Patterns

Always use **Svelte 5 runes** syntax — not legacy Svelte 4:

```svelte
<!-- Svelte 5 — correct -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log('count changed:', count);
  });
</script>

<!-- Svelte 4 — do NOT use -->
<script>
  let count = 0;
  $: doubled = count * 2;
</script>
```

---

## Navigation — goto() and href require resolve()

Whenever `goto()` is used on the client, or an `<a>` tag links to an internal route, the path must be wrapped in `resolve()` from `$app/paths`. This is enforced by the `svelte/no-navigation-without-resolve` ESLint rule and will fail lint/build if skipped.

### goto()

```ts
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

// plain pathname
goto(resolve('/dashboard'));

// route ID with params
goto(resolve('/blog/[slug]', { slug: post.slug }));
```

### `<a href>`

```svelte
<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<!-- BAD — plain string, fails lint -->
<a href="/management/onboarding">Onboarding</a>

<!-- GOOD — wrapped in resolve(), note the curly braces instead of quotes -->
<a href={resolve('/management/onboarding')}>Onboarding</a>
```

### Key rules

- Never write `goto('/some/path')` or `href="/some/path"` directly — always wrap the path in `resolve(...)`.
- Switching `href="..."` to `href={resolve(...)}` changes the attribute from a string literal to an expression — drop the quotes, add curly braces.
- `resolve()` accepts either a literal pathname (`resolve('/blog/hello-world')`) or a route ID plus a params object (`resolve('/blog/[slug]', { slug: 'hello-world' })`) for dynamic segments.
- `resolve()` type-checks the path against real routes in `src/routes` — if the route doesn't exist, it's a compile error instead of a silent broken link.
- Exceptions where `resolve()` is NOT required: absolute external URLs (`href="https://example.com"`), links explicitly marked `rel="external"`, and pure hash links (`href="#top"`).
- For external URLs, don't use `goto()` at all — use `window.location.href = url` instead, and skip `resolve()` since it's only for internal routes.

---

## Testing

- **Unit tests**: Vitest — place in `src/` alongside source files as `*.test.ts`
- **E2E tests**: Playwright — place in `tests/` directory
- Run unit tests: `npm run test`
- Run e2e tests: `npm run test:e2e`

---

## Code Style

- Prettier and ESLint are configured — always run before committing
- Use TypeScript strict mode
- Prefer named exports over default exports in `lib/`
- Use `$lib` alias for imports from `src/lib/`

---

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright e2e tests
npm run lint         # ESLint check
npm run format       # Prettier format
```

---

## UI Components — shadcn-svelte

shadcn-svelte is the component library for this project. It provides accessible, copy-paste Svelte 5 components built on Bits UI + Tailwind CSS.

### Reference docs

- **Full LLM reference**: https://shadcn-svelte.com/llms.txt
- **Component index**: https://shadcn-svelte.com/docs

### Installing components

```bash
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add card dialog input
```

### Available component categories

- **Form & Input**: Button, Checkbox, Combobox, Input, Select, Slider, Switch, Textarea, Calendar, Date Picker, OTP Input
- **Layout & Navigation**: Accordion, Breadcrumb, Sidebar, Tabs, Navigation Menu, Resizable, Scroll Area
- **Overlays & Dialogs**: Alert Dialog, Dialog, Drawer, Dropdown Menu, Popover, Sheet, Tooltip, Command
- **Feedback & Status**: Alert, Badge, Progress, Skeleton, Sonner (toast), Spinner
- **Display & Media**: Avatar, Card, Carousel, Chart, Data Table, Table, Typography

### Usage pattern

Components are copied into `$lib/components/ui/` — they are yours to modify.

```svelte
<script>
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
</script>
```
 
## Storybook — component-only scope

Storybook is used **exclusively for isolated components in `src/lib/components/`**. It is not used for routes, pages, layouts, or anything that depends on SvelteKit's request lifecycle.

### In scope

- Anything in `src/lib/components/**` — including `ui/` (shadcn-svelte) and custom components like `PaymentStatusBadge`, `CardInput`, `AmountDisplay`, `TransactionRow`.
- Pure presentational components: take props/args in, render UI out, no remote function calls, no `db`, no `auth`, no gateway SDK calls inside the component itself.

### Out of scope — do not write stories for:

- `+page.svelte` / `+layout.svelte` files — these depend on SvelteKit's `load` data and routing context, which Storybook can only mock, not faithfully reproduce.
- Any component that calls a `*.remote.ts` function (`query`, `form`, `command`) directly inside its own script — if a component does this, either:
  - refactor it so the parent route passes data in as props (then the *inner* presentational piece is storyable), or
  - skip Storybook for it and rely on Playwright/component tests instead.
- Payment gateway hosted fields/iframes (Stripe Elements, Razorpay Checkout, etc.) — these require a live publishable key and real network calls; they don't render meaningfully in isolation.
- Full checkout/payment flows (multi-step forms, redirect-based 3DS, webhook-driven status updates) — these are integration concerns, not component concerns.

### Rule of thumb

> If a component needs `getRequestEvent()`, a database, an API key, or a route param to render correctly — it doesn't belong in Storybook. Extract the dumb/presentational layer and story that instead.

### Example — correct split

```svelte
<!-- ❌ Not storyable as-is: calls a remote function internally -->
<script>
	import { getTransaction } from './data.remote';
	let { id } = $props();
	const tx = $derived(await getTransaction(id));
</script>
<TransactionCard {tx} />
```
```svelte
<!-- ✅ Storyable: pure presentational component, data passed as prop -->
<!-- transaction-card.svelte -->
<script>
	let { tx } = $props();
</script>
<div>{tx.amount} — {tx.status}</div>
```
```svelte
<!-- transaction-card.stories.svelte -->
<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TransactionCard from './transaction-card.svelte';
	const { Story } = defineMeta({
		title: 'Payments/TransactionCard',
		component: TransactionCard
	});
</script>
<Story name="Success" args={{ tx: { amount: '₹4,999', status: 'success' } }} />
<Story name="Failed" args={{ tx: { amount: '₹4,999', status: 'failed' } }} />
<Story name="Pending" args={{ tx: { amount: '₹4,999', status: 'pending' } }} />
```
The route's `+page.svelte` then owns the `getTransaction()` call and passes the resolved value into `TransactionCard` — keeping data-fetching at the route level and visuals at the component level, which is also exactly what makes the component testable in Storybook.

### Key docs

- **Theming** (CSS variables): https://shadcn-svelte.com/docs/theming.md
- **SvelteKit setup**: https://shadcn-svelte.com/docs/installation/sveltekit.md
- **Dark mode**: https://shadcn-svelte.com/docs/dark-mode/svelte.md
- **Forms** (Formsnap + Superforms + Zod): https://shadcn-svelte.com/docs/components/form.md
- **Svelte 5 migration**: https://shadcn-svelte.com/docs/migration/svelte-5.md