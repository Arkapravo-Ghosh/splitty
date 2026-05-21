# Splitty

**Split your expenses easily.**

> 🚀 **Try it live at [splitty.arkapravo.in](https://splitty.arkapravo.in)** — no install needed.

## What is Splitty?

Splitty is a lightweight, self-hostable web app for tracking shared expenses inside a group of people and figuring out the simplest way to settle up. Think of it as a focused, no-frills alternative to apps like Splitwise: you create a group, add the people in it, log who paid for what, and Splitty tells everyone exactly which transfers will leave the group square — using as few payments as possible.

## What is it for?

It's built for the small, recurring situations where money gets messy:

- **Trips and holidays** — someone books the hotel, someone else covers dinner, a third person rents the car.
- **Flatmates and roommates** — groceries, utilities, that one big delivery, the new vacuum cleaner.
- **Friend groups and meetups** — one person tabs out at the bar and everyone Venmos them later.
- **Couples and families** — keeping a running tab on who paid for what without spreadsheets.

If you've ever ended a trip with a screenshot of a Notes-app tally and a vague promise to "sort it out later" — that's the problem Splitty solves.

## What can it do?

- **Email / password accounts** with secure session cookies (JWT via `jose`, passwords hashed with `bcryptjs`).
- **Expense groups** — own and belong to as many groups as you like; Splitty remembers which one you had open last.
- **Member management** — invite existing users to a group by email; members can leave any group they don't own.
- **Expenses** — record amount, who paid, who added it, and free-form details. Owners can edit any row; members can edit rows they added or paid for.
- **Lockable groups** — owners can lock a group when a trip ends, freezing it as read-only.
- **Multi-currency** — pick from a `currencies` table per group; amounts render with the group's symbol (₹, $, €, …).
- **Settle up** — a greedy minimum-transfer algorithm shows the smallest set of payments that settles the group, and each transfer can be ticked off as paid.
- **Profile management** — change your name or password, or soft-delete your account.
- **Light / dark theme** out of the box.

## How the settle-up math works

When you open a group's **Settle up** view, Splitty:

1. Sums every expense in the group.
2. Divides the total equally among current members to get each person's fair share.
3. For each member, computes `balance = paid − share`. Positive means they're owed money; negative means they owe.
4. Greedily pairs the largest creditor with the largest debtor, settles the smaller of the two amounts, and repeats until everyone is within half a cent of zero.

The result is `O(n)` transfers in the typical case rather than the naive `O(n²)`. See [src/lib/expense-groups/split.ts](src/lib/expense-groups/split.ts).

## Tech stack

| Layer         | Choice                                                                  |
| ------------- | ----------------------------------------------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org) (App Router, React Compiler enabled)   |
| UI            | React 19, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com) (`base-lyra` style), [Phosphor Icons](https://phosphoricons.com) |
| Database      | [Neon](https://neon.tech) serverless Postgres via `@neondatabase/serverless` |
| ORM           | [Drizzle ORM](https://orm.drizzle.team) + `drizzle-kit`                 |
| Auth          | `jose` (JWT) + `bcryptjs` + httpOnly cookie                             |
| Notifications | `sonner` (toasts)                                                       |

> ⚠️ This project tracks the latest Next.js. APIs and conventions may differ from older versions — see `AGENTS.md`.

## Project layout

```
src/
├── app/                     # Next.js app router
│   ├── api/                 # Route handlers
│   │   ├── auth/            # sign-in, sign-up, sign-out, profile, password, delete, active-group
│   │   ├── currencies/      # GET /api/currencies
│   │   └── expense-groups/  # CRUD + members, expenses, settlements
│   ├── auth/                # /auth/sign-in, /auth/sign-up (UI)
│   ├── groups/[groupId]/    # Per-group pages (e.g. /groups/.../settle)
│   ├── profile/             # Profile settings page
│   ├── layout.tsx           # Loads session + groups, wraps providers
│   └── page.tsx             # Home: greets the user and renders expenses
├── components/
│   ├── expense-groups/      # Group switcher, panel, dialogs, settlement view
│   └── ui/                  # shadcn/ui primitives
├── db/
│   ├── schema.ts            # Drizzle schema: users, currencies, expense_groups,
│   │                        #   expense_group_members, expenses, settlements
│   └── index.ts             # `db` client (Neon HTTP driver)
├── lib/
│   ├── auth/                # JWT, session, cookie, password helpers
│   └── expense-groups/      # Server queries, REST client, settle algorithm
├── hooks/
└── proxy.ts
drizzle.config.ts            # drizzle-kit config (reads DATABASE_URL via dotenv)
```

---

## Getting started

### Prerequisites

- **Node.js 20+** and npm
- A **Postgres database**. The defaults assume [Neon](https://neon.tech) (the HTTP driver is wired up in [src/db/index.ts](src/db/index.ts)), but any Postgres reachable via a connection string will work.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

You need two variables:

| Variable       | Required | Notes                                                                                                  |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | yes      | Postgres connection string. For Neon use the pooled URL with `?sslmode=require&channel_binding=require`. |
| `JWT_SECRET`   | yes      | **At least 32 characters.** Used to sign session JWTs. Generate one with `openssl rand -base64 48`.    |

The app throws at startup if `JWT_SECRET` is missing or shorter than 32 chars (see [src/lib/auth/jwt.ts:11](src/lib/auth/jwt.ts#L11)).

### 3. Set up the database

Drizzle Kit reads `DATABASE_URL` from `.env` via `dotenv/config`.

```bash
# Generate SQL migrations from the schema
npm run db:generate

# Apply them to the database
npm run db:migrate

# …or, for quick local iteration, push the schema directly
npm run db:push
```

> Splitty looks up symbols from a `currencies` table at runtime (and defaults new groups to `INR`). Seed it with at least one row, for example:
>
> ```sql
> INSERT INTO currencies (code, symbol, name) VALUES
>   ('INR', '₹', 'Indian Rupee'),
>   ('USD', '$', 'US Dollar'),
>   ('EUR', '€', 'Euro'),
>   ('GBP', '£', 'British Pound')
> ON CONFLICT (code) DO NOTHING;
> ```

Use `npm run db:studio` to browse and edit data in Drizzle Studio.

### 4. Run the dev server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000), create an account at `/auth/sign-up`, and you'll land on the home page where you can create your first group.

## NPM scripts

| Script                | What it does                                          |
| --------------------- | ----------------------------------------------------- |
| `npm run dev`         | Start the Next.js dev server                          |
| `npm run build`       | Production build                                      |
| `npm run start`       | Serve the production build                            |
| `npm run lint`        | Run ESLint                                            |
| `npm run db:generate` | Generate Drizzle SQL migrations from `schema.ts`      |
| `npm run db:migrate`  | Apply pending migrations                              |
| `npm run db:push`     | Push schema directly to the database (dev only)       |
| `npm run db:pull`     | Introspect an existing database into Drizzle schema   |
| `npm run db:studio`   | Open Drizzle Studio                                   |

## API surface (route handlers)

All endpoints live under `/api` and require a valid session cookie unless noted.

```
POST   /api/auth/sign-up           Create an account
POST   /api/auth/sign-in           Issue a session cookie
POST   /api/auth/sign-out          Clear the session cookie
PATCH  /api/auth/profile           Update display name
POST   /api/auth/change-password   Verify current password and set a new one
DELETE /api/auth/delete-account    Soft-delete the current user
POST   /api/auth/active-group      Remember the user's last-selected group

GET    /api/currencies             List supported currencies

GET    /api/expense-groups                              List groups for the user
POST   /api/expense-groups                              Create a group
PATCH  /api/expense-groups/:groupId                     Rename / change currency / lock
DELETE /api/expense-groups/:groupId                     Delete a group (owner only)

GET    /api/expense-groups/:groupId/members             List members
POST   /api/expense-groups/:groupId/members             Add a member by email
DELETE /api/expense-groups/:groupId/members/:userId     Remove / leave

GET    /api/expense-groups/:groupId/expenses            List expenses
POST   /api/expense-groups/:groupId/expenses            Add an expense
PATCH  /api/expense-groups/:groupId/expenses/:id        Edit an expense
DELETE /api/expense-groups/:groupId/expenses/:id        Delete an expense

GET    /api/expense-groups/:groupId/settlements         Computed transfers + paid flags
PATCH  /api/expense-groups/:groupId/settlements         Mark a transfer paid/unpaid
```

The browser-side wrapper for these is [src/lib/expense-groups/client.ts](src/lib/expense-groups/client.ts).

## Deployment notes

- The Neon HTTP driver works on the Edge runtime, but the routes here explicitly opt into `runtime = "nodejs"` to use `bcryptjs`. If you switch hosts, make sure Node-compatible APIs are available.
- Set `DATABASE_URL` and `JWT_SECRET` in your platform's secret manager — never commit `.env`. Rotating `JWT_SECRET` invalidates all existing sessions.
- Run migrations (`npm run db:migrate`) as part of your deploy pipeline.

## License

Licensed under the **GNU Affero General Public License v3.0** — see [LICENSE](LICENSE) for the full text.

In short: you're free to use, modify, and self-host Splitty, but if you run a modified version as a network service you must make your source available to its users under the same license.
