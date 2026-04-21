# Draft Kit UI

Next.js frontend for fantasy baseball draft management and player rankings.
The extracted backend now lives in `draft-kit-ui-backend/`.

## Libraries

- **Next.js 15 + React 19** - SSR framework
- **TypeScript** - Strict mode
- **Chakra UI** - Component library
- **Tailwind CSS 3** - Utility styling
- **TanStack Query (React Query) 5** - Server state management
- **Axios** - HTTP client
- **Zod** - Schema validation
- **Vitest + Testing Library** - Testing
- **ESLint 9 + Prettier** - Code quality
- **Husky + lint-staged** - Git hooks

## Setup & Run

```bash
# Install
npm install

# Environment
cp .env.example .env.local

# NEXT_PUBLIC_BACKEND_URL is for this app's Next API routes to reach the Draft Kit backend
# NEXT_PUBLIC_API_URL is for the external player API

# Run
npm run dev              # Dev server (http://localhost:3000)
npm run build            # Production build
npm start                # Production server
npm test                 # Run tests
npm run lint             # Lint code
```

Set `NEXT_PUBLIC_BACKEND_URL` to the Draft Kit backend deployment or local backend app.
Set `NEXT_PUBLIC_API_URL` to the external player/stats API.

## Adding a Feature

Create a new folder in `src/features/[feature-name]/`:

**1. `types/[feature].types.ts`** - Zod schemas and TypeScript types

- Define Zod schemas for API responses
- Export inferred TypeScript types using `z.infer<>`

**2. `api/[api-call].ts`** - API client functions

- Use Axios instance from `@/lib/axios`
- Validate responses with Zod `.parse()`
- Return typed data

**3. `hooks/use-[feature].ts`** - React Query hooks

- Wrap API calls with `useQuery` or `useMutation`
- Export custom hooks for components

**4. `components/[component].tsx`** - React components

- Use Chakra UI components
- Call feature hooks for data
- Keep feature-specific

**5. Create page in `src/app/[page-name]/page.tsx`**

- Import and compose feature components
- Add to Next.js App Router

## Feature Rules

- Features are self-contained (api, components, hooks, types together)
- Features should NOT import from other features
- Shared code goes in `src/shared/`
- Tests live next to code (`component.test.tsx`)
- Use kebab-case for files

## Data Fetching Pattern

**Types** → **API** → **Hook** → **Component**

API responses validated with Zod, state managed with React Query, consumed in components via custom hooks.
