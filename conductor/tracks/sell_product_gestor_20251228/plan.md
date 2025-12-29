# Plan: Implement Product Selling Functionality for Gestor

## Phase 1: Frontend - Gestor Dashboard UI Implementation

- [x] Task: Write Failing Tests: Implement unit tests for 'Sell' button rendering on inventory item rows. (2657e12)
- [x] Task: Implement: Render 'Sell' button on each inventory item row in Gestor Dashboard. (2657e12)
- [ ] Task: Write Failing Tests: Implement unit tests for opening and closing the sell modal.
- [ ] Task: Implement: Create and integrate the sell modal component.
- [ ] Task: Write Failing Tests: Implement unit tests for displaying product name, available quantity, and selling price in the modal.
- [ ] Task: Implement: Populate sell modal with Product Name, Available Quantity, and Selling Price.
- [ ] Task: Write Failing Tests: Implement unit tests for real-time quantity input validation in the sell modal.
- [ ] Task: Implement: Add numeric input field for quantity in sell modal with real-time validation against available stock.
- [ ] Task: Refactor: Refactor UI components for clarity and maintainability.
- [ ] Task: Verify Coverage: Ensure adequate test coverage for UI components.
- [ ] Task: Conductor - User Manual Verification 'Frontend - Gestor Dashboard UI Implementation' (Protocol in workflow.md)

## Phase 2: Backend - Sales Logic and Persistence

- [ ] Task: Write Failing Tests: Implement unit tests for creating a new 'Sale' record.
- [ ] Task: Implement: Create API endpoint and logic for creating a new 'Sale' record.
- [ ] Task: Write Failing Tests: Implement unit tests for updating 'AssignedInventory' quantity after a sale.
- [ ] Task: Implement: Implement logic to decrement 'AssignedInventory' quantity upon sale confirmation.
- [ ] Task: Write Failing Tests: Implement integration tests for the complete sales transaction (new 'Sale' record + inventory update).
- [ ] Task: Implement: Connect frontend sell modal to backend sales API.
- [ ] Task: Refactor: Refactor backend logic for sales and inventory updates.
- [ ] Task: Verify Coverage: Ensure adequate test coverage for backend sales logic.
- [ ] Task: Conductor - User Manual Verification 'Backend - Sales Logic and Persistence' (Protocol in workflow.md)

## Phase 3: Frontend - 'Sales Made Outside of Closing' Tab

- [ ] Task: Write Failing Tests: Implement unit tests for rendering the 'Sales Made Outside of Closing' tab.
- [ ] Task: Implement: Add a new dedicated tab 'Sales Made Outside of Closing' to the Gestor Dashboard.
- [ ] Task: Write Failing Tests: Implement unit tests for displaying sold products with name, quantity, and total price in the new tab.
- [ ] Task: Implement: Fetch and display sales data (Product Name, Quantity Sold, Total Price) in the 'Sales Made Outside of Closing' tab.
- [ ] Task: Refactor: Refactor frontend components for sales display.
- [ ] Task: Verify Coverage: Ensure adequate test coverage for sales display components.
- [ ] Task: Conductor - User Manual Verification 'Frontend - 'Sales Made Outside of Closing' Tab' (Protocol in workflow.md)
