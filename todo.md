## Bugs (by priority)

- [x] **OpenAI/Gemini provider drops parsed response fields** - `parseJsonResponse` in `src/lib/ai/openai-provider.ts` only returns `reply`, `corrections`, and `vocabulary`. It silently discards `correctedContent`, `tenses`, `topics`, and `conversationSummary`. This breaks multiple features end-to-end.

- [x] **DELETE conversation is not transactional** - `src/app/api/conversations/[id]/route.ts` runs 6 separate awaited deletes without a `db.transaction()` wrapper. A mid-cascade failure leaves data inconsistent.

- [ ] **Chat error handler ignores API error details** - `handleSend` catch block in `chat-client.tsx` never reads the response body. Specific server errors (e.g., "API key not configured") are swallowed; the user always sees a generic fallback.

- [ ] **Truncated error message in chat** - `src/components/chat/chat-client.tsx:340` reads "Check your API key or try ." — missing text after "try".

- [ ] **Settings GET query is a tautology** - `src/app/api/settings/route.ts:16` uses `.where(eq(settings.key, settings.key))`, comparing the column to itself. Returns every row. Works accidentally because of the `ALLOWED_KEYS` filter afterward.

## Improvements (by priority)

- [x] **Add database indexes** - No indexes on `messages.conversation_id`, `corrections.message_id`, `vocabulary.term`, `vocabulary.message_id`. SQLite does not auto-create FK indexes. Performance degrades as data grows.

- [ ] **Validate conversationId from client** - `src/app/api/chat/route.ts` trusts the `conversationId` from the request body without verifying it exists. A bogus ID causes a silent no-op update, then FK errors on insert.

- [ ] **Add message length limit** - `normalizeMessages` has no per-message size cap. Arbitrarily large payloads get forwarded to the AI provider.

- [ ] **Deduplicate shared types** - `ChatMessage`, `Correction`, etc. are defined independently in `chat-client.tsx`, `chat/route.ts`, and `lib/ai/types.ts`. Consolidate into `lib/ai/types.ts`.

- [ ] **Improve delete modal accessibility** - The confirmation modal lacks `role="dialog"`, `aria-modal`, and a focus trap.

- [x] **Improve chat scroll behavior** - Force-scrolls to bottom on every message update with no check for whether the user has scrolled up. Add smooth scrolling and a near-bottom threshold.

## Features (by priority)

- [ ] **Add vocabulary review page** - Backend API `/api/vocabulary` exists with filtering, sorting, and category summaries. Needs UI.

- [ ] **Wire up analytics filters** - Conversation selector, date range, error type, and scenario filters are rendered but not functional.

- [ ] **Build remaining analytics tabs** - Grammar, Topics, and Flashcards tabs show "Coming soon" placeholders.

- [ ] **Wire up export buttons** - CSV download and Mochi flashcard generation buttons on analytics page are non-functional.

- [ ] **Mode/Output display** - Chat sidebar shows "Mode: conversational correction" and "Output: reply + corrections" as hardcoded text. Either make configurable or remove.

## Completed

- [x] **Build analytics dashboard** - Recharts-based overview with weekly progress, error types, tense distribution, and topic coverage charts. Vocabulary tab with category summaries and sortable table.

- [x] **Display corrected content in chat** - Emerald box below user messages showing corrected version when corrections exist.

- [x] **Display conversation summary in list** - Truncated summary shown below conversation title.

- [x] **Show topics/tenses in conversation UI** - Sidebar pills for tenses practiced and topics covered, accumulated in real-time and loaded from saved conversations.

- [x] **Create analytics API endpoint** - `GET /api/analytics` returning tense/topic/correction distributions, weekly progress, and summary totals.
