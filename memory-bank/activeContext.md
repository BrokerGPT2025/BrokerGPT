# activeContext.md

## Current Focus
- Implementing client onboarding via business name (web scraping + OCR)
- Finalizing carrier/coverage appetite mapping logic
- Improving quote comparison UX with visual indicators

## Recent Changes
- Revised database schema to normalize carrier/coverage relationships
- Styleguide updated with accessible, responsive Tailwind defaults
- Introduced `client_documents` table with tagging system

## Decisions in Progress
- Whether to support PDF parsing client-side or server-side
- How to trigger renewals reminders (cron vs event-based)

## Active Patterns & Learnings
- Using Supabase for real-time database sync and row-level security
- Semantic CSS variables simplify dark/light theming
- Modular AI prompting via GPT/LLM abstractions speeds feature dev
