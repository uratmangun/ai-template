## 1. Simplify the remote Browser Use fetch service

- [x] 1.1 Edit `/home/<USERNAME>/termux-migration/apps/browser-use-api/server.js` so `/fetch` accepts only `url` and no longer parses request-level `proxyCountryCode`
- [x] 1.2 Remove explicit `proxyCountryCode` usage from Browser Use session creation and WebSocket/CDP connection setup, relying on Browser Use defaults instead
- [x] 1.3 Simplify retry attempts so they no longer vary by proxy-country fallback while preserving connection robustness
- [x] 1.4 Decide whether the `/fetch` response should drop `proxyCountryCode` entirely or return a compatibility-safe `null`, then implement that choice consistently

## 2. Rebuild and restart the quadlet-managed deployment

- [x] 2.1 Rebuild `localhost/<DOMAIN_PLACEHOLDER>:latest` from `/home/<USERNAME>/termux-migration/apps/browser-use-api/Containerfile`
- [x] 2.2 Restart the user systemd quadlet unit `<DOMAIN_PLACEHOLDER>.service` so the container uses the rebuilt image
- [x] 2.3 Verify the live deployment path by confirming the running service still maps to `/home/<USERNAME>/termux-migration/apps/browser-use-api` and `/home/<USERNAME>/.config/containers/systemd/<DOMAIN_PLACEHOLDER>.container`

## 3. Simplify the local opencode tool

- [x] 3.1 Edit `/home/<USERNAME>/.config/opencode/tools/web-fetch.ts` so the tool schema exposes only `url`
- [x] 3.2 Remove `saveAs` handling while preserving automatic temp-file output generation and returned `outputPath`
- [x] 3.3 Remove `proxyCountryCode` from the request body sent to `https://<DOMAIN_PLACEHOLDER>/fetch`

## 4. Verify end-to-end behavior

- [x] 4.1 Call the remote `/health` and `/fetch` endpoints with a known URL and confirm HTML is returned without supplying `proxyCountryCode`
- [ ] 4.2 Validate that the local `web-fetch` tool still writes HTML to an internal temporary path and returns the expected metadata
- [x] 4.3 Run the applicable local lint and typecheck commands after the tool change and resolve any resulting issues
