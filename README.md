# SmartDesk — AI-Powered Support & Incident Management Hub

SmartDesk is a modern, full-stack incident response and customer support platform built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and Supabase (PostgreSQL with Row-Level Security). It automates ticket triaging, calculates priority-based SLA deadlines, and enforces strict role-based workflow rules between customers and support staff.

---

## 1. Architecture Overview

- **Frontend**: Next.js 16 App Router with React 19, Tailwind CSS v4, Lucide icons, and responsive stateful modal interfaces.
- **Backend**: Next.js Server Actions with Zod runtime validation, session-bound Supabase SSR client, and role authorization.
- **Database**: PostgreSQL hosted on Supabase featuring custom ENUMs, foreign keys, cascade deletes, performance indexes, and Row-Level Security (RLS) policies.
- **AI / ML Engine**: Hybrid intelligence engine combining Gemini 1.5 Flash structured classification with an embedded heuristic fallback for automated categorization, SLA priority assignment, and staff draft generation.

---

## 2. Key Features

### Role-Based Portals & Authorization
- **Customer Portal (`/dashboard`)**: Submit new tickets, monitor resolution status, view real-time SLA countdowns, and reply to agent threads.
- **Staff Console (`/manage`)**: Triage global queues, filter by urgency/status, review AI synopsis and draft replies, and advance status transitions.
- **Route Protection**: Edge middleware (`middleware.ts`) and server actions ensure non-staff users cannot access staff consoles or modify tickets outside their ownership.

### Business Logic Workflows & SLA Calculation
1. **SLA Deadlines**: Automatically computed based on ticket urgency:
   - `urgent`: 4 Hours
   - `high`: 12 Hours
   - `medium`: 24 Hours
   - `low`: 48 Hours
2. **Status State Machine**:
   - `open` &rarr; `in_progress` &rarr; `resolved` &rarr; `closed`
   - Customers can create tickets, accept resolutions (closing), or cancel/reopen.
   - Support staff have exclusive authorization to move tickets into `in_progress` or mark them `resolved`.

### AI / ML Feature Details
- **Inputs**: Ticket subject (`title`) and detailed problem description (`description`).
- **Outputs**:
  - `category`: `technical`, `billing`, `account`, `feature`, or `general`
  - `priority`: `low`, `medium`, `high`, or `urgent`
  - `ai_summary`: 1-sentence synopsis for fast staff triage
  - `ai_confidence`: Confidence score (0.70 - 0.99)
  - `ai_suggested_reply`: Contextual canned response draft ready for staff insertion
- **Evaluation & Limitations**:
  - *Evaluation*: Evaluated on realistic customer inquiry benchmarks. Achieves high categorization accuracy on clear domain keywords and sentiment markers.
  - *Limitations*: Ambiguous descriptions with mixed topics can lower classification confidence. LLMs may occasionally hallucinate specifics without private domain grounding.
  - *Reliability*: If no external API key is configured or network fails, an embedded heuristic engine handles classification seamlessly with zero downtime.

---

## 3. Database Schema & RLS

Run the migration script in `supabase/schema.sql` inside the Supabase SQL Editor:

- **`tickets`**: Stores ticket metadata, user references, status, SLA due dates, and AI analysis.
- **`ticket_messages`**: Stores multi-turn threaded conversations between customers and staff.
- **Row Level Security**:
  - Customers can only read and insert their own records (`auth.uid() = user_id`).
  - Staff (`public.is_staff()`) have read and update access across all customer tickets.

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js 20+ (Node v24 recommended)
- A Supabase project

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd smartdesk
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
GEMINI_API_KEY=your-gemini-key # Optional: AI fallback works without it
```

### 3. Run Database Migration
Execute `supabase/schema.sql` in your Supabase SQL Editor.

### 4. Create Demo Users
1. Sign up a regular user via `/signup` (Default role: Customer &rarr; redirected to `/dashboard`).
2. Sign up a staff user and set their role to `staff` in Supabase Auth user metadata (`raw_user_meta_data: { "role": "staff" }`).

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Automated Tests

Run the test suite verifying SLA deadline calculations and status state machine transitions:

```bash
npm test
```
