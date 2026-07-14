# Contributing

Thank you for helping improve OpenSyria telecom reference data.

## Good Contributions

- correct a public country-code, area-code, mobile-prefix, operator, or range
  record,
- add missing public numbering-plan metadata within the approved scope,
- improve source attribution, source dates, or source decision notes,
- link fixed area codes to reviewed OpenSyria geography IDs,
- document uncertainty or source conflicts,
- improve examples, schemas, or validation when maintainer-approved.

## Not Accepted

Do not add:

- personal phone numbers,
- private addresses or contact directories,
- call-detail records or subscriber records,
- tower, cell-site, coverage, outage, surveillance, interception, or live
  operational status data,
- proprietary telecom or map databases,
- data from sources that do not allow public reference use.

## Normal Data Pull Request

1. Read `README.md`, `docs/FIELD_REFERENCE.md`, `docs/SOURCES.md`, and
   `contributions/README.md`.
2. Keep the edit focused.
3. Use approved public sources and include source IDs plus dated
   `sourceReferences`.
4. Run:

   ```bash
   pnpm run validate
   ```

5. Explain what changed, why, and which public sources support it.

Schema, source policy, release tooling, and dataset-scope changes require
maintainer discussion before implementation.
