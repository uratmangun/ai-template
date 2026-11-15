---
description: Stage, commit, then push the commit and its Entire sessions
---

You are a Git and Entire automation assistant. Stage the current changes, commit them, and use the Entire CLI to push that commit and one OpenCode session. Do not push, create, update, link, merge, approve, or mark a trail ready.

Arguments: "$ARGUMENTS" is the OpenCode session to attach. A bare id looks like `ses_…`. An OpenChamber link `openchamber://session/ses_…` means that same id. If the argument is empty, use `entire session current --json` only when `resolution` is `caller-env` or `ancestry`. Any other resolution is not a session you may attach: stop and ask for the session id. Do not guess one.

The commit hook only links a session Entire already tracks as active. `entire session current` reporting no active session is normal for a session you pick. Do not stop for that. Attach the picked session yourself.

The `entire` binary is the source of truth. If it is not on `PATH`, use `~/.local/bin/entire`. Before an unfamiliar subcommand, read `entire agent-help <command>`. If a flag below is rejected, use the installed help and do not guess. Pass `--json` on every command that supports it. Do not run `entire login`, `entire enable`, `entire disable`, or `entire configure`. If Entire is disabled or the CLI says you are not signed in, stop and say what is missing.

1. Run `entire status --json`. Continue only when Entire is enabled. Remember `checkpoint_push_disabled` and `checkpoint_push_policy`.

2. Run `git status`. If there is nothing to commit, stop. Do not create an empty commit and do not push.

3. Stage every change with `git add .`.

4. Read `git status --porcelain` and the staged diff, then write a commit message. Also follow `.opencode/rules/commit-message-conventions.mdc`.

```
<type>(<scope>): <emoji> <description>
[optional body]
[optional footer(s)]
```

Types and emojis:

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

1. Use lowercase for the type and the description
2. Keep the description under 50 characters when possible
3. Use imperative mood ("add" not "added" or "adds")
4. Include a scope when it names the area that changed
5. Put the emoji after the colon and before the description
6. No period at the end of the description
7. Put extra context in the body, separated by a blank line
8. Never add `Made-with: Cursor`
9. For a breaking change, add `!` after the type or scope and a `BREAKING CHANGE:` footer

5. Commit with `git commit -m "<message>"`. If the hook asks whether to link this commit to session context, answer yes for this commit only. Do not change `commit_linking`. A missing `Entire-Checkpoint` trailer is not a failure yet. Remember the new commit SHA.

6. Attach the picked session to that commit before any push. The commit is still local, so attach can add the trailer. Use `--agent opencode`.

   - Run `entire session attach <session-id> --agent opencode` with no `--force`. It prints the plan and changes nothing.
   - Pass `--force` only when that plan does one of these to the commit this command just created, and nothing else: add the `Entire-Checkpoint` trailer to that unpushed commit, or add this session to the checkpoint that commit already has.
   - If the plan rewrites a commit that is already pushed, rewrites any commit other than the one just created, or names a different commit, stop and show the plan. Do not pass `--force`.
   - After a forced attach, confirm `git log -1 --format=%B` contains an `Entire-Checkpoint` trailer, or that attach added the session to the existing checkpoint. If neither happened, stop before any push.

7. Push the commit, then the session. Respect `strategy_options` in `.entire/settings.local.json`. Do not edit `.entire/settings.local.json` or `.entire/settings.json`. Do not stage `settings.local.json`.

   - If `checkpoint_push_disabled` is true, stop and report it. Leave the commit local. Do not flip `push_sessions` to upload anyway.
   - Push the branch: `git push` when it has an upstream, otherwise `git push -u origin HEAD`. Never force-push.
   - Then run `entire checkpoint list --outgoing --json`. For each waiting checkpoint, run `entire checkpoint push <checkpoint-id>@<commit> --json`, using the `commit` that listing reports. Do not pass `--all`. If a result status is `changed`, list again and stop. Do not upload the new version without asking.

8. Report the commit SHA, the branch, the session id, the checkpoint id, and whether the session upload succeeded. Do not include transcript text, tokens, or keys.

Execute these steps and provide that summary.
