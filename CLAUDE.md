# CLAUDE.md

## Project Overview

Palabrero is a local-first Spanish language learning web application. It's a conversational AI tutor that helps intermediate Spanish learners (A2-B1 level) practice Spanish with real-time corrections and analytics.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19, Tailwind CSS 4, Recharts
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **AI**: OpenAI API or Google Gemini (chat completions), OpenAI TTS
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
│   │   └── settings/route.ts   # User settings
│   ├── chat/page.tsx       # Main chat page
│   ├── analytics/page.tsx  # Analytics dashboard
│   └── settings/page.tsx   # Settings page
├── components/             # React components
│   ├── top-nav.tsx         # Navigation bar
│   └── chat/               # Chat-related components
├── db/
│   ├── schema.ts           # Drizzle schema & relations
│   └── index.ts            # Database initialization
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

Required (one of):
- `OPENAI_API_KEY` - OpenAI API key (required if using OpenAI)
- `GOOGLE_API_KEY` - Google API key (required if using Gemini)

Optional:
- `AI_PROVIDER` - AI provider to use: `openai` or `gemini` (default: `openai`)
- `DATABASE_URL` - SQLite path (default: `./palabrero.db`)
- `OPENAI_MODEL` - OpenAI model to use (default: `gpt-4o-mini`)
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
}
```

## Database Schema

Key tables: `scenarios`, `conversations`, `messages`, `corrections`, `vocabulary`, `topics`, `tenses`, `settings`

Relationships:
- Scenario → Conversations → Messages
- Message → Corrections, Vocabulary
- Message ↔ Topics, Tenses (many-to-many via junction tables)

## Development Notes

- No testing framework configured yet
- Analytics dashboard built with Recharts (weekly progress, error types, tense distribution donut, topic coverage); fetches from `/api/analytics`. Vocabulary tab with category summaries and table. Error states with retry. ARIA tab roles.
- Settings page is a placeholder shell
- Chat UI includes: corrections display, corrected content under user messages, conversation summaries, topics/tenses sidebar panel, session vocabulary
- Vocabulary review page not yet built (API at `/api/vocabulary` is ready)
