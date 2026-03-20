# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Project Overview

**rebel-archives-site** is a web project currently in its initial setup phase. The repository was renamed from "Practice" and contains minimal scaffolding at this stage.

- **Repo:** `smr13wpylf/rebel-archives-site`
- **Status:** Early development — no framework, build system, or source files have been added yet.

## Repository Structure

```
rebel-archives-site/
├── CLAUDE.md       # This file
└── README.md       # Project title only
```

As the project grows, this file should be updated to reflect the actual structure.

## Git Workflow

### Branch Naming

- Feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`
- Claude-generated branches: `claude/<task-description>-<session-id>`

### Commit Style

Write clear, imperative commit messages:
```
Add user authentication flow
Fix broken archive search query
Update README with setup instructions
```

### Pushing Changes

Always push with upstream tracking:
```bash
git push -u origin <branch-name>
```

Never push directly to `main` or `master`. Open a pull request instead.

## Development Setup

No build system has been configured yet. When one is added, document the following here:

- **Install dependencies:** (e.g., `npm install`)
- **Run dev server:** (e.g., `npm run dev`)
- **Run tests:** (e.g., `npm test`)
- **Build for production:** (e.g., `npm run build`)

## Conventions to Follow

Since no framework has been chosen yet, these are the defaults to apply when the project is initialized:

### Code Style

- Prefer explicit, readable code over clever one-liners.
- Use consistent naming: `camelCase` for variables/functions, `PascalCase` for components/classes, `kebab-case` for file names.
- Avoid unnecessary abstractions — only abstract when a pattern appears 3+ times.

### File Organization

- Group files by feature/domain, not by type (e.g., `src/archives/` not `src/components/` + `src/hooks/`).
- Co-locate tests with source files (e.g., `foo.ts` and `foo.test.ts` in the same directory).

### Dependencies

- Prefer standard library / built-in solutions before reaching for a package.
- Pin major dependency versions and document why each non-obvious dependency was added.

## AI Assistant Guidelines

When working in this repository:

1. **Read before editing.** Always read a file before modifying it.
2. **Keep changes minimal.** Only change what is necessary for the task. Do not refactor surrounding code unless asked.
3. **Update this file.** If you add a build system, framework, or significant new convention, update `CLAUDE.md` to reflect it.
4. **No secrets in code.** Never commit API keys, tokens, or passwords. Use environment variables and add sensitive files to `.gitignore`.
5. **Test your changes.** If a test suite exists, run it before committing. If tests are broken, fix them or flag the issue explicitly.
6. **Ask when uncertain.** If the task is ambiguous or the right approach is unclear, ask rather than guess.

## Environment Variables

No environment variables are configured yet. When added, document them here with descriptions (but never their values):

```
# Example format:
# VAR_NAME=          # Description of what this controls
```

---

*Last updated: 2026-03-20*
