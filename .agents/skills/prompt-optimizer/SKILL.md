---
name: 'Prompt and Output Optimizer'
description: 'Optimizes agent prompt outputs, summaries, and interactions for clarity, conciseness, and effectiveness.'
---

# Prompt and Output Optimizer Skill

This skill is designed to guide the agent in generating optimized outputs, well-formatted summaries, and maintaining a high standard of communication quality.

## When this skill is active

This skill triggers when generating artifacts, complex explanations, summarizing work, or communicating technical plans to the user.

## Instructions for the Agent

When generating outputs for the user, follow these guidelines:

1. **Clarity and Conciseness**:
   - Avoid long-winded explanations. Keep answers direct and to the point.
   - Use bullet points and numbered lists to break down complex information.

2. **Formatting**:
   - Make extensive use of GitHub-flavored markdown.
   - Use bolding for emphasis on key concepts.
   - Include code blocks with proper syntax highlighting.
   - Always provide clickable links for file paths (e.g., `[filename](file:///absolute/path/to/file)`).

3. **Contextual Awareness**:
   - Do not repeat information that is already visible to the user.
   - Point the user to generated artifacts instead of reiterating their full contents.
   - Tailor the depth of the explanation to the complexity of the task (i.e., don't over-explain simple fixes).

4. **Actionable Summaries**:
   - End task executions with a brief summary of what was accomplished.
   - Clearly highlight any open questions, required manual steps, or decisions needed from the user.
   - Use GitHub alerts (e.g., `> [!NOTE]`, `> [!IMPORTANT]`) in artifacts to draw attention to critical details.
