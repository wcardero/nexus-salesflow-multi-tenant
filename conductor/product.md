# Product Guide: Nexus SalesFlow Multi-Tenant

## 1. Initial Concept
A multi-tenant sales management system with Admin, Manager, and Gestor hierarchies, inventory assignment, and sales consolidation processes.

## 2. Vision
To provide a robust, multi-tenant sales management platform that streamlines operations from administrative oversight to on-the-ground sales, ensuring clear hierarchies, accurate financial tracking, and secure inventory control.

## 3. Target Users
The system is designed for a clear hierarchy of roles, each with specific responsibilities and access levels:
*   **Administrator:** Manages the entire system, including stores, directors, and managers. Has full CRUD operations on core entities and system-wide auditing capabilities.
*   **Director:** Oversees a specific store, managing its managers, products, inventory, and financial configurations like the exchange rate. Validates sales closures.
*   **Manager:** Manages a team of "Gestores" within a store, oversees their assigned inventory, and validates their sales closures.
*   **Gestor (Sales Representative):** The primary sales agent who records sales from their assigned inventory and initiates the sales closure process.

## 4. Problems to Solve
The platform is designed to address several key challenges in sales management:
*   **Inefficient Tracking:** Centralizes the tracking of sales and inventory across multiple stores and sales agents, eliminating manual or fragmented systems.
*   **Lack of Clear Hierarchy:** Implements a strict, role-based access control (RBAC) system, ensuring users only have access to the data and operations relevant to their role.
*   **Manual & Error-Prone Financials:** Automates the process of sales closures, commission calculations, and currency exchange, reducing manual errors and providing a clear audit trail.
*   **Complex Configuration Management:** Simplifies the management of products, pricing (margins), and store-specific exchange rates, with historical tracking for financial accuracy.

## 5. Core Features
*   **Multi-Tenant Architecture:** Support for multiple stores, each with its own set of users, inventory, and configurations.
*   **Hierarchical User Management:** Admins manage Directors/Managers, Directors manage Managers, and Managers manage Gestores.
*   **Quantified Inventory Management:** Control over stock from initial assignment at the store level down to specific quantities assigned to each sales representative.
*   **Detailed Sales and Closure Flow:** A structured process for Gestores to record sales and formally "close" their sales period, which is then validated by a Manager or Director.
*   **Automated Financial Calculations:** Automatic calculation of final prices, commissions, and base amounts using configurable margins and exchange rates.
*   **Comprehensive Auditing:** A system-wide audit trail that logs all significant operations for security and accountability.
*   **Secure Authentication:** JWT-based authentication and role-based authorization to protect all API endpoints.

## 6. Business Rules

### 6.1 Product Management
*   **Unique Product Name per Manager:** Each manager (and director) can only have one product with a given name. This prevents accidental duplicates within a manager's product catalog while allowing different managers to create products with same name (as they may sell similar items independently).
    *   When creating a product, system checks if same manager already has a product with that name.
    *   When editing a product, system checks if new name would conflict with another product from same manager.
    *   The `createdBy` field on `Product` table tracks which user created each product.
*   **Product Edit/Delete Restrictions:** Products can only be edited or deleted when they are not assigned to any gestor to maintain data integrity.
*   **Product Commission Rates:** Products can have a store-specific commission rate or an individual commission rate that overrides the store default.

### 6.2 Exchange Rate Management
*   **Persistent Storage:** Exchange rates are stored in database via `POST /api/exchange-rates` endpoint, ensuring they persist across sessions and page refreshes.
*   **Historical Tracking:** The system maintains a complete history of exchange rates per store. When a new rate is set, the previous rate is marked as no longer active by setting its `endDate`.
*   **Rate Validity:** Only exchange rates without an `endDate` are considered current and active for pricing calculations.
*   **Authorization:** Only Managers and Directors can set exchange rates for their assigned stores.
*   **Audit Trail:** All exchange rate changes are logged in the audit log with action `SET_EXCHANGE_RATE`.
*   **Validation:** Exchange rates must be positive numbers and include a valid start date and store ID.
