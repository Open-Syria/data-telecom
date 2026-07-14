# Data Schema

Canonical files are arrays of JSON objects:

- `data/country-numbering-plans.json`
- `data/operators.json`
- `data/fixed-area-codes.json`
- `data/mobile-prefixes.json`
- `data/number-ranges.json`
- `data/sources.json`

Schemas live in `schemas/*.schema.json`, and stricter cross-file rules live in
`scripts/lib/data-schemas.mjs`.

Cross-file validation checks:

- unique record IDs,
- unique fixed area codes and mobile prefixes,
- source IDs exist and are approved,
- every `sourceId` has a matching `sourceReferences` entry,
- fixed area codes point to fixed operators,
- mobile prefixes point to mobile operators,
- dialing prefixes equal `0` plus the area code or mobile prefix,
- fixed `nationalSignificantNumberLength` equals area-code length plus subscriber length.
