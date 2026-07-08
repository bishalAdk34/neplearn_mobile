# NepLearn Mobile - Architecture Diagrams

## 1. Backend Architecture Overview

```mermaid
flowchart TB
    subgraph Mobile["📱 React Native / Expo App"]
        UI[Screens & Components]

        subgraph State["State Management"]
            Auth[auth.ts<br/>Zustand Store]
            Vocab[vocab.ts<br/>Zustand + Persist]
        end

        subgraph Services["Services Layer"]
            DB[db.ts]
            AI[ai.ts]
            TTS[tts.ts]
            Notif[notifications.ts]
            IMG[image.ts]
        end

        Hooks[useSpeechRecognition.ts]
    end

    subgraph Storage["Local Storage"]
        AS[(AsyncStorage)]
    end

    subgraph Supabase["☁️ Supabase Backend"]
        subgraph Auth_SB["Authentication"]
            OAuth[Google OAuth]
            JWT[JWT Sessions]
        end

        subgraph DB_SB["PostgreSQL + RLS"]
            profiles[(profiles)]
            words[(user_learned_words)]
            xp[(user_xp)]
            streaks[(user_streaks)]
            journal[(journal_entries)]
            chat[(ai_chat_history)]
        end

        subgraph Functions["Server Functions"]
            RPC[get_total_xp RPC]
            Trigger[handle_new_user Trigger]
        end
    end

    subgraph External["External APIs"]
        Gemini[🤖 Google Gemini<br/>AI Tutor]
        Wiki[📚 Wikipedia<br/>Word Images]
        GTTS[🔊 Google TTS<br/>Speech]
        GSI[🔐 Google Sign-In]
    end

    %% Connections
    UI --> State
    UI --> Services
    UI --> Hooks

    State <--> AS

    DB --> Supabase
    Auth --> OAuth
    AI --> Gemini
    TTS --> GTTS
    IMG --> Wiki
    Auth --> GSI

    OAuth --> JWT
    JWT --> DB_SB
    RPC --> xp
    Trigger --> profiles
```

---

## 2. ER Diagram (Database Schema)

```mermaid
erDiagram
    auth_users ||--o| profiles : "creates (trigger)"
    profiles ||--o{ user_learned_words : "has"
    profiles ||--o{ user_xp : "earns"
    profiles ||--o| user_streaks : "maintains"
    profiles ||--o{ journal_entries : "writes"
    profiles ||--o{ ai_chat_history : "chats"

    auth_users {
        uuid id PK
        string email
        jsonb raw_user_meta_data
        timestamp created_at
    }

    profiles {
        uuid id PK,FK
        string name
        string email
        string avatar_url
        string learning_goal
        string learning_level
        boolean onboarded
        timestamp created_at
    }

    user_learned_words {
        bigint id PK
        uuid user_id FK
        int word_id
        timestamp learned_at
    }

    user_xp {
        bigint id PK
        uuid user_id FK
        int xp_amount
        string source
        timestamp created_at
    }

    user_streaks {
        bigint id PK
        uuid user_id FK
        int current_streak
        int longest_streak
        date last_activity_date
    }

    journal_entries {
        bigint id PK
        uuid user_id FK
        string prompt_nepali
        string prompt_roman
        string prompt_english
        text response_text
        timestamp created_at
    }

    ai_chat_history {
        bigint id PK
        uuid user_id FK
        string role
        text content
        timestamp created_at
    }
```

---

## 3. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as React Native App
    participant GSI as Google Sign-In
    participant SB as Supabase Auth
    participant DB as Supabase DB

    U->>App: Tap "Sign in with Google"
    App->>GSI: GoogleSignin.signIn()
    GSI-->>App: { idToken, user }
    App->>SB: signInWithIdToken(provider: 'google', token)
    SB-->>App: { session, user }

    Note over SB,DB: Trigger fires
    SB->>DB: handle_new_user()
    DB->>DB: INSERT INTO profiles

    App->>App: useAuthStore.setSession()
    App->>App: Navigate to Home
```

---

## 4. Data Sync Flow (Vocabulary)

```mermaid
flowchart LR
    subgraph Local["Local (Zustand + AsyncStorage)"]
        LS[learnedByUser<br/>Record‹userId, wordId[]›]
    end

    subgraph Cloud["Supabase"]
        ULW[(user_learned_words)]
    end

    LS -->|"learnWord()"| ULW
    LS -->|"unlearnWord()"| ULW
    ULW -->|"syncFromCloud()"| LS

    subgraph Merge["Conflict Resolution"]
        M[Set Union<br/>local ∪ cloud]
    end

    LS --> M
    ULW --> M
    M --> LS
