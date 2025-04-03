# progress.md

## ✅ Completed
- Project scaffolding and architecture documentation
- Initial DB schema (clients, coverages, quotes, renewals)
- OCR + scraping infrastructure in place
- Style guide built and integrated with Tailwind
- Role-based Supabase security established
- Project file cleanup (removed old documentation files).
- Introduced and populated Memory Bank system.
- Performed code audit and fixed lint errors in frontend.
- Committed and pushed recent changes to GitHub.
- Integrated `Stylesheet/style.html` for live preview at `/styleguide` route (dev only).

## 🚧 In Progress
- Carrier appetite logic and coverage matchmaking
- Visual quote comparison interface
- Submission automation features
- Renewal reminders + email triggers

## 🐛 Known Issues
- Occasional OCR extraction mismatch
- Some web scraping requests timeout or return invalid data
- Supabase RLS edge cases need more testing

## 🔁 Evolution of Decisions
- Originally planned manual client entry → replaced with smart onboarding
- Considering GraphQL backend → settled on REST for MVP
- AI parsing initially client-side → moved server-side for performance

## 📈 Next Steps
- Build prospecting engine for lead gen 
- Add carrier appetite matching system   
- Build generic commercial application form filling for submissions
- Build SMTP server for sending submissions to carriers
- Build quote tracking and ticketing system
