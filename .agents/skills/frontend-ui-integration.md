# Frontend UI Integration Skills

## Component Standards
When building new UI components for Fusion Neural, adhere to these strict integration patterns:

1. **Lucide React Icons:**
   - Always use `lucide-react` for icons. Do NOT use font-awesome or SVG strings.
   - Standardize icon sizes: `size={16}` for inline text, `size={22}` for headers.
2. **Framer Motion for Animations:**
   - Use `motion.div` for entry animations.
   - Standard entry: `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`
   - Hover effects: `whileHover={{ y: -4, scale: 1.015 }}`
3. **No Tailwind (Mostly):**
   - The user's directive explicitly stated to prioritize vanilla CSS and inline styles for dynamic glassmorphic capabilities unless specifically requested otherwise. 
   - Note: Some wrapper classes may use Tailwind utility classes (e.g., `flex`, `items-center`), but the core glassmorphism must use raw CSS or inline React styles for exact control.

## Handling Real-time Data (Firestore)
- Never use `getDocs()` for primary data rendering unless it's a one-off fetch.
- ALWAYS use `onSnapshot()` for live data feeds so the UI reacts instantly to backend AI mutations.
- Cleanup your listeners:
```typescript
useEffect(() => {
  const unsub = onSnapshot(query(...), (snap) => {
    // update state
  });
  return () => unsub(); // CRITICAL MEMORY LEAK PREVENTION
}, []);
```

## AI Orchestration Integration
- Triggering AI tasks should post to `/api/orchestrate`.
- The frontend should NOT generate the Kanban tasks directly; it should only send the raw `prompt` to the Orchestrator, allowing the backend LLM to parse and write the resulting tasks into Firestore.
