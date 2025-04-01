# Insurance Professionals App - Planning Document

## Vision

We are building an LLM for insurance that will help manage complex tasks such as prospecting, building a client profile or finding the right carrier for a client. We solve the complex world of insurance and make it easy for agents to ask questions and get the right answers.

## User Personas

### Insurance Agent
- **Profile**: Professionally licensed insurance agent looking to shop and compare coverages
- **Needs**:
  - Efficient way to find the right coverage options for clients
  - Tools to manage client information and documents
  - Ability to compare different carriers and policies
  - Prospecting tools to find new clients
  - Quick access to insurance information through natural language queries

### Underwriter
- **Profile**: Insurance underwriter looking to sell products to agents
- **Needs**:
  - Platform to showcase products to insurance agents
  - Tools to communicate policy details and benefits
  - Ability to reach relevant agents based on client needs
  - Analytics on agent interactions with their products

## Feature Prioritization

| Feature | Value | Effort | Priority |
|---------|-------|--------|----------|
| Natural language query interface with OCR | High | Medium | 1 |
| Client profile management with web scraping | High | Medium | 2 |
| Carrier/underwriter matching | High | High | 3 |
| Document management | Medium | Medium | 4 |
| Comparison tools | Medium | Medium | 5 |
| Prospecting tools | Medium | High | 6 |
| Carrier rating system | Medium | Medium | Phase 2 |

## Architecture

### High-Level Component Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  Node.js API    │────▶│  Supabase DB    │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       │
         │               ┌───────▼───────┐
         │               │               │
         └──────────────▶│  Google       │
                         │  Gemini AI    │
                         │               │
                         └───────────────┘
```

### Technical Details

#### Frontend (React + Vite)
- Single page application with responsive design
- Component-based architecture for reusability
- State management using React hooks and context
- Authentication flow integrated with Supabase Auth
- Document upload interface with preview functionality
- OCR processing interface for document analysis

#### Backend (Node.js)
- RESTful API endpoints for data operations
- Middleware for authentication and request validation
- Integration with Google Gemini AI for natural language processing
- OCR processing service for document text extraction
- Web scraping service for company information gathering
- Secure handling of API keys and sensitive data

#### Database (Supabase)
- Relational data model for client profiles, carriers, and documents
- Storage for web-scraped company information
- Storage for OCR-processed document data
- Row-level security for data access control
- Real-time subscriptions for collaborative features
- Encrypted storage for sensitive information

#### Authentication & Security
- JWT-based authentication
- Email verification during signup
- Secure password handling
- Environment variable management for API keys

## Constraints

1. **Data Privacy**: Ensure compliance with PIPEDA and other insurance data regulations.
2. **Latency**: Optimize for fast response times (< 2s) for AI-generated insights.
3. **Modularity**: Codebase must support plug-and-play AI components (e.g., model swaps).
4. **Security**: Use secure auth (JWT, OAuth) and encrypted storage for sensitive data.
5. **Scalability**: App should be deployable for small teams but scalable to enterprise use.

## Tech Stack

- **Frontend**: React with Vite for build tooling
- **Backend**: Node.js
- **Database**: Supabase
- **Hosting**: Render.com
- **AI Integration**: Google Gemini AI
- **Version Control**: GitHub
- **Payment Processing**: Stripe for subscription SAAS

## Development Methodology

The project will follow the Scrum methodology:

- **Sprint Length**: 2 weeks
- **Ceremonies**:
  - Daily standups
  - Sprint planning
  - Sprint review
  - Sprint retrospective
- **Roles**:
  - Product Owner
  - Scrum Master
  - Development Team

## Testing Strategy

- **Unit Testing**:
  - Tests will be created in a tests/ directory
  - Mock calls to services like DB and LLM to avoid real interactions
  - For each function, test at least:
    - One successful scenario
    - One intentional failure (for error handling)
    - One edge case
  - The AI coding tool will write unit tests after implementing each feature

## Deployment Pipeline

- **Version Control**: GitHub repository
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Environments**:
  - Development (local)
  - Staging (for testing)
  - Production (on Render.com)

## Security Protocols

- Never store credit cards, birthdates, or social security numbers in the database
- Mask and store sensitive information in .env files
- Implement email verification with code entry for user access
- Store API keys in .env files
- Use gitignore to exclude sensitive files from version control
- Utilize render.com environment variables for secure key storage in production
- Implement JWT for secure authentication
- Encrypt all sensitive data at rest and in transit

## Future Roadmap

### Phase 1 (Current)
- Natural language query interface with OCR capability
- Client profile management with web scraping integration
- Carrier/underwriter matching
- Document management
- Comparison tools
- Prospecting tools

### Phase 2
- Carrier rating system
- Advanced analytics
- Mobile application
- Integration with external insurance platforms
- Enhanced AI capabilities

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Data privacy breach | High | Low | Implement strict security protocols, regular audits |
| AI response inaccuracy | Medium | Medium | Continuous model training, human review process |
| Scalability issues | Medium | Low | Design with scalability in mind, regular performance testing |
| User adoption challenges | High | Medium | Intuitive UI/UX, comprehensive onboarding, training materials |
| Regulatory changes | Medium | Medium | Regular compliance reviews, flexible architecture |

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios meeting accessibility standards
- Alternative text for all images
- Responsive design for various devices and screen sizes

## Performance Benchmarks

- Page Load Time: Initial page load under 1.5 seconds
- API Response Time: Backend API responses under 500ms
- LLM Query Response: AI responses to complex insurance queries under 2 seconds
- Database Query Performance: Database queries optimized to execute in under 100ms
- Concurrent Users: System should handle at least 100 concurrent users without performance degradation
- Mobile Performance: Equivalent performance metrics on mobile devices (within 20% of desktop)
- Resource Utilization: CPU/memory usage within acceptable limits during peak operations
