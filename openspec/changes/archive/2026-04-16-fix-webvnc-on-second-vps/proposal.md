## Why

The current WebVNC setup on `<IP_PLACEHOLDER>` is broken because port `5900` is bound to an unrelated application rather than a real VNC/RFB server. This change defines a clean replacement with a proper host-based VNC stack and browser access so remote desktop access works reliably.

## What Changes

- Add a new capability for real VNC and WebVNC access on the second VPS.
- Replace the invalid port-`5900` application binding with an actual VNC server.
- Define a host-level browser-access path for VNC that does not depend on the broken app container.
- Define verification steps to confirm both raw VNC and browser-based noVNC connectivity.

## Capabilities

### New Capabilities
- `vps-webvnc-access`: Provide a real VNC server and browser-accessible noVNC endpoint on `<IP_PLACEHOLDER>` so remote desktop sessions can connect successfully.

### Modified Capabilities

## Impact

- Affected systems: host services on `<IP_PLACEHOLDER>`, port bindings for `5900` and `6080`, and any existing container currently occupying the VNC port.
- Affected artifacts: OpenSpec proposal, design, tasks, and a new spec for VPS WebVNC access.
- Dependencies: root SSH access to the VPS, Ubuntu package availability for VNC/noVNC components, and permission to stop or replace the container currently bound to port `5900`.
