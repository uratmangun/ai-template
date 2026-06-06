## Context

The deployed Browser Use fetch service is a small Hono server running inside the quadlet-managed Podman unit `<DOMAIN_PLACEHOLDER>.service`. Inspection of the live VPS showed that the service is generated from `/home/<USERNAME>/.config/containers/systemd/<DOMAIN_PLACEHOLDER>.container`, runs image `localhost/<DOMAIN_PLACEHOLDER>:latest`, and uses `/home/<USERNAME>/termux-migration/apps/browser-use-api/.env` from the host. The current remote `server.js` accepts a request-level `proxyCountryCode`, expands it into multiple fallback attempts (`requested`, omitted, `de`, `sg`), and reports the selected proxy back in the response. The local opencode tool at `/home/<USERNAME>/.config/opencode/tools/web-fetch.ts` mirrors that flexibility by exposing `proxyCountryCode` and `saveAs`, then forcing `proxyCountryCode || "us"` into the request body.

Browser Use documentation indicates that residential proxies are on by default and that US is the documented default if `proxyCountryCode` is omitted; setting `proxyCountryCode` to `null` disables the proxy explicitly. That means this stack can simplify around the documented default behavior instead of always sending `us` or exposing proxy-country selection in the local tool.

## Goals / Non-Goals

**Goals:**
- Simplify the remote `/fetch` contract so the normal caller input is just `url`.
- Remove request-level `proxyCountryCode` handling from the remote Hono service for the default fetch path.
- Remove `saveAs` and `proxyCountryCode` from the local opencode tool schema while keeping its existing temp-file behavior.
- Preserve successful HTML extraction behavior and the existing high-level response shape needed by the tool.
- Capture the correct quadlet rebuild/restart path for deploying the remote service.

**Non-Goals:**
- Changing the public base URL `https://<DOMAIN_PLACEHOLDER>`.
- Reworking unrelated containers in the shared `termux-stack.pod` pod.
- Adding a new persistence model for fetched HTML files.
- Disabling Browser Use proxies globally; the target behavior is to use the service default, not `null`.
- Replacing Playwright or Hono with different runtime components.

## Decisions

- Treat `url` as the only supported external input for normal fetch requests. This removes unnecessary caller choices and matches the actual usage pattern. Alternative considered: keep `proxyCountryCode` as an advanced optional parameter; rejected because the user wants a fixed default path and the local tool should stay minimal.
- Omit `proxyCountryCode` when creating Browser Use sessions and WebSocket/CDP connections for the standard path. Browser Use docs state proxies are on by default and US is the default country, so omission is the simplest expression of the desired behavior. Alternative considered: continue sending `us`; rejected because it encodes a choice that Browser Use already defaults and keeps extra surface area in both client and server.
- Simplify retry strategy so fallback attempts vary by connection mode rather than country override. The current code retries across `session` and `ws` and across country codes; after this change, retry logic should remain focused on connection robustness without inventing alternate proxy countries. Alternative considered: keep country-based fallbacks internally while hiding them from callers; rejected because it still contradicts the goal of relying on the documented default path.
- Keep automatic temporary-file output in the local tool rather than returning raw HTML only. The existing tool contract already writes HTML to a temp file and returns the path, which is useful for downstream tooling without exposing save-path configuration. Alternative considered: remove all file writing; rejected because it would be a behavioral change beyond the requested simplification.
- Deploy the remote service by editing `/home/<USERNAME>/termux-migration/apps/browser-use-api/server.js`, rebuilding image `localhost/<DOMAIN_PLACEHOLDER>:latest`, reloading user systemd generators if needed, and restarting `<DOMAIN_PLACEHOLDER>.service`. The live container has no bind mounts for app code, so source edits alone are insufficient without rebuilding the image.

## Risks / Trade-offs

- [Relying on omitted `proxyCountryCode` assumes Browser Use defaults remain stable] → Verify against current docs and validate the deployed `/fetch` endpoint after restart.
- [Removing country fallbacks may reduce resilience for region-specific network issues] → Retain connection-mode retries and only reintroduce explicit country selection if production failures show it is necessary.
- [The local tool still writes a temp file even though `saveAs` is removed] → Keep the returned `outputPath` visible so callers can still inspect the saved HTML.
- [The remote service runs inside a rebuilt image rather than a bind-mounted working tree] → Include explicit rebuild and quadlet restart steps in the migration plan to avoid editing the wrong location and expecting live updates.

## Migration Plan

1. Edit the remote source at `/home/<USERNAME>/termux-migration/apps/browser-use-api/server.js` to remove request-level `proxyCountryCode` parsing, omit proxy-country parameters from Browser Use session/WebSocket creation, and simplify attempt generation/output metadata accordingly.
2. Rebuild the image from `/home/<USERNAME>/termux-migration/apps/browser-use-api/Containerfile` with the existing local image name `localhost/<DOMAIN_PLACEHOLDER>:latest`.
3. Restart the quadlet-managed service with user systemd so the regenerated container uses the rebuilt image.
4. Validate `/health` and `/fetch` remotely with a known URL and confirm successful HTML retrieval without supplying `proxyCountryCode`.
5. Edit `/home/<USERNAME>/.config/opencode/tools/web-fetch.ts` to expose only `url`, omit `proxyCountryCode` from the POST body, and always use the internal temp-file path generation.
6. Run the applicable local lint/typecheck commands after the tool change, then validate tool behavior against the remote `/fetch` endpoint.
7. If rollout fails, restore the previous remote `server.js` version, rebuild the image again, restart the quadlet unit, and revert the local tool file.

## Open Questions

- Whether the `/fetch` response should continue returning `proxyCountryCode` as `null` for compatibility or remove that field entirely once callers no longer control it.
- Whether the remote service should keep both `session` and `ws` connection modes after simplification or standardize on one path if testing shows one is consistently more reliable.
