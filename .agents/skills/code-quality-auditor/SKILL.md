---
name: 'Code Quality Auditor'
description: 'Checks git changes, git status, and git diff to analyze code quality and provide suggestions.'
---

# Code Quality Auditor Skill

This skill is designed to automatically audit modified code in git and suggest quality, style, and modularity improvements.

## When this skill is active

This skill triggers when analyzing code changes, checking code quality, or reviewing modified code before commits.

## Instructions for the Agent

When auditing code quality for current changes, follow this workflow:

1. **Check Git Status**:
   Identify which files have been modified or staged:

   ```bash
   git status
   ```

2. **Retrieve Git Diffs**:
   Get the exact diff of unstaged and staged changes:

   ```bash
   git diff
   git diff --staged
   ```

3. **Validate Code Standards**:
   Review the diff against the standards defined in [.agents/AGENTS.md](file:///d:/ACL-Internal-PROJ/AIOPS-NEW/.agents/AGENTS.md):
   - **Line Length**: Ensure no line of code exceeds 100 characters.
   - **Modularity & Splitting**: Verify if modified files are exceeding 250 lines. If so, recommend splitting.
   - **Function Length**: Check if any modified or new functions exceed 20-30 lines.
   - **Prettier & ESLint**: Ensure that formatting and linting rules are satisfied.

4. **Suggest Actionable Improvements**:
   For any code smells or style violations found in the diff, provide clear, actionable suggestions showing the file, lines, and a suggested code diff.