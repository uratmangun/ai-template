## Why

The VPS already has Tailscale installed, but it is not yet reliably configured and verified as an exit node. This change captures the required system configuration, Tailscale advertisement step, approval requirement, and verification flow so the setup can be applied consistently.

## What Changes

- Add a new capability covering VPS exit-node configuration for Tailscale.
- Define the required host networking prerequisites, including IPv4 and IPv6 forwarding.
- Define the requirement to advertise the VPS as an exit node through Tailscale.
- Define the verification flow for confirming the node is advertised and ready for approval/use.

## Capabilities

### New Capabilities
- `tailscale-exit-node-vps`: Configure a Linux VPS with Tailscale so it advertises itself as an exit node and can be verified as ready for approval and use.

### Modified Capabilities

## Impact

- Affected systems: Linux VPS networking configuration, `tailscaled`, and Tailscale admin approval flow.
- Affected files: OpenSpec proposal, design, tasks, and a new spec for exit-node VPS behavior.
- Dependencies: Existing Tailscale installation on the VPS and access to the Tailscale admin console to approve the advertised exit node.
