## Context

`fhenix-app` is deployed remotely on `<USERNAME>@<IP_PLACEHOLDER>` and currently has live runtime state in Podman plus linked configuration across the host. The reported footprint includes a running container named `fhenix-app`, an image tagged `localhost/fhenix-app:termux`, filesystem content used for deployment, Cloudflare tunnel ingress entries, and quadlet-managed systemd units. The cleanup has to cover all of these layers so traffic is no longer routed to the service and it cannot restart after removal.

## Goals / Non-Goals

**Goals:**
- Remove all runtime, image, service, routing, and filesystem resources that are specifically linked to `fhenix-app`.
- Make the cleanup repeatable and safe by discovering current state before deleting resources.
- Verify after cleanup that `fhenix-app` is absent from Podman, systemd quadlets, and Cloudflare tunnel ingress configuration.

**Non-Goals:**
- Redesign unrelated container, tunnel, or systemd configuration on the host.
- Remove shared infrastructure entries unless they are directly tied to `fhenix-app`.
- Replace `fhenix-app` with a new deployment.

## Decisions

1. Discover before delete.
Rationale: The user provided a likely current container listing, but implementation should still confirm the actual remote state over SSH before removing anything. This reduces the chance of deleting the wrong resources if names, ports, or paths drifted.
Alternative considered: Delete based only on the supplied container details. Rejected because linked directories, quadlet files, and tunnel config locations are still unknown and need host inspection.

2. Treat cleanup as a multi-layer removal workflow.
Rationale: `fhenix-app` spans runtime, persistent config, and networking. Removing only the container would leave restart paths and stale ingress routes behind. The implementation should remove resources in order: stop runtime, disable service definitions, remove routing config, then delete host files.
Alternative considered: Remove files first and rely on service failures to stop the app. Rejected because it can leave a running container until reboot or manual stop.

3. Preserve unrelated shared configuration.
Rationale: Cloudflare tunnel config and systemd directories may contain entries for other services. Implementation should edit only the `fhenix-app`-specific ingress and quadlet definitions rather than replacing entire shared files unless the whole file is dedicated to `fhenix-app`.
Alternative considered: Delete broader config directories to guarantee cleanup. Rejected because it risks downtime for unrelated services.

## Risks / Trade-offs

- [Cloudflare ingress may be stored in a shared config file] -> Mitigation: inspect the active tunnel config and remove only rules that point to `fhenix-app` hostnames, ports, or services.
- [Quadlet units may generate multiple systemd artifacts] -> Mitigation: remove the source quadlet file, reload systemd, disable linked units, and confirm no generated unit remains active.
- [Filesystem paths may not be obvious from container metadata alone] -> Mitigation: inspect container mounts, unit files, and deployment directories before deletion, then remove only assets proven to belong to `fhenix-app`.
- [Some resources may already be partially removed] -> Mitigation: use idempotent checks and treat missing resources as acceptable during cleanup verification.
