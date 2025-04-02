# CONTRIBUTING.md

## Global Rules (For AI IDEs)

Global (or project level) rules are the best way to enforce the use of the golden rules for your AI coding assistants. Global rules apply to all projects. Project rules apply to your current workspace. All AI IDEs support both.

### AI IDE Reference Links
- [Cursor Rules](https://docs.cursor.com/context/rules-for-ai)
- [Windsurf Rules](https://docs.codeium.com/windsurf/memories#windsurfrules)
- [Cline Rules](https://docs.cline.bot/improving-your-prompting-skills/prompting)
- Roo Code Rules: Works the same way as Cline

---

## 🔄 Project Awareness & Context
- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.

## 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.**
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports** (prefer relative imports within packages).

## 🧪 Testing & Reliability
- **Always create Pytest unit tests for new features**.
- **After updating any logic**, check whether existing unit tests need to be updated.
- **Tests should live in a `/tests` folder**, with:
  - 1 success test
  - 1 edge case
  - 1 failure case

## ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- **Add sub-tasks or TODOs discovered during development** to “Discovered During Work” in `TASK.md`.

## 📎 Style & Conventions
- **Languages & Frameworks**: Use **TypeScript** for both frontend (React with Vite) and backend (Node.js).
- **Formatting & Linting**: Follow standard TypeScript/React conventions. Use **Prettier** for code formatting and **ESLint** for linting (refer to `eslint.config.js`).
- **Styling**:
    - Use standard CSS or CSS Modules (as seen in `App.css`).
    - **Employ CSS Variables** for theming and consistency. Define variables in `:root` or theme-specific selectors (e.g., `[data-theme="dark"]`).
    - **Theming Strategy**:
        - Define base color swatches (e.g., `--swatch-brand: #80009b;`, `--swatch-dark: #353233;`).
        - Define semantic theme variables (e.g., `--theme-background`, `--theme-text`, `--theme-primary-button-bg`).
        - Implement light/dark modes using `data-theme` attributes on a root element. Define rules for `[data-theme="light"]` and `[data-theme="dark"]` that map semantic variables to the appropriate swatches.
        - Apply *semantic* variables (e.g., `background-color: var(--theme-background);`) in component styles.
    - **SVG Styling**: Utilize `currentColor` within SVG files where appropriate. The SVG will inherit the `color` value from its parent HTML element. Ensure the parent element's `color` property is set using a semantic theme variable (e.g., `color: var(--theme-text);` or `color: var(--theme-icon-color);`).
- **API**: Develop RESTful APIs on the Node.js backend.
- **Database Interaction**: Use the Supabase client library (`@supabase/supabase-js`) for database operations.
- **Docstrings/Comments**: Use JSDoc-style comments for functions, classes, and complex logic.

## 📚 Documentation & Explainability
- **Update `README.md`** when features or dependencies change.
- **Comment non-obvious code**, and use `# Reason:` to explain complex logic.

## 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions.**
- **Never hallucinate libraries or functions**.
- **Always verify file paths and module names**.
- **Never delete or overwrite existing code** unless part of an assigned task.
- **Stopping Processes**: When asked to stop a running process (like a development server), do not instruct the user to use `Ctrl+C`. Instead, ask the user to find the Process ID (PID) and then use the `kill <PID>` command.

---

## 🧰 Configuring MCP (Model Context Protocol)
Links:
- [Cursor MCP](https://docs.cursor.com/context/model-context-protocol)
- [Windsurf MCP](https://docs.codeium.com/windsurf/mcp)
- [Cline MCP](https://docs.cline.bot/mcp-servers/mcp)
- [Roo Code MCP](https://docs.roocode.com/features/mcp/using-mcp-in-roo)

Use MCP to:
- Interact with file systems
- Search the web via Brave
- Use Git operations
- Query databases (e.g., Supabase)

## 💬 Starting a Project

First prompt matters most. Always:
- Give examples of what you want built
- Reference PLANNING.md and TASK.md
- Provide context, tools, and APIs to be used

## 🧩 Modular Prompting Process
- **Give one task at a time** unless trivial
- Focus on updating a single file per request
- Always update README.md, PLANNING.md, and TASK.md after changes

## ✅ Test After Every Feature
- Place tests in `tests/`
- Mock all external dependencies
- Write tests for success, edge, and failure cases
