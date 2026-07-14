# Data Currency

Telecom numbering can change. Treat records as source-backed references with a
source date, not as a live registry.

Maintenance rules:

- Prefer current national numbering-plan publications.
- Keep older records only when still useful and clearly sourced.
- Update `sourceReferences.sourceRecordDate` when a source publication date is known.
- Use `sourceStatus: "deprecated"` only when a record should remain visible for history.
- Do not infer live assignment state from private market data or carrier websites without review.
