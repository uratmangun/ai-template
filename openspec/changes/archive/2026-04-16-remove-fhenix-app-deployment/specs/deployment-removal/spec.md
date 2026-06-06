## ADDED Requirements

### Requirement: Targeted deployment discovery
The cleanup process SHALL inspect the target host and positively identify the runtime, service, filesystem, and routing resources linked to the named deployment before destructive actions are taken.

#### Scenario: Discover linked resources before deletion
- **WHEN** cleanup begins for `fhenix-app`
- **THEN** the operator verifies the matching Podman container, linked image or images, quadlet or systemd units, deployment directories, and Cloudflare ingress entries associated with `fhenix-app`

### Requirement: Runtime resources are removed
The cleanup process SHALL stop and remove `fhenix-app` runtime resources so the application is no longer running and cannot be restarted from existing container state.

#### Scenario: Remove running container
- **WHEN** a Podman container named `fhenix-app` is present on the target host
- **THEN** the cleanup stops and removes that container and confirms it no longer appears in `podman ps -a`

#### Scenario: Remove linked image artifacts
- **WHEN** Podman images exist only for the `fhenix-app` deployment
- **THEN** the cleanup removes those images after dependent containers are removed and confirms no `fhenix-app` image remains

### Requirement: Service-management resources are removed
The cleanup process SHALL remove the service definitions that can recreate or restart `fhenix-app`.

#### Scenario: Remove quadlet-managed service
- **WHEN** `fhenix-app` is managed by a quadlet file or derived systemd unit
- **THEN** the cleanup removes the quadlet source, reloads systemd state, disables linked units, and confirms no `fhenix-app` unit remains enabled or active

### Requirement: Routing configuration is removed
The cleanup process SHALL remove ingress configuration that routes external traffic to `fhenix-app` without impacting unrelated services.

#### Scenario: Remove Cloudflare tunnel ingress entries
- **WHEN** Cloudflare tunnel configuration contains ingress rules for `fhenix-app`
- **THEN** the cleanup removes only the `fhenix-app` rules and preserves unrelated tunnel entries

### Requirement: Deployment files are removed
The cleanup process SHALL remove filesystem assets dedicated to `fhenix-app` after they are identified as deployment-specific.

#### Scenario: Delete deployment directory
- **WHEN** a host directory is confirmed to belong exclusively to `fhenix-app`
- **THEN** the cleanup deletes that directory and confirms the path no longer exists

### Requirement: Cleanup is verified end-to-end
The cleanup process SHALL verify that `fhenix-app` no longer has active runtime, restart configuration, or ingress exposure on the target host.

#### Scenario: Post-cleanup verification succeeds
- **WHEN** cleanup steps are complete
- **THEN** verification shows no `fhenix-app` container, no linked quadlet or systemd unit, no remaining deployment directory, and no Cloudflare ingress rule targeting the service
