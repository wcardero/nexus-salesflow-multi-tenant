# Spec: Fix Manager View Loading and Admin Access Bug

## 1. Problem Description
Users have reported a critical bug affecting the system's core functionality:
1.  When a user with the "Manager" role authenticates, the manager-specific dashboard view fails to load correctly.
2.  After this failed login attempt, the primary "Admin" user is no longer able to log in, suggesting that the manager's session is interfering with or corrupting the authentication state of other users.

## 2. Expected Behavior
1.  **Manager Login:** A user with the "Manager" role should be able to log in and be presented with the `ManagerDashboard` view, fully populated with their relevant data.
2.  **Admin Login:** The "Admin" user (and any other user) should be able to log in successfully at any time, regardless of the login activity of other users. User sessions must be isolated and should not interfere with one another.

## 3. Scope
*   **Investigation:** Analyze the authentication flow, session management, and role-based rendering logic in both the frontend (React) and backend (Express.js).
*   **Fix:** Implement the necessary changes to correct the view loading issue for managers and ensure session isolation.
*   **Testing:** Create specific tests to verify that the bug is resolved and that no regressions have been introduced to the authentication or role-based access control systems.
