## ADDED Requirements

### Requirement: Fetch endpoint accepts only a URL
The system SHALL expose a `/fetch` HTTP endpoint that requires `url` and does not require or document caller-supplied `proxyCountryCode`.

#### Scenario: Request with URL succeeds without proxy-country input
- **WHEN** a client POSTs JSON containing `url` to `/fetch`
- **THEN** the service SHALL attempt to fetch the page without requiring `proxyCountryCode`
- **AND** the service SHALL return page HTML and fetch metadata on success

#### Scenario: Request without URL is rejected
- **WHEN** a client POSTs to `/fetch` without a valid string `url`
- **THEN** the service SHALL respond with an error indicating that `url` is required

### Requirement: Fetch endpoint relies on Browser Use default proxy behavior
The system SHALL omit `proxyCountryCode` when creating or connecting Browser Use-managed browsers unless an explicit non-default proxy behavior is intentionally configured in code.

#### Scenario: Session creation omits proxy-country override
- **WHEN** the service creates a Browser Use browser session for a standard fetch request
- **THEN** the outbound Browser Use API request SHALL omit `proxyCountryCode`
- **AND** the resulting session SHALL rely on Browser Use default proxy behavior

#### Scenario: WebSocket connection omits proxy-country override
- **WHEN** the service connects through the Browser Use WebSocket/CDP endpoint for a standard fetch request
- **THEN** the connection URL SHALL omit `proxyCountryCode`
- **AND** the browser SHALL still be able to navigate and return page HTML

### Requirement: Quadlet-managed deployment path is verifiable
The system SHALL document and verify the deployment path for the fetch service running as the quadlet-managed container `<DOMAIN_PLACEHOLDER>`.

#### Scenario: Service source and restart path are identified
- **WHEN** an operator inspects the deployed service
- **THEN** the service source directory SHALL be identifiable as `/home/<USERNAME>/termux-migration/apps/browser-use-api`
- **AND** the quadlet source SHALL be identifiable as `/home/<USERNAME>/.config/containers/systemd/<DOMAIN_PLACEHOLDER>.container`
- **AND** the service restart path SHALL use the user systemd unit `<DOMAIN_PLACEHOLDER>.service`
