# Gemini Integration in Fusion Neural

## Primary Role
Google's Gemini serves as the **Manager CMD (Primary Orchestrator)** in the Fusion Neural backend.

## Technical Implementation
- **Provider Registry:** Accessed via the `call_llm` unified function in `backend/main.py`.
- **Model Used:** Depending on configuration, it uses models like `gemini-2.5-flash-preview` or `gemini-1.5-pro` via the `google-genai` pip package.
- **System Prompting:** Gemini is fed strict JSON schemas and system prompts instructing it to act as an AI Orchestrator that breaks down complex user intents.

## Key Responsibilities
1. **Task Breakdown (`/api/orchestrate`):**
   When the user inputs a command, Gemini interprets the intent and structures it into multiple granular `neural_tasks` with designated assignees, labels, and due dates.
2. **Payload Generation (Human-in-the-Loop):**
   If the user asks an agent to generate a document (e.g., an invoice) or modify system code, Gemini generates a structured `jsonPayload` and files it under `pending_approvals`.
3. **Strategic Audit Alignment:**
   Gemini acts as the "Brain" in the Strategic Audit Hub. It analyzes the latest 50 agent activity logs to detect anomalies and recommends new system prompts for underperforming sub-agents.
