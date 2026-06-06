## ADDED Requirements

### Requirement: VPS exit-node prerequisites are configured
The system SHALL configure the Linux VPS with persistent IP forwarding settings required for Tailscale exit-node advertisement, including IPv4 forwarding and IPv6 forwarding where supported by the host.

#### Scenario: Persistent forwarding is enabled
- **WHEN** the VPS is prepared for exit-node advertisement
- **THEN** persistent system settings SHALL enable IPv4 forwarding
- **AND** persistent system settings SHALL enable IPv6 forwarding

### Requirement: VPS advertises itself as a Tailscale exit node
The system SHALL configure the existing Tailscale installation on the VPS to advertise the node as an exit node without removing unrelated node configuration.

#### Scenario: Exit-node advertisement is enabled
- **WHEN** exit-node advertisement is applied on the VPS
- **THEN** the local Tailscale node configuration SHALL indicate that the machine advertises itself as an exit node

### Requirement: Exit-node readiness can be verified
The system SHALL provide a verification flow that confirms the VPS is advertising as an exit node and indicates whether an admin-console approval step is still required before client use.

#### Scenario: Verification detects advertised pending approval state
- **WHEN** the VPS has successfully advertised itself as an exit node
- **THEN** the verification flow SHALL confirm the advertised state locally
- **AND** the verification flow SHALL identify that admin approval may still be required before the node is selectable by clients
