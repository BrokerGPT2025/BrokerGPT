# activeContext.md

## Current Focus
- Implementing client onboarding via business name (web scraping + OCR)
- Finalizing carrier/coverage appetite mapping logic
- Improving quote comparison UX with visual indicators

## Recent Changes
- Revised database schema to normalize carrier/coverage relationships
- Styleguide updated with accessible, responsive Tailwind defaults
- Introduced `client_documents` table with tagging system
- Cleaned up project root directory (removed PLANNING.md, CONTRIBUTING.md, TASK.md, etc.).
- Introduced Memory Bank system for documentation.
- Fixed lint errors in `web/src/App.tsx` and `web/src/components/Sidebar.tsx`.
- Restarted local development servers.
- Committed and pushed recent changes to GitHub.
- Configured `/styleguide` route (dev only) to display `Stylesheet/style.html` via iframe in `StyleGuidePage.tsx` for live preview.
- Started backend (`cd server && node index.js`) and frontend (`cd web && npm run dev`) servers. Subsequently opened the frontend application in the browser (`open http://localhost:5173/`). This sequence is triggered by the "start servers" command.
- Restructured chat interface JSX in `App.tsx` (introducing `gpt`, `feed`, `prompt-wrapper` divs) and updated related CSS in `App.css` based on image specifications (position, width, height), removing previous dynamic styles.
- Added responsive CSS for tablet breakpoints (<=998px) to set feed element's top position to 5rem and width to 85% for better mobile layout.
- Fixed chat bubble display issues by adding box-sizing: border-box to message elements and changing overflow from hidden to visible for chat-container and feed elements.
- Committed and pushed recent changes with message "Ask open manus to create profile. Did not work, shifting strategy to Langchain".
- Committed pending changes within the nested `OpenManus` repository ("Save OpenManus state before Langchain integration").
- Committed update to `OpenManus` reference in the main `brokerGPT` repository ("Update OpenManus reference to latest commit").
- Pushed all commits from the main `brokerGPT` repository.

## Decisions in Progress
- Whether to support PDF parsing client-side or server-side
- How to trigger renewals reminders (cron vs event-based)

## Active Patterns & Learnings
- Using Supabase for real-time database sync and row-level security
- Semantic CSS variables simplify dark/light theming
- Modular AI prompting via GPT/LLM abstractions speeds feature dev
- Memory Bank system adopted for persistent context.
- Confirmed ESLint and TypeScript configurations are active and enforced.
