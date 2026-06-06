# remove-fhenix-app-deployment — cleanup results (2026-04-16)

## Summary

- **fhenix-app runtime:** No `fhenix-app` Podman container or image on `<USERNAME>@<IP_PLACEHOLDER>`; no `fhenix` quadlet under `~/.config/containers/systemd/`. Removal tasks for the app itself were already satisfied (idempotent).
- **Cloudflare tunnel:** `cloudflared.service` (user systemd) had **failed** because `config.remote.yml` contained **invalid YAML**: the line `httpHostHeader: <DOMAIN_PLACEHOLDER>  - hostname: <DOMAIN_PLACEHOLDER>` merged two ingress rules. That prevented the tunnel from starting, so hostnames such as `<DOMAIN_PLACEHOLDER>` (including `/management.html#/oauth`) were unreachable.
- **Fix applied:** Restored correct structure: close `cliproxyapi` `originRequest` block, then separate `- hostname: <DOMAIN_PLACEHOLDER>` with its `service`. Backed up broken file as `config.remote.yml.bak.fix-yaml-*` on the host.
- **Verification:** `systemctl --user start cloudflared.service` → active (running); tunnel registered connections; `curl` to `<URL_PLACEHOLDER>` returned **200**.

## Ingress note

- No `fhenix` hostname remained in `config.remote.yml` at time of fix.
