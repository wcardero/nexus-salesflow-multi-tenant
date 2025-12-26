## 1. Implementation
- [x] 1.1 Create POST /api/exchange-rates endpoint in backend
- [x] 1.2 Add request validation (rate, startDate, storeId)
- [x] 1.3 Update existing exchange rate with endDate when new rate is set
- [x] 1.4 Insert new exchange rate record with storeId
- [x] 1.5 Add audit logging for exchange rate changes
- [x] 1.6 Update ManagerDashboard handleSetExchangeRate to call backend API
- [x] 1.7 Replace local state updates with API call and refreshDb()
- [x] 1.8 Test exchange rate persistence across page refreshes

## 2. Testing
- [ ] 2.1 Verify exchange rate is saved to database when set
- [ ] 2.2 Verify exchange rate persists after page refresh
- [ ] 2.3 Verify historical exchange rates are correctly tracked (endDate set)
- [ ] 2.4 Verify audit log entry is created for exchange rate changes
- [ ] 2.5 Verify only Managers and Directors can set exchange rates
