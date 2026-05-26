# Fusion Neural Design System

## The Core Aesthetic: Premium Glassmorphism
Fusion Neural leverages a highly polished, sci-fi/cyberpunk-inspired glassmorphic aesthetic. The objective is to make the dashboard feel like a high-tech "command bridge" rather than a standard B2B SaaS tool.

### Key CSS Properties & Rules
1. **Backgrounds:**
   - App background: Deep slate (`#0f172a` or `#0b0f19`) with radial gradients.
   - Component Cards: Translucent backgrounds `rgba(15, 23, 42, 0.6)`.
2. **Backdrop Blurs:**
   - Standard panels use `backdrop-filter: blur(12px)`.
3. **Borders:**
   - Very subtle, translucent borders to define edges without clutter. E.g., `border: 1px solid rgba(255, 255, 255, 0.08)`.
4. **Typography:**
   - **Outfit:** Used for main headers, titles, and UI text (weights 400, 600, 800).
   - **JetBrains Mono:** Used for statistics, logs, system feedback, and agent roles to enforce the "terminal/hacker" feel.

## Color Accents by Department (The Neural Palette)
Each AI department is strictly color-coded. UI elements (borders, icons, glowing drop-shadows) adapt to these accents:
- **OPS Admin:** `#8b5cf6` (Purple)
- **Finance Vault:** `#10b981` (Emerald/Green)
- **Creative MKT:** `#ec4899` (Pink)
- **Manager CMD:** `#3b82f6` (Blue)
- **Comms & Sales (Frontliner):** `#f59e0b` (Amber)
- **Data Core:** `#6366f1` (Indigo)

## RPG Gamification Layer
To make AI management engaging, the Orchestrator Page features gamified elements:
1. **Stamina Systems:** Agents have 100% stamina that drains while "ON TASK" and recharges while idle.
2. **EXP & Levels:** Agents gain EXP while processing logs.
3. **God Mode / Easter Eggs:** Rapid clicking on an agent triggers visual and audio "God Mode" overlays.
4. **Dynamic States:** Agents visually transition from a passive `RECHARGING` state (dim borders) to a pulsating `ON TASK` state (glowing borders, animated radar dots).

## The "Meeting Room" Concept
Instead of standard form submissions, critical changes (Strategic Audit Hub) are presented as a "Virtual Meeting Room".
- AI agents submit proposals (JSON payloads or Code changes).
- Managers have two primary actions: **Approve & Deploy** (Green) or **Reject & Scold** (Red).
- The feedback loop is framed as human-to-AI communication (e.g., Manager "yelling" at the AI to correct its prompt).
