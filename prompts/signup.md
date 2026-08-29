# Sign Up Page - Google OAuth Only

## Goal

Build a sign up page with Google OAuth and email/password options, matching the Dribbble reference design. The page provides social sign-up (Google only, no Facebook), email/password form with validation, and a promotional right panel.

## Design Reference

Based on the Dribbble reference with these adaptations:
- **Remove** Facebook button only
- **Keep** the "Welcome" heading and subtitle
- **Keep** the split layout (left form + right promotional panel)
- **Keep** email/password form fields with labels and placeholders
- **Keep** "Forgot password?" link next to password field
- **Keep** the right panel with product showcase cards and "Start Shopping Today" CTA
- **Change** "Login" button to "Sign Up"
- **Change** "Don't have an account? Register" to "Already have an account? Sign in"

## Affected Routes/Endpoints

| Route | Action |
|---|---|
| `frontend/app/routes/signup.tsx` | New route module (sign up page) |
| `frontend/app/routes.ts` | Add signup route |

**Backend endpoints used (existing):**
- `POST /api/auth/signUp/email` — Better-Auth email sign-up endpoint (called via `authClient.signUp.email()`)
- `POST /api/auth/signIn/social` — Better-Auth Google OAuth sign-in/up endpoint (called via `authClient.signIn.social()`)

## Data Model Changes

None — uses existing Better-Auth User, Session, Account models.

## Implementation Details

### Route: `signup.tsx`

**Layout:** Full-viewport split layout (desktop: side-by-side, mobile: stacked).

**Left Panel (form side):**
- White background
- "Welcome" heading (use `font-heading` for Playfair Display)
- Subtitle: "Get started for a seamless shopping experience"
- Google button: "Continue with Google" with inline Google "G" SVG icon
- Divider: "OR" separator between social and form
- **Email field**: Label "Email", placeholder "john doe@gmail.com"
- **Password field**: Label "Password", placeholder "At least 8 characters", with show/hide toggle (Eye/EyeOff icons from `lucide-react`)
- **Forgot password?** link aligned right below password field
- **Sign Up** button (full width, primary style)
- Footer text: "Already have an account? Sign in" → `/login`

**Form behavior:**
- Use React state for email, password, showPassword
- Use `authClient.signUp.email({ email, password, name })` for email sign-up
- Use `authClient.signIn.social({ provider: "google", callbackURL: "/" })` for Google
- Basic client-side validation: email format, password min 8 chars
- Show loading state on buttons during auth calls
- Display error messages from Better-Auth response

**Right Panel (promotional side):**
- Light gray/warm background (use `bg-secondary` or similar theme token)
- Floating product card mockup showing:
  - A product image placeholder (use a styled div with gradient or placeholder)
  - Star rating (5 stars)
  - Testimonial text: "got a beautifully customized t-shirt from BQG Unlimited, the design is so nice, I LOVE IT"
  - "Exquisite" label
- Section heading: "Start Shopping Today"
- Description: "Get personalized shopping and customization experience on BQG Unlimited when you sign into your account."
- Small tag/badge element below

**Components to use (already installed):**
- `Button` from `@/components/ui/button`
- `Input` from `@/components/ui/input`
- `Label` from `@/components/ui/label`
- `Separator` from `@/components/ui/separator`
- `Card` from `@/components/ui/card`

**Icons:**
- Google icon: inline SVG (standard Google "G" logo — do not use react-icons as it's not installed)
- Password toggle: `Eye`, `EyeOff` from `lucide-react`
- Stars: use unicode stars or `Star` from `lucide-react`

### Route Registration

Add to `frontend/app/routes.ts`:
```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("signup", "routes/signup.tsx"),
] satisfies RouteConfig;
```

## Edge Cases

- **Google OAuth not configured**: Show a toast/alert if `GOOGLE_CLIENT_ID` is empty (dev mode). The button should still render but may fail gracefully.
- **Already signed in**: If user has an active session, redirect to `/` via `clientLoader`.
- **Mobile responsive**: Stack panels vertically on mobile, right panel becomes a compact banner below the form.
- **Email already registered**: Better-Auth returns error — display it below the form.
- **Weak password**: Client-side validation rejects passwords under 8 characters.
- **Network errors**: Show generic error message if auth request fails.

## What "Done" Looks Like

1. Navigate to `/signup` shows the split layout page
2. Left panel has "Welcome" heading, subtitle, Google button, OR divider, email/password fields, Forgot password link, and Sign Up button
3. Right panel shows promotional content with product card mockup
4. Clicking "Continue with Google" triggers Better-Auth Google OAuth flow
5. Filling email/password and clicking "Sign Up" creates account via Better-Auth
6. On successful sign-up, user is redirected to `/`
7. "Already have an account? Sign in" link navigates to `/login`
8. Password field has show/hide toggle
9. Form validates email format and password min 8 chars
10. Loading states shown on buttons during auth calls
11. Error messages displayed from Better-Auth response
12. Page is fully responsive (mobile-first)
13. Uses project theme tokens (no hardcoded colors)
14. `bun run typecheck` passes
