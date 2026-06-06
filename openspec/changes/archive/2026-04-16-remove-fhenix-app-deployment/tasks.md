## 1. Remote Discovery

- [x] 1.1 Connect to `<USERNAME>@<IP_PLACEHOLDER>` and confirm the current `fhenix-app` Podman container, linked images, published ports, mounts, and labels.
- [x] 1.2 Identify the filesystem paths, quadlet files, systemd units, and Cloudflare tunnel configuration entries that belong specifically to `fhenix-app`.

## 2. Runtime And Service Removal

- [x] 2.1 Stop and remove the `fhenix-app` Podman container and delete any remaining `fhenix-app` image artifacts that are no longer referenced.
- [x] 2.2 Remove the `fhenix-app` quadlet source and linked systemd units, then reload systemd and confirm no `fhenix-app` unit remains active or enabled.

## 3. Routing And Filesystem Cleanup

- [x] 3.1 Remove only the Cloudflare tunnel ingress entries that route traffic to `fhenix-app`, preserving unrelated tunnel rules.
- [x] 3.2 Delete host directories and deployment files confirmed to belong exclusively to `fhenix-app`.

## 4. Verification

- [x] 4.1 Verify `podman ps -a`, image listings, systemd state, and filesystem checks show no remaining `fhenix-app` resources.
- [x] 4.2 Verify Cloudflare tunnel configuration no longer contains ingress rules for `fhenix-app` and document the cleanup results.

## Notes (2026-04-16)

- On the host, `fhenix-app` container/image and quadlet were already absent; 2.x / 3.2 were verified as complete.
- Tunnel outage affecting dependent services (e.g. CLIProxyAPI management / OAuth UI) was caused by **corrupted YAML** in `apps/.cloudflared/config.remote.yml` (merged `httpHostHeader` + `aleo` hostname on one line). Fixed on host; see `CLEANUP-RESULTS.md`.
