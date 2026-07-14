# Data Quality

Current quality controls:

- JSON Schema validation for every canonical file,
- Zod validation for cross-file rules,
- source registry approval checks,
- duplicate ID and prefix checks,
- release artifact hash and record-count checks,
- fixture validation for minimal valid examples.

Known limits:

- Arabic labels are not complete.
- International access prefix is intentionally null until explicitly sourced.
- Telecom facts are source-backed snapshots, not live network truth.
