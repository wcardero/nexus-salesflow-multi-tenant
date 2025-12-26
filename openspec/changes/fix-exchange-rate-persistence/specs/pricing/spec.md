## ADDED Requirements
### Requirement: Exchange Rate Persistence
The system SHALL persist exchange rate changes to the database so they remain available across sessions and page refreshes.

#### Scenario: Manager sets new exchange rate
- **WHEN** a Manager or Director submits a new exchange rate with a rate, startDate, and storeId
- **THEN** the system validates that the rate is a positive number
- **AND** the system sets the endDate on any existing current exchange rate for that store
- **AND** the system creates a new ExchangeRate record with the provided rate, startDate, and storeId
- **AND** the system returns the newly created exchange rate record
- **AND** the system creates an audit log entry with action SET_EXCHANGE_RATE

#### Scenario: Exchange rate persists after refresh
- **WHEN** a Manager or Director sets an exchange rate
- **AND** the page is refreshed or the dashboard is reloaded
- **THEN** the previously set exchange rate is still displayed and available for calculations
