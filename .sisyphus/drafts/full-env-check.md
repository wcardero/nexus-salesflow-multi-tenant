# Draft: Full System Environment Standardization

## Requirements (confirmed)
- Standardize Frontend variables (`VITE_PORT`, `VITE_API_URL`) - Plan created.
- Verify Backend variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
- Verify Docker configuration consistency.

## Technical Decisions
- [TBD]: Whether to merge backend/docker fixes into the existing plan or create a new one.

## Research Findings
- **Backend**: Solid. Correctly uses `DATABASE_URL`, `JWT_SECRET`, and `PORT`.
- **Docker**: Solid. `docker-compose.yml` and `docker.env.example` are aligned.
- **Frontend**: Broken consistency. Needs fix as planned in `standardize-env-vars.md`.
- **LSP Error**: `vite.config.ts` has a broken import (`InlineConfig` from `vitest`).

## Final Recommendation
Execute the plan `standardize-env-vars.md` to align the frontend with the documentation and fix the minor configuration error in Vite.
