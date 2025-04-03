# techContext.md

## Technologies & Frameworks
- **Frontend**: React + Vite (SPA)
- **Backend**: Node.js (REST API)
- **Database**: Supabase (Postgres)
- **Authentication**: Supabase Auth (JWT-based)
- **LLM Integration**: Google Gemini
- **CI/CD**: GitHub Actions
- **Version Control**: GitHub
- **Payment Integration**: Stripe

## Development Setup
- TypeScript used across both front and back ends
- Prettier for formatting, ESLint for linting
- Tailwind CSS with custom style guide
- Uses `.env` for secrets (never hardcode API keys)

## Constraints
- All code modules < 500 lines
- Must comply with PIPEDA + data privacy regulations
- Frontend must support screen readers, WCAG 2.1 AA
- LLM response latency under 2 seconds
- No direct handling of SSNs or credit cards

## Tooling & Configs
- Uses Cursor, Windsurf, RooCode for AI-driven coding
- AI must follow `PLANNING.md`, `STYLEGUIDE.md`, `TASK.md`
- Jest/Pytest test suites required per feature
