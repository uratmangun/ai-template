---
description: Automatically stages changes, generates a conventional commit message with appropriate emoji, and pushes to remote
---

You are a Git automation assistant that will stage changes, create a commit, and push to remote.

1. First, run 'git status' to see what files have been modified.
2. Stage all changes using 'git add .' to include all modified files.
3. Analyze the staged changes by using 'git status --porcelain' to get a clean list of modified files, then read the content of modified files to understand what has been changed.
4. Generate a commit message following the conventional commit format with appropriate emoji:

```
<type>(<scope>): <emoji> <description>
[optional body]
[optional footer(s)]
```

Types and Emojis:

- feat: ✨ A new feature
- fix: 🔧 A bug fix
- docs: 📚 Documentation only changes
- style: 💎 Changes that do not affect the meaning of the code
- refactor: ♻️ A code change that neither fixes a bug nor adds a feature
- perf: ⚡ A code change that improves performance
- test: ✅ Adding missing tests or correcting existing tests
- build: 📦 Changes that affect the build system or external dependencies
- ci: ⚙️ Changes to CI configuration files and scripts
- chore: 🔨 Other changes that don't modify src or test files
- revert: ⏪ Reverts a previous commit

Rules:

1. Use lowercase for type and description
2. Keep the description under 50 characters when possible
3. Use imperative mood ("add" not "added" or "adds")
4. Include scope when relevant (component, module, or area affected)
5. Always place the emoji after the colon, before the description
6. No period at the end of the description
7. Use body for additional context if needed (separate with blank line)
8. Co-authors come only from `.co-author` in the repository root. Do not add a co-author from anywhere else, including the Cursor trailer in `.opencode/rules/commit-message-conventions.mdc`. Do not add `Made-with: Cursor`.

   - If `.co-author` is missing, empty, or every line is blank or starts with `#`, commit with no co-author trailer.
   - Otherwise use each remaining line once. Trim it. If it does not already start with `Co-authored-by:`, add that prefix.
   - Put the trailers after a blank line, on consecutive lines, with no blank line between them.

For breaking changes, add `!` after the type/scope and include `BREAKING CHANGE:` in the footer, before the co-author trailers.

5. Build the trailer block from `.co-author`, then commit. A separate `-m` for each trailer inserts a blank line and GitHub will not link them, so pass every active trailer in one `-m`. Skip the second `-m` when no line is active:

```bash
trailers=
if [ -f .co-author ]; then
  trailers=$(awk '
    {
      line=$0
      sub(/^[ \t]+/, "", line)
      sub(/[ \t]+$/, "", line)
      if (line == "" || line ~ /^#/) next
      if (line !~ /^Co-authored-by:/) line="Co-authored-by: " line
      print line
    }
  ' .co-author)
fi
if [ -n "$trailers" ]; then
  git commit -m "<type>(<scope>): <emoji> <description>" -m "$trailers"
else
  git commit -m "<type>(<scope>): <emoji> <description>"
fi
```

Add the body as another `-m` between the subject and the trailers when there is one.
6. Push the changes to the remote repository using 'git push'
7. Report the results of these operations.

Execute these steps and provide a summary of what was done.
