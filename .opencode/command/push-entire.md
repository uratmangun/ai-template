---
description: Push to Entire.io; for GitHub mirrors use a trail and auto-merge it, then return to the default branch
---

You are a Git automation assistant. Stage, commit, and push the current work. When the remote is an Entire.io GitHub mirror, publish through an Entire trail and merge it automatically so the mirror syncs back to GitHub.

Execute these steps and provide a summary at the end.

## 1. Inspect and stage

1. Run `git status` to see what changed.
2. Run `git add .` to stage everything.
3. Run `git status --porcelain` for the clean list of staged files, then read the changed files to understand the change.
4. If nothing is staged, report "nothing to commit" and stop — do not create an empty commit or trail.

## 2. Generate the commit message

Use conventional commits with an emoji:

```
<type>(<scope>): <emoji> <description>
[optional body]
[optional footer(s)]
```

Types and emojis:

- feat: ✨ a new feature
- fix: 🔧 a bug fix
- docs: 📚 documentation only
- style: 💎 no semantic change
- refactor: ♻️ neither fix nor feature
- perf: ⚡ performance improvement
- test: ✅ add or correct tests
- build: 📦 build system or dependencies
- ci: ⚙️ CI config and scripts
- chore: 🔨 other, not src or tests
- revert: ⏪ revert a previous commit

Rules: lowercase type and description; description under 50 characters when possible; imperative mood; scope when relevant; emoji immediately after the colon; no trailing period; body separated by a blank line. For breaking changes add `!` after type/scope and a `BREAKING CHANGE:` footer.

Co-authors come **only** from `.co-author` in the repo root, even if a rule file mentions other attribution. Never add `Made-with: Cursor`.

- Missing, empty, or only blank/comment lines in `.co-author` → no co-author trailer.
- Otherwise use each remaining line once, trimmed, prefixing `Co-authored-by:` when absent.
- Put trailers after a blank line, consecutive, no blank line between them.
- Breaking-change footer comes before the co-author trailers.

Build the subject and trailers, then commit. Keep all trailers in a single `-m` so GitHub links them:

```bash
subject="<type>(<scope>): <emoji> <description>"
body="" # optional; leave empty when there is no body
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
if [ -n "$body" ] && [ -n "$trailers" ]; then
  git commit -m "$subject" -m "$body" -m "$trailers"
elif [ -n "$body" ]; then
  git commit -m "$subject" -m "$body"
elif [ -n "$trailers" ]; then
  git commit -m "$subject" -m "$trailers"
else
  git commit -m "$subject"
fi
```

## 3. Classify the remote

1. Determine the default branch: `default_branch=$(git symbolic-ref --short refs/remotes/origin/HEAD)`. If that fails, use `git remote show origin | awk '/HEAD branch/{print $NF}'`. Fall back to `main`.
2. Check the remote URL: `remote_url=$(git config --get remote.origin.url)`.
3. If `remote_url` does **not** contain `entire://`, just run `git push` and go to step 7.
4. If it is Entire, check whether this is a GitHub mirror. Run `entire repo view --json` and read the `repo` field:
   - starts with `/gh/` → GitHub mirror. Continue to step 4.
   - starts with `/et/` → native Entire repo. Run `git push` and go to step 7.
   - If the Entire CLI is missing, not logged in, or the lookup fails, report the uncertainty and fall back to `git push`.

## 4. Entire mirror flow — branch and push

1. Make a unique branch name from the subject, lowercased and kebab-cased, with a timestamp, for example `auto/add-login-20261119-093000`. Prefix with `auto/` to keep it distinct.
2. `git switch -c "$branch"` (the commit from step 2 comes along on this new branch).
3. `git push -u origin "$branch"`.

## 5. Create and auto-merge the trail

1. Create the trail, binding it to the pushed branch and targeting the default branch:

   ```bash
   entire trail create \
     --branch "$branch" \
     --base "$default_branch" \
     --title "$subject" \
     --body "${body:-$subject}"
   ```

2. Capture the trail number/ID from that output. If the output is JSON, read a `number`, `trailNumber`, or `id` field with `python3`; otherwise match `Trail #<n>`. If no selector can be found, find it with `entire trail list --project <project>` and match the branch via `entire trail show`.
3. Check that it can merge: `entire trail merge "$trail" --dry-run`.
4. If the dry run is clean, merge without asking the user:

   ```bash
   entire trail merge "$trail"
   ```

   Confirm the output contains `Merged change` and that the merge commit is reported. If the dry run reports a blocking gate or conflict, **do not** use `--force`; report the blocking gate and stop here.
5. Verify with `entire trail show "$trail"` that the change status is `merged`.

## 6. Return to the default branch

1. `git switch "$default_branch"`
2. `git pull`
3. Confirm `git status -sb` shows the branch in sync with `origin/<default_branch>`.

## 7. Report

Summarize:

- the commit hash and message
- which path was used (plain push, native Entire push, or Entire trail auto-merge)
- the trail number/URL and merge commit when a trail was used
- the final branch and whether local is in sync with the remote
- any gate that blocked the merge
