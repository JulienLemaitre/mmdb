---
apply: always
---

# General Code Review Guidelines

## Naming
- Use clear, descriptive names for variables, functions, and classes
- Avoid single-letter names except for loop indices
- Follow consistent naming conventions throughout the project

## Style
- Include comments for complex logic or important decisions
- Include JSDoc description for key feature functions, explaining their role and utility.

## Structure
- Keep functions short and focused on a single responsibility
- Avoid deep nesting and long parameter lists
- Group related code logically

## Best Practices
- Avoid duplicate code
- Prefer composition over inheritance
- Handle errors and edge cases gracefully

## Documentation
- Write doc comments for public functions and modules
- Keep documentation up to date with code changes

## Tools
- Follow project-specific tooling or linters
- Use version control best practices (e.g., atomic commits, meaningful messages)

## AI Collaboration Rules

- **Minimal Edits**: When suggesting code modifications, you MUST provide snippets of the changed code within the existing file context. You MUST NOT rewrite entire files unless specifically asked to do so. If you believe a full rewrite is necessary, you MUST ask for permission first.