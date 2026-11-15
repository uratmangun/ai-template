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

5. Mask the session before the commit is created. The commit hook stores the session in a checkpoint, and a later push can upload it. Unmasked text must not be committed or pushed.

   - Run `entire session current --json`. Use that session only when `resolution` is `caller-env` or `ancestry`. Any other resolution is not this session: stop.
   - Read it with `entire session info <id> --json` and `entire session info <id> --transcript`.
   - Mask every prompt, reply, and tool text through the magpie-hostinger Magpie, using the Entire sessions rule in `~/.config/opencode/AGENTS.md`. Read the provider `baseURL` from `~/.config/opencode/opencode.json`. Derive the web address by changing its port label from `3425-` to `3430-` and removing the `/v1` suffix. `POST /api/masking/preview` with JSON `{"text":"..."}`. The model gateway key does not authorize it. Sign in with the Magpie web key cookie from that rule. Use `MAGPIE_WEB_KEY` when it is already set; otherwise load `~/.config/magpie/web.env`. If that file is missing or the key is empty, stop and ask for it. Never print the key, copy it into this repo, or put it in the commit.
   - Keep each response's `text` and discard the original. Split any body over 64 KiB.
   - Probe the route first. If it does not answer, the response is not JSON with a `text` field, or any part fails, commit nothing and push nothing. Say to start the magpie-hostinger Magpie. Do not push the unmasked session and do not use another redactor.
   - Write the masked text back to the transcript file named by `transcript_path` or `resolved_transcript_path` in the session JSON. If neither field is present, stop. Do not guess a path.

6. Commit with `git commit -m "<message>"`. If the hook asks whether to link this commit to session context, answer yes for this commit only. Do not change `commit_linking`. Confirm `git log -1 --format=%B` contains an `Entire-Checkpoint` trailer. If it does not, stop before any push and say the session was not linked.

7. Push the commit, then the session. `push_sessions: false` in `.entire/settings.local.json` makes `git push` and `entire checkpoint push` leave checkpoints on this machine. This command is an explicit upload of this session, so:

   - If that local value is false, or `checkpoint_push_disabled` is true because of it, set `strategy_options.push_sessions` to true in `.entire/settings.local.json` only for the upload. Do not stage or commit that file. Restore its exact previous bytes after the upload, including when a later step fails. If the file did not exist, remove only the key you added.
   - Do not change `.entire/settings.json`.
   - Push the branch: `git push` when it has an upstream, otherwise `git push -u origin HEAD`. Never force-push.
   - Then run `entire checkpoint list --outgoing --json`. For each waiting checkpoint, run `entire checkpoint push <checkpoint-id>@<commit> --json`, using the `commit` that listing reports. Do not pass `--all`. If a result status is `changed`, list again and stop. Do not upload the new version without asking.
   - If pushing is disabled for a reason other than `push_sessions`, stop and report it. Leave the commit local.

8. Push or update the trail. Do not merge, approve, or mark it ready.

   - Run `entire trail show --json` for the current branch. Trail commands need network and keyring access; if the sandbox blocks either, re-run `entire trail` unsandboxed. Do not run `entire login`.
   - If this branch already has a trail, the push updated it. Do not create another. Report the change URL that `entire trail show` prints.
   - If it has no trail and this branch is not the default branch (`origin/HEAD`), create one. Map `feat` to `--type feature`, `fix` to `--type bug`, and anything else to `--type task`. Title is "$ARGUMENTS" when it is non-empty, otherwise the commit description.

```bash
entire trail create --title "<title>" --type <feature|bug|task> --json
```

     `trail create` publishes the current branch and links it. Do not pass `--checkout`. If linking fails, retry with `entire trail link` as `entire agent-help trail link` describes. Do not create a second trail.
   - If this branch is the default branch, do not run `trail create`. That command derives a new branch from the title. Report that the commit and session were pushed and no trail was created.

9. Restore `.entire/settings.local.json` if step 7 changed it.

10. Report the commit SHA, the branch, the checkpoint id, whether the session upload succeeded, the trail URL, and that the session text was masked before it was committed. Do not include transcript text, tokens, or keys.

Execute these steps and provide that summary.
