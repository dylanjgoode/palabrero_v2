# Todo

## Chat UI - Missing Backend Features

### UI Needs Backend Implementation

- [ ] **Tense/Topic tracking** - Database schema exists (`tenses`, `topics`, junction tables) but API never extracts or populates this data from conversations
- [ ] **Conversation summaries** - `conversations.summary` field exists but is never populated; could auto-generate summary from conversation content
- [ ] **Corrected message content** - `messages.correctedContent` field exists but is never set; could store full corrected version of user messages

### Backend Ready - UI Missing

- [ ] **Delete conversation button** - Backend DELETE `/api/conversations/:id` works, but no UI button to trigger deletion
- [ ] **Vocabulary display in chat** - Backend extracts 1-3 vocab terms per message and stores with frequency tracking, but chat UI doesn't surface this data (may belong in analytics page)

### UI Polish

- [ ] **Mode/Output display** - Chat sidebar shows "Mode: conversational correction" and "Output: reply + corrections" as if configurable, but these are hardcoded; either make configurable or remove the display
