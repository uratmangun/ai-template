## Context

The target environment is a Linux VPS that already has Tailscale installed and reachable over SSH. The missing work is host-level network forwarding configuration plus the Tailscale control-plane setting that advertises the machine as an exit node. The final usable state also depends on an approval step in the Tailscale admin console.

## Goals / Non-Goals

**Goals:**
- Ensure the VPS has the required IPv4 and IPv6 forwarding settings for exit-node support.
- Advertise the VPS as a Tailscale exit node using the supported CLI flow.
- Verify the advertised state so the machine can be approved and used as an exit node.
- Keep the change focused on a single existing VPS rather than building a reusable automation framework.

**Non-Goals:**
- Installing Tailscale from scratch.
- Managing Tailscale ACL policy changes.
- Automating the Tailscale admin-console approval step.
- Configuring client devices to consume the exit node.

## Decisions

- Use persistent sysctl configuration for `net.ipv4.ip_forward=1` and `net.ipv6.conf.all.forwarding=1` so forwarding survives reboot. This follows Tailscale’s documented Linux exit-node prerequisites.
- Use `tailscale set --advertise-exit-node` instead of re-running a broader `tailscale up` configuration. This minimizes the risk of unintentionally changing unrelated node settings.
- Verify readiness through local inspection (`sysctl`, `tailscale status`, and/or `tailscale debug prefs`) plus the documented expectation that the admin console will show the machine as pending approval. This gives both system-level and control-plane confirmation.
- Treat firewall/NAT adjustments as conditional follow-up work. Some VPS distributions may require additional forwarding or masquerade allowances, but this should only be changed if verification shows the platform blocks routed traffic.

## Risks / Trade-offs

- [Provider or host firewall blocks forwarded traffic] → Check forwarding/NAT rules only if the node advertises successfully but traffic does not flow.
- [Node advertises but is not usable until approved] → Include explicit verification that approval in the admin console is still required.
- [Using `tailscale up` could overwrite prior settings] → Prefer `tailscale set --advertise-exit-node` for a narrower change surface.
- [IPv6 forwarding is unsupported or unnecessary on some VPSes] → Enable it anyway for standards compliance, but treat IPv4 forwarding as the minimum operational requirement.
