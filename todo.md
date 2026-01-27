## Partially Implemented (backend ready, needs UI)

- [ ] **Add vocabulary review page** - Create a vocabulary dashboard page to display accumulated vocabulary across all sessions. Backend API `/api/vocabulary` already exists with filtering, sorting, and category summaries. Build UI showing full vocabulary list with term, translation, part of speech, category, filter/sort options, and first/last seen dates.

- [ ] **Show topics/tenses in conversation UI** - Backend extracts and stores topics (food, travel, work, etc.) and tenses (present, preterite, imperfect, etc.) for each message. This data is invisible to users. Add badges or panel showing tenses/topics used in current conversation.


## Not Implemented (database schema ready)

- [ ] **Create analytics API endpoints** - Build backend endpoints to support analytics dashboard:
  - `GET /api/analytics/tenses` - tense usage distribution
  - `GET /api/analytics/topics` - topic coverage distribution
  - `GET /api/analytics/corrections` - error types breakdown
  - `GET /api/analytics/progress` - learning metrics over time

- [ ] **Build analytics dashboard** - The `/app/analytics/page.tsx` exists as placeholder. Build out with:
  - Tense usage distribution chart
  - Topic distribution chart
  - Error type frequency breakdown
  - Learning progress over time
  - *(Blocked by: Create analytics API endpoints)*

## UI Polish

- [ ] **Mode/Output display** - Chat sidebar shows "Mode: conversational correction" and "Output: reply + corrections" as if configurable, but these are hardcoded; either make configurable or remove the display

## Completed

- [x] **Display corrected content in chat** - Added UI to show corrected version of user messages below the original when corrections exist. Shows in emerald-colored box with "Corrected version" label.

- [x] **Display conversation summary in list** - Added summary display in conversation list. Shows truncated summary below the title when available.
