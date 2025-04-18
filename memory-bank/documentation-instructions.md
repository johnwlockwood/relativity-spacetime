# Documentation Instructions

## Purpose
This file outlines the documentation process that should be followed at the end of each completed task. Maintaining this documentation helps track work history, preserve knowledge, and provide reference for future tasks.

## Documentation Process

At the end of each task, create or update the following:

1. **Task Summary File**
   - Create a new file in the `memory-bank` directory named `task-summary-[task-name].md`
   - Include the following sections:
     - Task Description
     - Steps Completed (with commands used)
     - Result
     - Key Technical Decisions
     - Any challenges encountered and how they were resolved

2. **Command History**
   - Document general, reusable commands that would be useful for future tasks
   - Focus on project-specific commands, build tools, and development workflows
   - Include explanations of what each command does and important flags or options
   - Avoid recording:
     - Specific git commands (like branch names or commit messages)
     - Information retrieval commands (like `git status` or `ls directory`)
     - Commands that are already well-documented elsewhere
   - Group commands by purpose rather than by task
   - Only add new commands that aren't already in the history

3. **Update Task History**
   - Add a new entry to the `task-history.md` file with:
     - The current date
     - A short task name
     - The git branch name where the task was implemented
     - A link to the task summary file
     - A brief description of the task
   - Keep entries in reverse chronological order (newest at the top)

4. **Update Task List** (if applicable)
   - If maintaining a task list, mark the completed task
   - Add any new tasks that were identified during the current task

## Benefits

- **Knowledge Preservation**: Captures the reasoning behind decisions
- **Reproducibility**: Allows steps to be reproduced if needed
- **Onboarding**: Helps new team members understand the project history
- **Troubleshooting**: Provides context for debugging issues
- **Efficiency**: Prevents repeating research for similar tasks

## Format Guidelines

- Use Markdown for all documentation
- Include code blocks with syntax highlighting
- Organize information with clear headings
- Be concise but thorough
