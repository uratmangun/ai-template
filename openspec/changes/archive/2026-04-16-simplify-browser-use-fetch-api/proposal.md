## Why

The current Browser Use HTML fetch flow is more configurable than this setup needs: the deployed Hono `/fetch` API and the local opencode `web-fetch` tool both expose `proxyCountryCode`, and the tool also exposes `saveAs`, even though the intended workflow is just “give me a URL and return/save the HTML.” This change simplifies the interface, relies on Browser Use’s documented default proxy behavior instead of forcing `us`, and captures the real VPS deployment/restart path for the quadlet-managed service.

## What Changes

- Simplify the deployed Browser Use Hono `/fetch` endpoint so callers only provide `url`.
- Remove caller-controlled `proxyCountryCode` from the remote fetch API flow and rely on Browser Use defaults when establishing browser sessions.
- Remove `saveAs` and `proxyCountryCode` from the local opencode `web-fetch` tool interface while preserving automatic temporary-file output.
- Define the deployment touchpoints for the quadlet-managed `<DOMAIN_PLACEHOLDER>` service, including the remote app directory and systemd restart flow.
- Define verification for both the deployed `/fetch` endpoint and the local tool behavior after the simplification.

## Capabilities

### New Capabilities
- `browser-use-fetch-api`: Provide a Browser Use-backed `/fetch` endpoint that accepts a URL and returns HTML plus metadata without requiring or exposing caller-specified proxy-country selection.
- `opencode-web-fetch-tool`: Provide an opencode `web-fetch` tool interface that accepts only a URL and manages HTML output storage internally.

### Modified Capabilities

## Impact

- Affected systems: remote VPS app directory `/home/<USERNAME>/termux-migration/apps/browser-use-api`, quadlet source `/home/<USERNAME>/.config/containers/systemd/<DOMAIN_PLACEHOLDER>.container`, and user unit `<DOMAIN_PLACEHOLDER>.service`.
- Affected code: remote `server.js` for the Hono fetch service and local `/home/<USERNAME>/.config/opencode/tools/web-fetch.ts` for the opencode tool.
- External dependency behavior: Browser Use cloud browser/session APIs, especially documented default proxy behavior when `proxyCountryCode` is omitted and documented `null` behavior when proxies are intentionally disabled.
- Verification surface: remote `/fetch` HTTP responses, quadlet restart behavior, and local tool execution output.
