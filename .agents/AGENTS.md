# Agent Guidelines & Rules

This document outlines style guidelines, behavioral constraints, and instructions for AI agents working on this project.

## Code Splitting and Modularity

To ensure the codebase remains maintainable, readable, and easy to debug, please follow these rules:

### 1. File Size Limits and Splitting

- **Maximum File Length**: Keep files under **100-250 lines of code** (LOC).
- **Auto-splitting**: If an existing file is growing larger than 250 lines, or if you are creating a new component/utility that exceeds this limit, **you must split it** into smaller, logically separated files (e.g., extracting sub-components, helper functions, custom hooks, or utility files).

### 2. Line Length and Code Formatting

- **Line Length**: Keep the maximum line length of any code under **100 characters** to ensure readability without horizontal scrolling.
- **Formatting**: Always format code using Prettier (which is configured in this project via `npx lint-staged` and `.prettierrc`). Run `npx prettier --write <file>` after editing files.

### 3. Modularity and Function Size

- **Function Length**: Keep functions small and focused on a single task. Ideally, no function should exceed **20-30 lines**.

- **Single Responsibility Principle**: Extract logic, state management, API calls, and sub-components into separate files or custom hooks/utilities. Do not mix complex presentation logic with core business logic in the same component.

- **Component Decomposition**: Break down large React/Vue/HTML structures into smaller, reusable components rather than building massive nested trees.

## Commit Message Guidelines

When writing git commit messages, please use standard conventional prefixes to categorize the changes:

- **`feat`**: A new feature.
  - _Example_: `feat: add new feature`
- **`fix`**: A bug fix.
  - _Example_: `fix: resolve sidebar navigation issue`
- **`docs`** (or **`doc`**): Documentation updates.
  - _Example_: `docs: update setup guidelines`
- **`chore`** (or **`chor`**): Maintenance tasks, config changes, or dependency updates.
  - _Example_: `chore: configure lint-staged and prettier`

## Pre-commit Hooks (Husky)

Before committing code, make sure to satisfy the pre-commit hooks configured via Husky:

- **Automatic Checks**: The pre-commit hook runs `npx lint-staged` automatically on all staged files.
- **Verification**: This ensures all staged files are linted with ESLint and formatted with Prettier before the commit is completed. Any lint or format failure will reject the commit.
