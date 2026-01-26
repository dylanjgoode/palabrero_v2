# Palabrero - Project Handoff Document

## What Is This?

Palabrero is a Spanish language learning app that lets users practice conversational Spanish with an AI tutor. The tutor provides real-time corrections, tracks mistakes, and gives users analytics on their progress over time.

Target user: Intermediate Spanish learners (~A2 level) who want conversation practice with feedback.

---
## Implementation Plan

### Open Decisions (resolve before scaffolding)
- Target platform: web app, Electron, or Tauri
- UI framework and charting library
- SQLite layer: raw SQL, Prisma, Drizzle, or another ORM
- TTS provider details (OpenAI vs system voices)
- Packaging and distribution requirements

### Milestones
1. Project setup and scaffolding
   - Choose stack and tools; set linting, formatting, and basic tests
   - Create app shell with top navigation and primary routes (Chat, Analytics, Settings)
   - Seed local data files (scenarios.json) and settings storage

2. Data model and storage
   - Design SQLite schema for conversations, messages, corrections, vocabulary, errors, topics, tenses, scenarios, and settings
   - Add migrations and seed data
   - Define export formats (CSV and Mochi)

3. AI services and analysis pipeline
   - Build chat orchestration with scenario system prompts
   - Implement analyzer to extract corrections, vocabulary, topics, and tenses
   - Add TTS generation with optional autoplay and caching
   - Handle retries, rate limits, and partial responses

4. Chat experience
   - Message list UI with avatars, inline corrections, and speaker controls
   - Scenario selection and custom scenario CRUD
   - Sidebar metrics and save/load conversation flows

5. Analytics and flashcards
   - Aggregation queries for overview, vocabulary, grammar, topics, and flashcards
   - Filters by conversation and date range
   - Flashcard review flow and Mochi export

6. QA and polish
   - Validate error states (missing API key, offline, malformed AI output)
   - Performance checks for large histories
   - Basic tests for analytics queries and exports

### Style and Visual Direction
- Professional, minimalist, and text-first
- Clear information hierarchy with restrained color accents
- Simple, predictable navigation; top nav for global sections
- Modular vertical feed for list-based content
- Modest imagery; typography and structure do the work
- Formal, informational tone

---

## Core Features

### 1. Conversational Practice
Users chat with an AI tutor in Spanish. The AI:
- Responds naturally to keep the conversation going
- Identifies and corrects mistakes inline (grammar, vocabulary, syntax)
- Provides the corrected version of problematic sentences
- Speaks responses aloud via text-to-speech (optional auto-play)

### 2. Roleplay Scenarios
Pre-built scenarios for contextual practice:
- **Standard Tutor** - General conversation practice
- **Café in Madrid** - Order food/drinks from a waiter
- **Job Interview** - Practice for a marketing job interview in Barcelona

Users can also create custom scenarios with their own AI persona instructions.

### 3. Learning Analytics Dashboard
A stats view showing the user's progress across multiple dimensions:

| Tab | What It Shows |
|-----|---------------|
| **Overview** | Conversation summaries, message counts |
| **Vocabulary** | Words learned over time, frequency charts, word categories |
| **Grammar** | Tense usage distribution, error type breakdown, accuracy trends |
| **Topics** | What subjects have been discussed (travel, food, work, etc.) |
| **Flashcards** | Generate study cards from mistakes for Mochi.cards app |

### 4. Vocabulary Tracking
- **Active vocabulary**: Words the user has used
- **Passive vocabulary**: Words introduced by the AI
- Real-time counts displayed in sidebar
- Export to CSV

### 5. Chat History
- Save conversations with custom names
- Load previous conversations to continue practicing
- Delete old conversations
- All saved chats feed into the analytics dashboard

---

## User Flows

### Flow 1: Basic Practice Session
```
1. Enter OpenAI API key in Settings
2. (Optional) Select a roleplay scenario
3. Click "New Chat"
4. Type a message in Spanish
5. AI responds with corrections (if any) + continues conversation
6. (Optional) Click speaker icon to hear the response
7. Vocabulary counts update in sidebar
8. Save conversation when done
```

### Flow 2: Review Progress
```
1. Click "Analytics" in sidebar
2. Filter by conversation and/or date range
3. Browse tabs to see vocabulary growth, grammar patterns, error types
4. Download vocabulary as CSV if desired
```

### Flow 3: Create Flashcards from Mistakes
```
1. Go to Analytics → Flashcards tab
2. Apply filters to select which conversations to include
3. Click "Generate Flashcards from Filtered View"
4. Review generated cards, uncheck any you don't want
5. Download as .mochi file
6. Import into Mochi.cards app to study
```

### Flow 4: Custom Roleplay Scenario
```
1. Click "Manage Scenarios" expander in sidebar
2. Fill in: name, description, system prompt (AI persona instructions)
3. Click "Add Scenario"
4. Select new scenario from dropdown
5. Start new chat to use the scenario
```

---

## What Gets Tracked Per Message

When a user sends a message, the AI analyzes it for:

**Error Types:**
- Grammar (verb conjugation, etc.)
- Agreement (gender/number)
- Vocabulary issues
- Prepositions
- Orthography
- Punctuation
- Register
- And more

**Tenses Used:**
- Present, preterite, imperfect, future, conditional, subjunctive, perfect tenses, etc. (13 total)

**Topics Discussed:**
- Everyday life, travel, work, food, emotions, culture, technology, health, relationships, current events, hobbies

**Vocabulary:**
- New words, advanced words, review words, idioms, collocations

---

## Data Storage

- Local SQLite database (`palabrero.db`)
- Roleplay scenarios stored in `scenarios.json`
- No cloud storage or user accounts - everything is local

---

## UI Layout

### Sidebar
- Settings (API key, auto-play toggle)
- Navigation (Chat / Analytics)
- Scenario selector
- New Chat / Save Chat buttons
- Load saved conversations
- Vocabulary metrics display

### Main Area (Chat Mode)
- Chat history with messages
- User messages have 🫠 avatar
- AI messages have 🤖 avatar and speaker icon for TTS
- Text input at bottom

### Main Area (Analytics Mode)
- Filter controls (conversation picker, date range)
- Key metric cards
- Tabbed interface with charts and tables

---

## Screenshots

Screenshots are available in `/screenshots/`:
- `homescreen.png` - Main chat interface
- `Roleplay_feature.png` - Scenario selection
- `Learning Analytics Dashboard.png` - Analytics overview
- `Grammar_tab.png` - Grammar analytics
- `Flashcards_tab.png` - Flashcard generation
- `audiofeature.png` - Text-to-speech feature

---

## External Dependencies

- **OpenAI API** - Powers the chat, analysis, and text-to-speech - Find in .env file
- **Mochi.cards** - External flashcard app (users export to this)
