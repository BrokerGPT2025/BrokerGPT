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
- Style with standard CSS and global variables
- Uses `.env` for secrets (never hardcode API keys)
- Development-only route `/styleguide` added to `App.tsx` using `StyleGuidePage.tsx` to display `Stylesheet/style.html` via iframe for live editing preview.

## Constraints
- All code modules < 500 lines
- Must comply with PIPEDA + data privacy regulations
- Frontend must support screen readers, WCAG 2.1 AA
- LLM response latency under 2 seconds
- No direct handling of SSNs or credit cards

## Tooling & Configs
- Uses Cursor, Windsurf, RooCode for AI-driven coding
- AI must follow all brokerGPT/memory-bank files
- Jest/Pytest test suites required per feature
- **BrowserGym**: Identified as a research framework, not suitable for production use in this project. Do not install or attempt to use.
