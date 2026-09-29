# Project Guidelines

## Project
- Single-page to-do app with tasks, notes, tags, and filters.
- Stack: React, Vite, Tailwind CSS, and browser `localStorage`.
- Keep dependencies minimal; avoid UI libraries unless requested.

## Implementation
- Use functional React components and hooks.
- Keep state local; share or hoist it only when needed.
- Prefer Tailwind utilities; keep global CSS limited to app-wide styles and Tailwind setup.
- Use PascalCase for components, camelCase for functions and variables, and UPPER_SNAKE_CASE for shared constants.
- Prefer simple, direct solutions over unnecessary abstraction or overengineering.
- Preserve existing behavior and follow established patterns when changing the app.

## Reliability and accessibility
- Reject task titles that are empty or whitespace-only.
- Do not mutate state arrays or objects; use immutable updates.
- Handle `localStorage` access and JSON parsing errors. If saved data cannot be read, do not overwrite it with empty data.
- Give interactive controls accessible names and visible keyboard focus styles.
- Keep the layout usable on narrow screens.

## Validation
- Run the smallest relevant check for a change.
- Do not run `npm run build` unless explicitly requested or needed to validate the change.
