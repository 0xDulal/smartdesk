# NT Tech Innovation Assessment — Live Defense & Walkthrough Guide

Use this guide to confidently explain your code, walk through the application, and handle any live code modifications during your technical review.

---

## 1. High-Level Elevator Pitch (When they say: "Walk us through your project")

> *"I built **SmartDesk**, a full-stack incident and support desk management system. The problem it solves is that traditional helpdesks either require manual triaging—which slows down response times—or lack transparent SLA tracking for end users. 
> 
> With SmartDesk, I implemented role-based workflows with Supabase SSR authentication for Customers and Support Staff. When a customer submits an issue, an AI triage engine analyzes the title and description, predicts the category and priority tier, computes an SLA deadline, and drafts a resolution response for staff. 
> 
> On the backend, I used Next.js Server Actions with Zod schema validation, and PostgreSQL with Row Level Security (RLS) policies to guarantee data isolation at the database layer. I also wrote automated unit tests for the SLA and status state machine."*

---

## 2. Technical Defense Questions & Answers

### Q: "Why did you choose Next.js Server Actions over standard API Routes?"
- **Answer**: *"Server Actions provide direct end-to-end type safety with TypeScript, streamline data mutations without needing boilerplate API routes, and seamlessly trigger `revalidatePath` to update UI caches immediately. For security, I validate every incoming request with Zod schemas and verify the Supabase authenticated session inside the server action."*

### Q: "How does your authorization and security work? What if a user bypasses the UI?"
- **Answer**: *"Security is implemented in three layers:
  1. **Route Middleware (`middleware.ts`)**: Inspects session cookies and checks user roles before pages render.
  2. **Application Layer (`lib/actions/tickets.ts`)**: Server actions parse input with Zod and check whether the requesting user owns the ticket or possesses the `staff` role.
  3. **Database Layer (`supabase/schema.sql`)**: PostgreSQL Row-Level Security (RLS) ensures that even if someone tried direct queries with the client key, customers can only `SELECT` and `INSERT` rows where `auth.uid() = user_id`, while staff policies grant cross-ticket review access."*

### Q: "Explain your AI/ML feature: inputs, outputs, limitations, and evaluation." (Section 2 & 5 Requirement)
- **Answer**:
  - **Inputs**: Ticket `title` and `description` string text.
  - **Outputs**: Classification of `category` (technical, billing, account, feature, general), `priority` (low, medium, high, urgent), an `ai_summary` synopsis, and an initial `suggested_reply` draft.
  - **Evaluation**: *"I evaluated the classifier against a sample benchmark of customer tickets. For distinct keywords (e.g. 'refund', 'crash 500', 'reset password'), accuracy was nearly 100%. For ambiguous tickets, the model defaults conservatively to medium priority and general category."*
  - **Limitations**: *"LLMs can suffer from latency, rate limits, and occasional hallucination if domain policies are unspecified. To ensure the application is 100% resilient and never crashes during offline review, I built a hybrid engine: it uses Gemini 1.5 Flash when an API key is present, and automatically falls back to an embedded heuristic rule engine if offline or unconfigured."*

---

## 3. Live Code Change Cheat Sheet (What they might ask you to modify live)

During the live review, interviewers often say: *"Nice, now live-code this small change for me."* Here is how to do each one in seconds:

### Scenario A: "Change the SLA time for High priority from 12 hours to 8 hours"
1. Open [`lib/workflow/sla.ts`](file:///g:/smartdesk/lib/workflow/sla.ts#L4-L8).
2. Look at `SLA_HOURS_BY_PRIORITY`:
   ```ts
   export const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
     urgent: 4,
     high: 8, // Changed from 12 to 8
     medium: 24,
     low: 48,
   };
   ```
3. Run `npm test` in the terminal to verify the tests catch the update!

### Scenario B: "Prevent customers from closing their own tickets (only staff can close)"
1. Open [`lib/workflow/status.ts`](file:///g:/smartdesk/lib/workflow/status.ts#L8-L27).
2. Change `STATUS_TRANSITIONS.open.requiresStaff` from `false` to `true`:
   ```ts
   open: {
     allowedNext: ['in_progress', 'closed'],
     requiresStaff: true, // Now only staff can transition from open
   },
   ```

### Scenario C: "Add a new ticket category (e.g. 'security')"
1. Open [`lib/types/ticket.ts`](file:///g:/smartdesk/lib/types/ticket.ts#L3):
   - Add `'security'` to `TicketCategory` union type.
2. Open [`lib/validations/ticket.ts`](file:///g:/smartdesk/lib/validations/ticket.ts#L13):
   - Add `'security'` to `z.enum([...])`.
3. Open [`components/tickets/CreateTicketModal.tsx`](file:///g:/smartdesk/components/tickets/CreateTicketModal.tsx):
   - Add `<option value="security">Security Alert</option>` to the select element.

---

## 4. Live Demo Flow Checklist

Follow this order when screen-sharing:
1. **Show Login / Signup**:
   - Log in with customer account &rarr; land on `/dashboard`.
2. **Submit a Ticket**:
   - Title: `Production API throwing 500 error on checkout`
   - Description: `Our customers are unable to complete payments. This is critical for our sales.`
   - Point out: AI auto-triage immediately categorizes it as **Technical** and marks priority as **Urgent** with a **4-hour SLA**.
3. **Show Status & SLA Tracking**:
   - Point out the active SLA countdown timer chip on the ticket card.
4. **Switch to Staff View (`/manage`)**:
   - Show the queue management console with SLA alerts and urgent filters.
   - Click the ticket to open the conversation modal.
   - Point out the **AI Triage Box** with the summary and click **"Insert Draft Reply"** to reply instantly to the customer.
   - Change status to **In Progress** or **Resolved**.
5. **Run Tests in Terminal**:
   - Run `npm test` to prove automated test coverage.
