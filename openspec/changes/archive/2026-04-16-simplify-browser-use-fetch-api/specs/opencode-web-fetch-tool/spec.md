## ADDED Requirements

### Requirement: Tool interface accepts only a URL
The system SHALL provide an opencode `web-fetch` tool interface that accepts only a fully formed `url` argument.

#### Scenario: Tool schema exposes only URL input
- **WHEN** an operator inspects the local tool definition
- **THEN** the tool argument schema SHALL define `url`
- **AND** the schema SHALL not expose `saveAs`
- **AND** the schema SHALL not expose `proxyCountryCode`

### Requirement: Tool manages HTML output path internally
The system SHALL save fetched HTML to an internally managed output path without requiring a caller-specified destination.

#### Scenario: Tool writes HTML to an internal temporary path
- **WHEN** the tool successfully fetches a page
- **THEN** it SHALL write the HTML to an automatically generated temporary file path
- **AND** it SHALL return that generated path in the tool result

### Requirement: Tool request body omits proxy-country override
The system SHALL send only the URL to the remote `/fetch` endpoint for standard fetch operations.

#### Scenario: Tool posts URL without proxy-country input
- **WHEN** the tool invokes the remote fetch endpoint
- **THEN** the JSON request body SHALL include `url`
- **AND** the JSON request body SHALL omit `proxyCountryCode`
