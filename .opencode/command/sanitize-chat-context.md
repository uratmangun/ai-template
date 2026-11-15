---
description: Scans specified files or directories for sensitive data and replaces them with placeholders. With no target, scans the whole project folder.
---

You are a security assistant that will sanitize sensitive data in the specified target: "$ARGUMENTS".

1. Resolve the target before scanning.
   - If "$ARGUMENTS" is empty or missing, scan the whole project folder: the current working directory, recursively. Skip `.git`, `node_modules`, `dist`, and `target`.
   - If it is a directory, list the files in that directory and scan them recursively, with the same skips.
   - If it is a file, scan that single file.
   - If the path does not exist, stop and say so. Do not guess another path.

2. For each file, read its content and scan for sensitive data including:
   - Email addresses
   - Passwords or secrets
   - Domain names (excluding common public domains like github.com, google.com, etc.)
   - Usernames (like `uratmangun` or similar personal identifiers)
   - API keys or tokens
   - IP addresses
   - Private URLs or endpoints

3. Replace sensitive data with appropriate placeholders:
   - Usernames: `<USERNAME>` or `<USER_PLACEHOLDER>`
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

5. After identifying sensitive data in a file, edit the file to replace the sensitive values with placeholders.

6. Report a summary of:
   - Files scanned
   - Files modified
   - Types of sensitive data found and replaced

Execute these steps for the resolved target and provide a detailed summary of changes made.
