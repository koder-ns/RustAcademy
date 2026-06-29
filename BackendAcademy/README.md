# BackendAcademy

RustAcademy backend module — placeholder for future NestJS backend implementation.

## Getting Started

```bash
pnpm install
pnpm run dev
```

## Structure

- `src/` — Application source code (NestJS modules, controllers, services)
- `test/` — Test files

See `app/backend/` for the primary backend implementation and conventions.

## Multi-Tenant Considerations

The backend is designed with multi-tenancy in mind. Key aspects:

- **Tenant Isolation**: Each tenant's data is scoped via a `tenant_id` column on all multi-tenant entities. Queries automatically filter by the current tenant context.
- **Tenant Context Resolution**: The tenant is resolved from the authenticated user's JWT claims and injected via a `TenantInterceptor` into the request-scoped `TenantService`.
- **Database Strategy**: Row-level tenant isolation using a shared database with tenant-scoped queries. This keeps operational overhead low while maintaining data separation.
- **Configuration**: Tenant-specific settings (e.g., custom domains, feature flags) are stored in a dedicated `tenants` table and cached for performance.
- **Onboarding Flow**: New tenants are provisioned through a Tenant onboarding endpoint that creates the tenant record and assigns an admin user.
