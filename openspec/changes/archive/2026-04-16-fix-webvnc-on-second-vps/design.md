## Context

The target VPS `<IP_PLACEHOLDER>` currently exposes `http://<host>:6080/vnc.html`, but the browser client fails because the backend target on port `5900` is not a VNC/RFB server. Investigation showed that port `5900` is occupied by an unrelated application container, so the existing WebVNC path cannot succeed without replacing that binding with a real desktop stack.

## Goals / Non-Goals

**Goals:**
- Provide a real VNC server on the VPS that speaks the VNC/RFB protocol on port `5900`.
- Provide browser-based access through noVNC/websockify on port `6080`.
- Use host-level services instead of the broken application container for the VNC path.
- Verify that both the VNC backend and the noVNC frontend are operational after deployment.

**Non-Goals:**
- Removing the existing non-VNC application if it can be preserved by rebinding it away from port `5900`.
- Building a full desktop environment beyond what is necessary for remote access.
- Adding public internet exposure or authentication hardening beyond the basic working setup.
- Reworking unrelated containers or application networking on the VPS.

## Decisions

- Replace the fake VNC binding with a host-based stack using `Xvfb` for a virtual display, a lightweight window manager such as `openbox`, `x11vnc` for VNC protocol serving, and `novnc/websockify` for browser access. This avoids depending on container internals and makes the VNC path explicit.
- Bind the real VNC service to port `5900` and the noVNC frontend to port `6080` to preserve the user-facing ports already being attempted.
- Manage the stack with systemd units or equivalent supervised background services so it survives reboot and can be inspected cleanly.
- Validate the backend directly by checking the VNC/RFB banner on port `5900`, then validate browser access through `vnc.html` to confirm end-to-end functionality.

## Risks / Trade-offs

- [Rebinding the existing port-5900 container may affect its consumers] → Move it to port `5901` deliberately and verify its new binding before enabling host VNC on `5900`.
- [A minimal desktop may not match user expectations] → Start with a lightweight desktop sufficient for connectivity; expand only if needed later.
- [Open ports may expose desktop access broadly] → Keep usage primarily over Tailscale and avoid adding extra public ingress rules during this change.
- [Partial installation can leave ports in an inconsistent state] → Rebind conflicting services first, install all components, then start services in a controlled order and verify each layer.

## Migration Plan

1. Re-run the container currently binding port `5900` so it uses port `5901`, and remove any temporary noVNC sidecar on `6080`.
2. Install host packages for virtual display, window manager, VNC server, and noVNC/websockify.
3. Configure and start the host VNC stack in dependency order.
4. Verify port `5900` emits a VNC/RFB banner and port `6080` serves noVNC.
5. Test browser connection flow and adjust only if verification fails.

## Open Questions

- Whether a password should be enforced immediately for the VNC server or deferred until the basic path is confirmed working.
- Whether the VNC stack should start as root-owned services or a dedicated non-root desktop user.
