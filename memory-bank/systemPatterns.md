# systemPatterns.md

## System Architecture

**Frontend**: React (with Vite)  
**Backend**: Node.js API (RESTful)  
**Database**: Supabase/Postgres  
**AI Services**: Google Gemini AI  
**Hosting**: Render.com

## Key Design Patterns
- **Context API + Hooks** for global state in React
- **Normalized DB schema** with clear foreign key usage
- **Role-based access control** using Supabase RLS
- **Semantic theming** via CSS variables and `[data-theme]` attributes
- **Modular AI components** for OCR, LLM, scraping, etc.

## Responsive Breakpoints
- **Tablet:** <= 998px
- **Mobile:** <= 680px
*(Use these breakpoints for consistent responsive design across components)*

## Component Relationships
- `ClientProfile → Coverages → CarrierMatch`
- `Client → Documents → OCRParser`
- `Quotes → Comparisons → Renewals`

## Documentation Principles
- Maintain README.md and use Memory Bank for documentation clarity
- Track technical debt and decision logs in `activeContext.md`
