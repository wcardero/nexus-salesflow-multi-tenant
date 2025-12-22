# Technology Stack

This document outlines the core technologies and frameworks used in the Nexus SalesFlow Multi-Tenant application.

## 1. Frontend
*   **Framework:** React
    *   **Description:** A JavaScript library for building user interfaces.
*   **Language:** TypeScript
    *   **Description:** A superset of JavaScript that adds static types, enhancing code quality and maintainability.
*   **Build Tool:** Vite
    *   **Description:** A fast build tool that significantly improves the frontend development experience.
*   **Styling:** Tailwind CSS
    *   **Description:** A utility-first CSS framework for rapidly building custom designs.

## 2. Backend
*   **Runtime:** Node.js
    *   **Description:** An open-source, cross-platform JavaScript runtime environment for executing JavaScript code outside a web browser.
*   **Framework:** Express.js
    *   **Description:** A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
*   **Language:** TypeScript
    *   **Description:** Used for developing the backend services, providing type safety and improved code structure.
*   **Database:** PostgreSQL
    *   **Description:** A powerful, open-source object-relational database system known for its reliability, feature robustness, and performance.
*   **ORM/Database Client:** `pg` (Node.js PostgreSQL client)
    *   **Description:** Used to connect and interact with the PostgreSQL database.

## 3. Authentication & Security
*   **Authentication Mechanism:** JSON Web Tokens (JWT)
    *   **Description:** A compact, URL-safe means of representing claims to be transferred between two parties. Used for user authentication and authorization.
*   **Password Hashing:** bcrypt
    *   **Description:** A password hashing function designed to be slow and resistant to brute-force attacks, ensuring secure storage of user passwords.

## 4. Deployment & Infrastructure
*   **Containerization:** Docker
    *   **Description:** A platform for developing, shipping, and running applications in containers, ensuring consistency across different environments (indicated by `docker-compose.yml`).
