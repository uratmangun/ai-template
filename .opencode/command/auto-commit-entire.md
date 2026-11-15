---
description: Stage, commit, then push the commit, its Entire sessions, and a trail
---

You are a Git and Entire automation assistant. Stage the current changes, commit them, and use the Entire CLI to push that commit, the session behind it, and a trail.

Arguments: "$ARGUMENTS" — optional trail title. When empty, use the commit description.

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

5. Commit with `git commit -m "<message>"`. If the hook asks whether to link this commit to session context, answer yes for this commit only. Do not change `commit_linking`. Confirm `git log -1 --format=%B` contains an `Entire-Checkpoint` trailer. If it does not, stop before any push and say the session was not linked.

6. Push the commit, then the session. Respect `strategy_options` in `.entire/settings.local.json`. Do not edit `.entire/settings.local.json` or `.entire/settings.json`. Do not stage `settings.local.json`.

   - If `checkpoint_push_disabled` is true, stop and report it. Leave the commit local. Do not flip `push_sessions` to upload anyway.
   - Push the branch: `git push` when it has an upstream, otherwise `git push -u origin HEAD`. Never force-push.
   - Then run `entire checkpoint list --outgoing --json`. For each waiting checkpoint, run `entire checkpoint push <checkpoint-id>@<commit> --json`, using the `commit` that listing reports. Do not pass `--all`. If a result status is `changed`, list again and stop. Do not upload the new version without asking.

7. Push or update the trail. Do not merge, approve, or mark it ready.

   - Run `entire trail show --json` for the current branch. Trail commands need network and keyring access; if the sandbox blocks either, re-run `entire trail` unsandboxed. Do not run `entire login`.
   - If this branch already has a trail, the push updated it. Do not create another. Report the change URL that `entire trail show` prints.
   - If it has no trail and this branch is not the default branch (`origin/HEAD`), create one. Map `feat` to `--type feature`, `fix` to `--type bug`, and anything else to `--type task`. Title is "$ARGUMENTS" when it is non-empty, otherwise the commit description.

```bash
entire trail create --title "<title>" --type <feature|bug|task> --json
```

     `trail create` publishes the current branch and links it. Do not pass `--checkout`. If linking fails, retry with `entire trail link` as `entire agent-help trail link` describes. Do not create a second trail.
   - If this branch is the default branch, do not run `trail create`. That command derives a new branch from the title. Report that the commit and session were pushed and no trail was created.

8. Report the commit SHA, the branch, the checkpoint id, whether the session upload succeeded, and the trail URL. Do not include transcript text, tokens, or keys.

Execute these steps and provide that summary.
