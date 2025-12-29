# Feature: Implement Product Selling Functionality for Gestor

## 1. Overview
This feature introduces the ability for Gestors (managers) to sell products directly from their dashboard. It includes a user-friendly selling interface, real-time stock validation, and a dedicated section to track sales made outside of the standard closing process.

## 2. Functional Requirements

### 2.1 Sell Interaction
-   **FR1.1:** A dedicated 'Sell' button MUST be available on each inventory item row within the Gestor Dashboard.
-   **FR1.2:** Clicking the 'Sell' button MUST open a modal/dialog for the selling process.

### 2.2 Sell Modal
-   **FR2.1:** The sell modal MUST display the Product Name.
-   **FR2.2:** The sell modal MUST display the Available Quantity of the product.
-   **FR2.3:** The sell modal MUST display the Selling Price per unit of the product.
-   **FR2.4:** The sell modal MUST include a simple numeric input field for the quantity to be sold.
-   **FR2.5:** The numeric input field MUST provide real-time validation, ensuring the entered quantity does not exceed the Available Quantity.

### 2.3 Sales Made Outside of Closing Section
-   **FR3.1:** A dedicated tab titled 'Sales Made Outside of Closing' MUST be added to the Gestor Dashboard.
-   **FR3.2:** This tab MUST display a list of products sold outside of closing.
-   **FR3.3:** For each sold product, the 'Sales Made Outside of Closing' tab MUST display the Product Name.
-   **FR3.4:** For each sold product, the 'Sales Made Outside of Closing' tab MUST display the Quantity Sold.
-   **FR3.5:** For each sold product, the 'Sales Made Outside of Closing' tab MUST display the Total Price (Selling Price x Quantity Sold).

### 2.4 Data Persistence
-   **FR4.1:** Upon confirmation of a sale, the system MUST create a new 'Sale' record.
-   **FR4.2:** Upon confirmation of a sale, the system MUST separately update the corresponding 'AssignedInventory' record by decrementing the sold quantity from the available stock.

## 3. Non-Functional Requirements
-   **NFR3.1:** The selling process MUST be intuitive and easy to use for Gestors.
-   **NFR3.2:** Real-time validation MUST provide immediate feedback to the user.

## 4. Acceptance Criteria
-   The 'Sell' button is present and functional for each inventory item in the Gestor Dashboard.
-   The sell modal accurately displays product name, available quantity, and selling price.
-   The quantity input field validates input in real-time, preventing sales exceeding available stock.
-   A dedicated 'Sales Made Outside of Closing' tab is visible in the Gestor Dashboard.
-   The 'Sales Made Outside of Closing' tab correctly lists sold products with their name, quantity, and total price.
-   Confirming a sale successfully creates a new 'Sale' record and updates the 'AssignedInventory' quantity.

## 5. Out of Scope
-   Complex pricing rules or discounts are not part of this feature.
-   Integration with external payment gateways.
-   Detailed reporting beyond the 'Sales Made Outside of Closing' tab.