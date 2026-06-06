## ADDED Requirements

### Requirement: VPS exposes a real VNC server on port 5900
The system SHALL provide an actual VNC/RFB server on `<IP_PLACEHOLDER>:5900` instead of an unrelated application binding.

#### Scenario: VNC backend responds as an RFB server
- **WHEN** a client connects to port `5900` on the VPS
- **THEN** the service SHALL respond as a VNC/RFB server

### Requirement: VPS exposes browser-based noVNC access on port 6080
The system SHALL provide a browser-accessible noVNC endpoint on port `6080` that proxies to the real VNC backend.

#### Scenario: noVNC page loads successfully
- **WHEN** a browser opens `http://<IP_PLACEHOLDER>:6080/vnc.html`
- **THEN** the VPS SHALL serve the noVNC interface
- **AND** the interface SHALL target the VNC backend on port `5900`

### Requirement: Browser connection succeeds end-to-end
The system SHALL allow a browser user to connect through noVNC without receiving the current backend connection failure caused by the fake port-`5900` service.

#### Scenario: noVNC connects to the backend
- **WHEN** a user activates the connect flow in the noVNC page
- **THEN** the browser session SHALL establish a working connection to the VPS desktop
- **AND** the page SHALL not show a backend failure caused by a non-VNC service on port `5900`
