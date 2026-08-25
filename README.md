# Sky Workflow Planner

**Status: engineering beta / planning library.**

Sky Workflow Planner validates small orchestration manifests against an in-memory registry of system availability. It produces deterministic plans for adapters/controllers to inspect. It does not execute external actions.

## Capabilities

- bounded registry of up to 1,000 systems
- validated system/manifest/step identifiers
- workflow manifests limited to 100 steps
- bounded primitive step parameters
- duplicate-step rejection
- explicit unavailable/unknown target reporting
- deterministic system-status summaries
- strict TypeScript typecheck/build, real tests, and production dependency audit in CI

Every returned workflow plan sets `executable: false` so downstream consumers cannot mistake planning evidence for deployment/execution evidence.

## Not provided

This repository does **not** call cloud APIs, Kubernetes, SSH, CI/CD systems, service managers, shell commands, emergency systems, or infrastructure controllers. It does not execute workflows, store durable state, provide distributed scheduling, secrets handling, RBAC, approval workflows, rollback, HA, or production deployment.

## Development

```bash
npm install
npm run typecheck
npm test
npm run audit
```

## SKYCOIN4444 integration

Use this package as a validation/planning boundary before an independently secured execution adapter. Execution credentials and mutating integrations should never be added to the manifest model itself.
