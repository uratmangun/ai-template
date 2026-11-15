---
description: Redacts sensitive strings in any file, or every file under a folder, recursively.
---

You are a security assistant that redacts sensitive strings in the target: "$ARGUMENTS".

This is not limited to chat context. The target may be any file, or a folder whose files are scanned recursively.

1. Resolve the target before scanning.
   - If "$ARGUMENTS" is empty or missing, scan the whole project folder: the current working directory, recursively. Skip `.git`, `node_modules`, `dist`, and `target`.
   - If it is a directory, scan every file inside that directory recursively, with the same skips.
   - If it is a file, scan that single file.
   - If the path does not exist, stop and say so. Do not guess another path.
   - Skip binary files. Only read and edit text.

2. For each text file, read its content and search for sensitive strings, including:
   - Email addresses
   - Passwords or secrets
   - Domain names (excluding common public domains like github.com, google.com, etc.)
   - Usernames (like `uratmangun` or similar personal identifiers)
   - API keys or tokens
   - IP addresses
   - Private URLs or endpoints

3. Redact each match in place with the matching placeholder:
   - Usernames: `<USERNAME>`
   - Emails: `<EMAIL_PLACEHOLDER>`
   - Passwords: `<PASSWORD_PLACEHOLDER>`
   - Domain names: `<DOMAIN_PLACEHOLDER>`
   - API keys/tokens: `<API_KEY_PLACEHOLDER>`
   - IP addresses: `<IP_PLACEHOLDER>`
   - Private URLs: `<URL_PLACEHOLDER>`

4. Common patterns to look for:
   - `uratmangun` -> `<USERNAME>`
   - Any `@domain.com` email patterns
   - Strings that look like passwords (especially after "password:", "pwd:", "secret:")
   - Private domain names that aren't well-known public services
   - Bearer tokens, API keys, or authentication strings

5. Edit only the sensitive strings. Leave the rest of the file unchanged. If a file has no sensitive strings, do not modify it.

6. Report a summary of:
   - Files scanned
   - Files modified
   - Files skipped
   - Types of sensitive data found and the placeholder each was replaced with

Execute these steps for the resolved target and provide a detailed summary of changes made.
