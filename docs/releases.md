# Releases

This repository publishes versioned telecom release artifacts from the canonical
JSON files.

Local dry run:

```bash
pnpm run release:prepare -- --version v0.1.0
```

The initial release is API-ready when validation passes. `datasets-api` consumes
the release from `dataset-releases.json`, serves the telecom endpoints from the
verified JSON artifacts, and requires `readiness.publicApi.status: "approved"`.
