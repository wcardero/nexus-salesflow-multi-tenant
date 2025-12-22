# Plan: Fix Manager View Loading and Admin Access Bug

This plan is structured to diagnose, fix, and verify the resolution of the critical authentication and view loading bug.

## Phase 1: Replicate and Diagnose [checkpoint: 78d0d09]

- [x] Task: **Analyze Backend Authentication Logic:** Review the Express.js backend code, focusing on `src/index.ts`. Examine how JWTs are issued, verified, and how user roles are handled during login and subsequent API requests. Pay close attention to any logic that might be shared or improperly stateful between requests.
- [x] Task: **Analyze Frontend Routing and Data Fetching:** Review the React frontend code, particularly `App.tsx` (routing) and `views/ManagerDashboard.tsx` (view component). Investigate how user data and roles are retrieved after login and used to render the correct dashboard. Check for errors in data fetching or state management.
- [x] Task: **Isolate the Root Cause:** Based on the analysis, write a summary that pinpoints the exact cause of the bug. Determine if the issue is in the backend (e.g., incorrect session handling), the frontend (e.g., faulty rendering logic), or both.
- [ ] Task: Conductor - User Manual Verification 'Replicate and Diagnose' (Protocol in workflow.md)

## Phase 2: Implement the Fix

- [ ] Task: **Write Tests to Replicate the Bug:** Before fixing, write specific unit or integration tests that fail because of this bug. This will be used to confirm the fix is effective. The test should simulate a manager login followed by an admin login attempt.
- [ ] Task: **Implement Code Changes:** Based on the root cause analysis, apply the necessary code changes. This may involve correcting state management in React, fixing session logic in Express, or adjusting API responses.
- [ ] Task: Conductor - User Manual Verification 'Implement the Fix' (Protocol in workflow.md)

## Phase 3: Verification and Testing

- [ ] Task: **Run Tests and Confirm Fix:** Execute the tests created in Phase 2 and ensure they now pass. Run the full existing test suite to check for regressions.
- [ ] Task: **Manual End-to-End Testing:** Perform a manual test of the entire user flow:
    1. Log in as Admin, perform an action, log out.
    2. Log in as Manager, verify the dashboard loads, perform an action, log out.
    3. Log in again as Admin and verify access is still working correctly.
- [ ] Task: **Review and Finalize Changes:** Review all code changes to ensure they adhere to the project's style guides and are well-documented.
- [ ] Task: Conductor - User Manual Verification 'Verification and Testing' (Protocol in workflow.md)