```

---

## 5. XP System Flow

```mermaid
flowchart TD
    subgraph Sources["XP Sources"]
        L[Lesson Complete<br/>+10 XP]
        Q[Quiz Correct<br/>+5 XP]
        J[Journal Entry<br/>+15 XP]
        S[Streak Bonus<br/>+5 XP]
        E[Echo Practice<br/>+3 XP]
    end

    Sources --> ADD[addXp service]
    ADD --> DB[(user_xp table)]

    DB --> RPC[get_total_xp RPC]
    RPC --> UI[Profile Screen<br/>Total XP Display]

    subgraph Guest["Guest Mode"]
        GS[AsyncStorage<br/>localXp cache]
    end

    Sources -.->|"userId starts __guest__"| GS
```

---

## 6. Service Layer Architecture

```mermaid
flowchart TB
    subgraph Screens["Screens"]
        Home[HomeScreen]
        Vocab[VocabScreen]
        Chat[AIChatScreen]
        Profile[ProfileScreen]
        Journal[JournalScreen]
    end

    subgraph Hooks["Hooks"]
        SR[useSpeechRecognition]
    end

    subgraph Services["Services"]
        direction TB
        DB[db.ts<br/>───<br/>upsertProfile<br/>syncLearnWord<br/>addXp<br/>updateStreak<br/>saveJournalEntry<br/>saveChatMessage]

        AI[ai.ts<br/>───<br/>askAI<br/>systemPrompt]

        TTS[tts.ts<br/>───<br/>speakNepali<br/>speakEnglish]

        IMG[image.ts<br/>───<br/>getWordImage]

        NOT[notifications.ts<br/>───<br/>scheduleDailyReminder]
    end

    subgraph External["External APIs"]
        SB[(Supabase)]
        GM[Gemini API]
        WK[Wikipedia API]
        GT[Google TTS]
    end

    Screens --> Services
    Screens --> Hooks

    DB --> SB
    AI --> GM
    TTS --> GT
    IMG --> WK
    SR --> |"ne-NP locale"| Native[Native Speech API]
```

---

## 7. Guest vs Authenticated User Flow

```mermaid
flowchart TD
    Start[App Launch] --> Check{Check Session}

    Check -->|"session exists"| Auth[Authenticated User]
    Check -->|"no session"| Guest[Guest Mode]

    Auth --> Cloud[All data → Supabase]
    Guest --> Local[All data → AsyncStorage]

    Guest -->|"Sign in later"| Migrate[Data stays local<br/>No migration yet]
    Migrate --> Auth

    subgraph AuthFeatures["Auth Features"]
        A1[Cloud sync]
        A2[Cross-device]
        A3[Profile in DB]
    end

    subgraph GuestFeatures["Guest Features"]
        G1[Local only]
        G2[Single device]
        G3[__guest__ prefix]
    end

    Auth --> AuthFeatures
    Guest --> GuestFeatures
```

---

## 8. State Management Architecture

```mermaid
flowchart LR
    subgraph Zustand["Zustand Stores"]
        AS[useAuthStore<br/>───<br/>user<br/>session<br/>isLoading]

        VS[useVocabStore<br/>───<br/>learnedByUser<br/>localXp<br/>localStreak<br/>learningGoal<br/>learningLevel]
    end

    subgraph Persist["Persistence"]
        AST[(AsyncStorage)]
    end

    VS <-->|"zustand/middleware<br/>persist"| AST
    AS <-->|"manual sync"| AST

    subgraph Components["React Components"]
        C1[useAuthStore hook]
        C2[useVocabStore hook]
    end

    AS --> C1
    VS --> C2
```

---

## Summary Table

| Diagram | Shows |
|---------|-------|
| **Backend Overview** | Full system architecture w/ all connections |
| **ER Diagram** | 6 tables, relationships, RLS boundaries |
| **Auth Flow** | Google OAuth → Supabase → auto-profile trigger |
| **Data Sync** | Bidirectional sync w/ Set union merge |
| **XP System** | 5 sources → aggregation → display |
| **Services** | Service layer → external API mapping |
| **Guest/Auth** | Two data paths, no migration |
| **State** | Zustand + AsyncStorage persistence |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/config.ts` | API keys & URLs |
| `src/services/db.ts` | Database operations |
| `src/services/ai.ts` | Gemini AI service |
| `src/services/supabase.ts` | Supabase client |
| `src/stores/auth.ts` | Auth state (Zustand) |
| `src/data/vocab.ts` | Vocabulary state |
| `supabase/migrations/001_schema.sql` | DB schema |
