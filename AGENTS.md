## Project Overview

Palabrero is a local-first Spanish language learning web application. It's a conversational AI tutor that helps intermediate Spanish learners (A2-B1 level) practice Spanish with real-time corrections and analytics.


## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19, Tailwind CSS 4, Recharts
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **AI**: Google Gemini (chat completions)
- **Fonts**: IBM Plex Sans, IBM Plex Mono, Source Serif 4

## Key Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed scenarios and settings
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/
│   │   ├── chat/route.ts       # Chat API endpoint
│   │   ├── analytics/route.ts  # Aggregated analytics data
│   │   ├── conversations/      # CRUD + detail with topics/tenses
│   │   ├── vocabulary/route.ts # Vocabulary list with filtering
│   │   └── settings/route.ts   # User settings (Gemini API key)
│   ├── chat/page.tsx       # Main chat page
│   ├── analytics/page.tsx  # Analytics dashboard (Overview + Vocabulary tabs)
│   └── settings/page.tsx   # Settings page
├── components/
│   ├── top-nav.tsx             # Navigation bar
│   ├── chat/
│   │   ├── chat-client.tsx         # Main chat orchestrator (state + composition)
│   │   ├── message-list.tsx        # Scrollable message area with auto-scroll
│   │   ├── conversation-sidebar.tsx # Conversations list, topics/tenses, vocabulary
│   │   ├── delete-dialog.tsx       # Delete confirmation modal (ARIA alertdialog)
│   │   └── scenario-selector.tsx   # Scenario dropdown (ARIA combobox)
│   └── settings/
│       └── settings-form.tsx   # Google API key form with dirty-field tracking
├── db/
│   ├── schema.ts           # Drizzle schema & relations
│   └── index.ts            # Database initialization (WAL mode)
├── lib/
│   └── ai/
│       ├── provider.ts     # Provider factory (Gemini only)
│       ├── gemini-provider.ts # Gemini API integration
│       ├── parse.ts        # AI response JSON parsing
│       ├── types.ts        # Shared AI types
│       └── index.ts        # AI module entry point
└── data/
    └── scenarios.json      # Roleplay scenarios
```

## Code Conventions

### Components
- Server Components by default (Next.js App Router)
- Client Components marked with `"use client"` directive
- API routes use `export const runtime = "nodejs"`

### Database
- Drizzle ORM with type inference (`$inferSelect`, `$inferInsert`)
- camelCase in TypeScript, snake_case in SQL columns
- WAL mode enabled for SQLite
- All multi-step writes wrapped in `db.transaction()` using the `tx` parameter
- Vocabulary terms stored lowercase with a unique index

### API Routes
- Input validation at the top of each handler (type checks, length limits, clamped pagination)
- API key values masked in GET responses (first 4 + last 2 chars)
- Pagination supported: `?limit=N` with capped maximums

### Styling
- Tailwind utility classes preferred
- CSS variables for theme colors: `rgb(var(--accent))`
- Custom utility classes in `globals.css`: `.surface-card`, `.btn-primary`, `.eyebrow`
- Mobile-first responsive design

### TypeScript
- Path alias: `@/*` maps to `./src/*`
- Prefer type inference where possible
- Export types from schema using Drizzle's inference

## Environment Variables

Required:
- `GOOGLE_API_KEY` - Google API key for Gemini

Optional:
- `DATABASE_URL` - SQLite path (default: `./palabrero.db`)
- `GEMINI_MODEL` - Gemini model to use (default: `gemini-3-flash-preview`)

## API Response Format

The chat API returns structured JSON:
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

## Database Schema

Key tables: `scenarios`, `conversations`, `messages`, `corrections`, `vocabulary`, `topics`, `tenses`, `settings`

Relationships:
- Scenario → Conversations (onDelete: set null)
- Conversation → Messages
- Message → Corrections, Vocabulary
- Message ↔ Topics, Tenses (many-to-many via junction tables)

Constraints:
- `vocabulary.term` has a unique index
- Messages reference conversations with NOT NULL

## Development Notes

- No testing framework configured yet
- Homepage displays live stats from the database (conversations, vocabulary, messages, corrections)
- Analytics dashboard: Overview tab (weekly progress, error types, tense distribution, topic coverage) and Vocabulary tab (category summaries + table)
- Chat UI: corrections display, corrected content under user messages, conversation summaries, topics/tenses sidebar panel, session vocabulary
- Vocabulary review page not yet built (API at `/api/vocabulary` is ready)
