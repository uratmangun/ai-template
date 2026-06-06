## Why

The `fhenix-app` deployment is no longer wanted and currently spans multiple systems, including a running Podman container, host filesystem assets, Cloudflare tunnel ingress configuration, and systemd quadlet units. Removing it requires a tracked change so the cleanup is complete, auditable, and does not leave stale routes or service definitions behind.

## What Changes

- Remove the running `fhenix-app` Podman container and its local image and container artifacts where they are still present.
- Remove filesystem directories and deployment files that exist only to support `fhenix-app`.
- Remove Cloudflare tunnel ingress entries and related configuration that route traffic to `fhenix-app`.
- Remove systemd quadlet units and any linked systemd state used to start or manage `fhenix-app`.
- Verify the cleanup on the remote host over SSH so there are no remaining `fhenix-app` runtime resources.

## Capabilities

### New Capabilities
- `deployment-removal`: Define the required behavior for fully removing an existing deployment and all linked runtime, filesystem, routing, and service-management resources.

### Modified Capabilities

## Impact

- Remote administration on `<USERNAME>@<IP_PLACEHOLDER>`
- Podman containers, images, and generated runtime state for `fhenix-app`
- Host directories and deployment assets associated with `fhenix-app`
- Cloudflare tunnel ingress configuration
- systemd quadlet files and linked service state
