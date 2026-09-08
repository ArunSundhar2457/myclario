# Clario Visual Transformation — Lhana Character Design System

## Goal
Evolve the existing Clario application into a premium, character-driven finance product using the supplied Lhana concept as the visual north star, while preserving every existing route, data flow, currency/language feature, and financial action.

The selected direction is **Ethereal character focus**, translated through the locked choices:
- **Palette:** Luminous Lavender — `#F7F5FF`, `#DDD7FF`, `#8B7CF6`, `#162044`, with restrained mint, blush, and warm attention accents
- **Typography:** Urbanist for confident headings and financial figures; Epilogue for interface copy
- **Layout:** responsive bento command center
- **Conversation:** one read-only conversation with no persistence

## 1. Establish the visual system
- Replace the current emerald/peach design tokens with a complete semantic light and dark palette in the global stylesheet.
- Add dedicated semantic roles for luminous surfaces, Lhana accents, user chat messages, positive/attention states, dark navy panels, and soft lavender-tinted shadows.
- Load Urbanist and Epilogue through the document head and keep all feature code token-based.
- Refine shared cards and buttons with generous radii, soft borders, restrained elevation, tactile press states, and occasional glass treatment; avoid making every surface a gradient.
- Add real dark-theme tokens using deep navy/charcoal rather than pure black, plus a Settings preference for light, dark, or system appearance.
- Consolidate repeated panel, empty-state, metric, and status treatments into reusable presentation components without moving or changing data logic.

## 2. Create a consistent Lhana asset and component system
- Use the uploaded concept only as a visual reference, not as an embedded screenshot.
- Produce a controlled set of matching Lhana illustrations from the same identity: primary welcome pose, compact avatar, thoughtful/insight pose, supportive empty-state pose, and celebratory success pose.
- Keep fixed identity details across every asset: dark flowing hair, expressive eyes, mature friendly proportions, dark Clario clothing, subtle violet “C”, soft cinematic lighting, and restrained lavender backgrounds.
- Store the approved outputs through the project asset flow and expose them through reusable components:
  - `LhanaAvatar`
  - `LhanaLauncher`
  - `LhanaWelcome`
  - `LhanaMessage`
  - `LhanaInsightCard`
  - `LhanaMetricCard`
  - `LhanaPromptChip`
  - `LhanaEmptyState`
- Define size, crop, alt-text, and dark-surface variants so the character never changes randomly between screens.

## 3. Build Ask Lhana V1
- Add a dedicated authenticated `/lhana` page and an enabled navigation entry without renaming existing core navigation.
- Build the visible chat surface from AI Elements primitives for conversation scrolling, message parts/markdown, prompt input, loading shimmer, actions, and tool/result presentation.
- Use a single conversation for the current session only; add no thread list, history database, or browser persistence.
- Opening state:
  - “Hey, I’m Lhana.”
  - concise financial-agent introduction
  - suggested prompts for spending, affordability, monthly performance, and spending changes
- Keep the composer focused on entry, after send, after completion, and after returning to the chat.
- Show the user message immediately and a Lhana thinking state before streamed output arrives.
- Support text plus compact metric, comparison, budget, and transaction-explanation result cards inside assistant messages.
- Add a server-streamed, authenticated AI endpoint using the AI SDK and Lovable AI Gateway. Send the full in-session transcript on every turn.
- Give Lhana narrowly scoped **read-only** tools for monthly snapshot, spending/category comparison, budget health, and transaction explanation. She may analyze, calculate, explain, and recommend, but no tool may insert, update, delete, transfer, or create financial records.
- Surface gateway errors clearly, retry only rate limits/transient server failures with bounded backoff, and keep an explicit user cancel control for streaming.

## 4. Add the floating Lhana launcher
- Add one responsive launcher to the authenticated shell with the consistent avatar, a restrained lavender glow, and the label “Ask Lhana” on hover/focus or expanded mobile state.
- Use subtle idle movement only when motion is allowed; stop decorative motion for `prefers-reduced-motion`.
- Position it clear of the mobile bottom navigation, page-specific action buttons, sheets, and safe-area insets.
- Opening the launcher navigates to `/lhana`; it does not pretend to perform any financial action.

## 5. Recompose the Dashboard as a bento command center
- Preserve all current queries, month scoping, task editing, chart data, budget alerts, and currency formatting.
- Recompose the existing cards into intentional visual weights:
  - dominant **Money Pulse** containing the most important income, spent, and balance figures
  - wide monthly spending trend
  - medium budget health
  - compact recent/today activity
  - selective **Lhana noticed something** briefing
  - supporting category breakdown
- Keep financial numbers visually dominant and maintain accessible chart labels, legends, tooltips, and semantic gain/loss colors.
- Restyle existing loading, empty, alert, and success states with the shared system; use Lhana only in the briefing and genuinely helpful states.
- Collapse the bento grid into a deliberate single-column mobile reading order with stable card dimensions and no horizontal overflow.

## 6. Integrate Lhana into Insights
- Preserve the current on-demand generation, selected-month behavior, currency conversion, and insight content.
- Replace generic sparkle identity with Lhana’s avatar and voice.
- Present insights as an authored briefing from Lhana with progressive card reveals and clearer financial hierarchy.
- Add contextual “Why? Ask Lhana” actions that open `/lhana` with the relevant question/context prefilled, without modifying records.
- Use shared Lhana insight, metric, budget, loading, error, and empty-state components.

## 7. Polish navigation and remaining authenticated pages
- Refine desktop sidebar, mobile header, bottom navigation, active states, spacing, brand lockup, and month selector to match the new system.
- Apply the shared tokens, typography, cards, controls, empty states, and motion language to Transactions, Budgets, Planner, and Settings without restructuring their workflows.
- Keep high-value character appearances selective; remaining finance pages should primarily inherit the system rather than receive decorative Lhana illustrations.
- Ensure all existing English/German/Spanish keys continue to resolve; add translated strings for new Lhana navigation, prompts, theme controls, and states.

## 8. Accessibility, metadata, and verification
- Add unique route metadata for the new Ask Lhana page and complete any missing per-route social metadata while leaving existing route behavior intact.
- Verify contrast in light/dark themes, visible keyboard focus, semantic headings, descriptive image alt text, touch targets, reduced-motion behavior, and chart readability.
- Validate desktop and mobile layouts, including launcher/FAB/bottom-nav coexistence and no text or card overflow.
- Test Ask Lhana with real authenticated calls, including streaming, cancellation, read-only tool results, gateway failure messages, and no cross-session restoration.
- Run the project’s typecheck, lint, tests if present, and production build; resolve all introduced errors.

## Technical boundaries
- Keep TanStack Start routing and the current authenticated shell.
- Keep Supabase RLS and authenticated server boundaries; no chat-history table is needed for the selected no-persistence model.
- Do not alter the existing transaction, budget, planner, currency, language, or dashboard business rules.
- Do not use direct client-side model calls or expose credentials.
- Do not make Lhana a write-capable agent in V1.
- Do not embed the supplied concept board in the product or use generic icons as Lhana’s identity.

## Delivery order
1. Tokens, typography, theme behavior, and shared surfaces
2. Consistent Lhana asset set and reusable components
3. Ask Lhana route, streaming, read-only tools, and launcher
4. Dashboard bento composition
5. Insights integration
6. Navigation and remaining-page visual normalization
7. Responsive, accessibility, AI-call, lint, type, and build verification
