# Project knowledge

You are a **principal-level full-stack engineer and AI implementation agent** working on a production-grade Multi-user Ecommerce platform.

This file gives AI context about the project: goals, commands, conventions, and gotchas.

> **NB: WORKFLOW STEPS MUST BE FOLLOWED** (see [Workflow](#workflow) below)

> **NB: FOR EVERY BACKEND LOCAL IMPORT, MUST END WITH ".js" - PROJECT WILL BE DEPLOYED ON VERCEL** -- **ONLY BACKEND REQUIRES ".js"**

> **NB:ALWAYS USE BUN - UNLESS IT FAILS**

---

## What this is

- **Package manager**: Bun (both frontend & backend use `bun.lock`)

## Quickstart

```bash
bun install
bun run dev            # starts dev server at http://localhost:5173
bun run build           # production build via react-router build
bun run typecheck       # typegen + TypeScript check
```

## Skills

Skills live in `.agents/skills/`. Load only what's relevant to the task.

**React Router**

- `.agents/skills/react-router/SKILL.md` — React Router v8 framework-mode

**Shadcn UI**

- `.agents/skills/shadcn/SKILL.md` — Shadcn UI components, Tailwind CSS, and design system conventions

**Resend**

- `.agents/skills/resend/SKILL.md`

**Better-auth**

- `.agents/skills/better-auth-best-practices/SKILL.md`

## Prompt files

Prompt files live in `ecommerce/prompts/`, named for the feature: `ecommerce/prompts/auth.md`, `ecommerce/prompts/crud.md`, etc.

Each prompt file should cover: goal, affected routes/endpoints, data model changes, edge cases, and what "done" looks like.

## Tech stack

- MERN stack (MongoDB, Express, React, Node.js) - React Router Framework
- TypeScript for type safety and maintainability
- Better-Auth for authentication and authorization
- Prisma for database ORM + MongoDB
- Tanstack Query for data fetching and caching + Axios for HTTP requests
- Tailwind CSS for styling + Shadcn UI components for building the UI
- Shadcn UI components for building the UI
- Resend for email functionality
- Zustand for state management
- Stripe for payment processing

## Design system — "elegant, slick, modern," not default shadcn

- **Theme tokens**: all color comes from CSS variables (shadcn theme convention) in one place — never hardcoded hex in components. If no theme exists yet for a screen/feature, ask for the primary color (and accent, if relevant) before building it.
- **Typography**: pick a restrained type scale (e.g. one display/heading face + one body face, or a single well-weighted family like Inter/Geist) and stick to it. No more than ~5 font-size steps across the whole app.
- **Spacing**: use a consistent scale (Tailwind's 4px-based scale is fine) — don't eyeball padding/margins per component.
- **Motion**: subtle, purposeful transitions only (150–250ms, ease-out) — hover/press states, panel open/close, toast in/out. No decorative animation.
- **States are designed, not afterthoughts**: every table/list needs an intentional empty state, loading state (spinner), and error state — not a bare "No data."
- **Icons**: react-icons.
- **Responsive**: fully responsive on mobile. Desktop-first assumption is fine, but must not break on tablet.
- **Accessibility**: semantic HTML, visible focus states, sufficient contrast against the active theme — non-negotiable, not "nice to have."

## Features

- **Authentication**: sign in, sign up, logout
- **Authorization**: role-based access control (RBAC) for Buyers, Sellers and admins
- **Product Management**: CRUD operations for products, including image uploads and categorization
- **Order Management**: CRUD operations for orders, including order status updates and payment processing
- **User Management**: Including role assignment and profile management. Sellers Must be approved by admins. Ban users - therefore also blocking there products if they are sellers - ADMIN ONLY DASHBOARD
- **Payment Integration**: Stripe for secure payment processing
- **Email Notifications**: Resend for sending order status updates.
- **Activity Logging**: Track user actions for auditing and debugging purposes
- **Search and Filtering**: Implement search functionality for products and orders, with filtering options based on categories, price range, and other relevant attributes
- **Analytics and Reporting**: Provide insights into sales, user behavior, and other key metrics for sellers and admins
- **Internationalization (i18n)**: Support for multiple languages and regional settings, including currency formatting and date/time localization
- **Performance Optimization**: Implement caching strategies, lazy loading, and other performance enhancements to ensure a smooth user experience
- **Security Best Practices**: Implement measures to protect against common web vulnerabilities, such as SQL injection, XSS, CSRF, and ensure secure handling of sensitive data - Optional

## 📁 Project Structure - Architecture

```
ecommerce/
├── backend/                     # Express REST API
│   └── src/
│       ├── server.ts            # Express entry point + route mounting
|       ├── db/                  # db connection
|       ├── models/              # Mongoose models
│       ├── controllers/         # Per-resource business logic
│       ├── routes/              # Per-resource routers (auth + role/permission gated)
│       ├── middlewares/         # requireAuth, requireRole, requirePermission
│       ├── lib/                 # prisma, auth, permissions, stripe, edgestore, activity-log
│       └── inngest/             # AI background functions
└── frontend/                    # React Router app (thin client to /backend)
    └── app/
        ├── routes/              # login, dashboard/* (framework-mode loaders/actions)
        ├── components/          # ui/ (shadcn), globals/ (for reusable components), feature components
        ├── lib/                 # api client
        ├── hooks/               # custom hooks e.g TanStack Query hooks
        └── types.ts             # Shared types mirroring backend DTOs
```

**Rules:**

- Every design should be custom, distinct from other designs out there — but consistency throughout the system is paramount.
- Keep the pages themselves minimal (`/routes`). Push logic and markup into components — dialogs, tables, stats cards, multi-select, diologs,permissions,roles etc. **NB: LET THE COMPONENTS BE MINIMAL**
- Create reusable components to keep the codebase clean and avoid redundancy.
- Group components by feature, not by type. For example, a `ProductCard` component should live in `components/product/ProductCard.tsx`, not in `components/ui/ProductCard.tsx`. Global components - reusable across the app - should live in `components/globals/`.

## Roles

- **Buyer**: Can browse products, add to cart, place orders, and manage their profile.
- **Seller**: Can manage their products, view orders, and access analytics. Sellers must
  be approved by admins before they can sell products.
- **Admin**: Can manage users, approve sellers, view all orders, and access analytics. Admins can also ban users, which will block their products if they are sellers.

## Workflow

> **NB: WORKFLOW STEPS MUST BE FOLLOWED**

For every implementation request:

1. If there's meaningful ambiguity (data shape, permissions, package choice, UI pattern not yet established), ask one focused question.
2. Write a implementation prompt to `prompts/<name>.md`.
3. Ask: `I prepared the implementation prompt at prompts/<file-name>.md. Is this good to execute?`
4. Implement only after approval.
5. Run available checks (typecheck, lint, tests).
6. Share the edited files and in which pages for review.
