# Sentinel Security Journal

## JWT Secret Hardcoding Vulnerability
- **Date**: $(date +%Y-%m-%d)
- **Component**: `artifacts/api-server/src/lib/auth.ts`
- **Vulnerability**: Hardcoded fallback values were used for `JWT_SECRET` and `JWT_REFRESH_SECRET` if the environment variables were not set. This exposes the application to severe impersonation attacks because the secrets are predictable and visible in source code.
- **Fix**: Removed the hardcoded fallback values. Added strict validation at startup to throw an Error and crash the application if `process.env.JWT_SECRET` or `process.env.JWT_REFRESH_SECRET` are missing. This ensures the application fails fast and prevents it from running with insecure defaults.
- **Verification**: Ran `pnpm --filter @workspace/api-server run test` with and without the environment variables set to verify the behavior.
