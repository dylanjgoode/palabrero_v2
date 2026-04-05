# AGENTS.md

## Project Overview

Palabrero is a local-first Spanish language learning web application. It's a conversational AI tutor that helps intermediate Spanish learners (A2-B1 level) practice Spanish with real-time corrections and analytics.

**Tech Stack:**
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19, Tailwind CSS 4, Recharts
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **AI**: Google Gemini (chat completions)
- **Fonts**: IBM Plex Sans, IBM Plex Mono, Source Serif 4

## Setup Commands

- Install dependencies: `npm install`
- Generate Drizzle migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Seed scenarios and settings: `npm run db:seed`

## Development Workflow

- Start development server: `npm run dev` (starts on localhost:3000)
- Database mode: SQLite in WAL mode
- Environment variables:
  - Required: `GOOGLE_API_KEY` (Google API key for Gemini)
  - Optional: `DATABASE_URL` (SQLite path, default: `./palabrero.db`)
  - Optional: `GEMINI_MODEL` (Gemini model to use, default: `gemini-3-flash-preview`)

## Testing Instructions

- *Note: No testing framework is configured yet.*
- Manual testing:
  - Homepage displays live stats (conversations, vocabulary, messages, corrections).
  - Chat UI: check the expandable 'notes' toggle under user messages for inline corrections, the History drawer for recent conversations, and the Tutor's Notebook sidebar for active session insights (tenses, topics, vocabulary, corrections).
  - Analytics dashboard: verify Overview tab (weekly progress, error types, tense distribution, topic coverage) and Vocabulary tab (category summaries + table).

## Code Style

### Components
- Server Components by default (Next.js App Router).
- Client Components marked with `"use client"` directive.
- API routes use `export const runtime = "nodejs"`.

### TypeScript
- Path alias: `@/*` maps to `./src/*`.
- Prefer type inference where possible.
- Export types from schema using Drizzle's inference (`$inferSelect`, `$inferInsert`).
- camelCase in TypeScript, snake_case in SQL columns.

### Styling
- **Premium Organic UI**: The design uses a refined, textural aesthetic (warm noise backgrounds, glassmorphic `.surface-card` elements, carefully staggered animations).
- Tailwind utility classes preferred.
- CSS variables for theme colors: `rgb(var(--accent))` (deep terracotta), `var(--ink)` (dark charcoal).
- Custom utility classes in `globals.css`: `.surface-card`, `.surface-muted`, `.btn-primary`, `.eyebrow`.
- Mobile-first responsive design.

### Database
- All multi-step writes wrapped in `db.transaction()` using the `tx` parameter.
- Vocabulary terms stored lowercase with a unique index.

### API Routes
- Input validation at the top of each handler (type checks, length limits, clamped pagination).
- API key values masked in GET responses (first 4 + last 2 chars).
- Pagination supported: `?limit=N` with capped maximums.

### Linting
- Run ESLint: `npm run lint`

## Build and Deployment

- Production build: `npm run build`

## Additional Notes

### Project Structure Highlights
- `src/app/`: Next.js App Router pages and API routes (`/api/chat`, `/api/analytics`, `/api/conversations`, `/api/vocabulary`, `/api/settings`).
- `src/components/chat/`: Main chat logic, message lists, sidebars, scenarios.
- `src/db/`: Drizzle schema & SQLite DB initialization.
- `src/lib/ai/`: Gemini provider integration and response parsing.
- `src/data/`: Roleplay scenarios (`scenarios.json`).

### API Response Format
The `/api/chat` API returns structured JSON:
```typescript
{
  reply: string;              // Spanish response
  corrections: Array<{
    type: string;             // "Grammar", "Vocabulary", etc.
    original: string;
    corrected: string;
    explanation?: string;
  }>;
  vocabulary: Array<{
    term: string;
    translation: string;
    partOfSpeech: string;
    category: string;
  }>;
  correctedContent: string | null;
  tenses: string[];
  topics: string[];
  conversationSummary: string;
  conversationId: string;
}
```

### Database Schema
- **Key tables:** `scenarios`, `conversations`, `messages`, `corrections`, `vocabulary`, `topics`, `tenses`, `settings`
- **Relationships:**
  - Scenario → Conversations (onDelete: set null)
  - Conversation → Messages
  - Message → Corrections, Vocabulary
  - Message ↔ Topics, Tenses (many-to-many via junction tables)
- **Constraints:**
  - `vocabulary.term` has a unique index
  - Messages reference conversations with NOT NULL

### Development Notes
- Vocabulary review page not yet built (API at `/api/vocabulary` is ready).