# Releases

This repository publishes versioned telecom release artifacts from the canonical
JSON files.

Local dry run:

```bash
pnpm run release:prepare -- --version v0.1.0 --skip-changelog
```

The initial release is artifact-ready when validation passes. API readiness
remains `not_approved` until `datasets-api` exposes telecom endpoints and the
API release pin is updated.
