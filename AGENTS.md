# AGENTS.md

This file is the repo-root guide for coding agents working on the OpenSyria
telecom numbering reference dataset. Treat it as the agent-facing companion to
`README.md`: read it before changing files, then read the closest nested
`AGENTS.md` if one exists for the paths you touch.

This repository contains canonical OpenSyria public telecom numbering metadata.

Work inside this repository only. Keep canonical data under `data`, schemas
under `schemas`, imports under `imports`, examples and fixtures in their
existing folders, and automation in `scripts`. Do not commit local secrets,
generated scratch files, raw imports, or unrelated artifacts.

Use Node 24+ and pnpm 11+. Before handing off changes, run the smallest relevant
command and prefer `pnpm validate` when data, schemas, imports, or release
output behavior changed:

- `pnpm check`
- `pnpm validate:schemas`
- `pnpm validate:imports`
- `pnpm validate:data`
- `pnpm validate`

## Documentation Freshness

- When changing dataset scope, repository layout, commands, release artifacts,
  contributor-facing workflow, or public documentation links, update
  `README.md`, `contributions/README.md`, and `CHANGELOG.md` when the change is
  release-visible.
- When changing canonical record shapes in `data/*.json` or schema files in
  `schemas/*.schema.json`, update `docs/DATA_SCHEMA.md`,
  `docs/FIELD_REFERENCE.md`, `docs/ID_POLICY.md`, `schemas/README.md`, and
  validation examples/fixtures in the same change.
- When adding, removing, or reclassifying sources, source fields, source
  licenses, source access dates, or source decision rationale, update
  `data/sources.json`, `docs/SOURCES.md`, `docs/SOURCE_DECISIONS.md`, import
  manifests, and affected source references in canonical records.
- When changing import inputs, normalized outputs, source manifests, or importer
  scripts, update `imports/README.md`, `imports/manifests/README.md`,
  `docs/IMPORT_WORKFLOW.md`, and `docs/PRE_SEED_CHECKLIST.md`.
- When data quality, coverage, currency, review status, blockers, or readiness
  changes, update `docs/DATA_QUALITY.md`, `docs/COVERAGE_ANALYSIS.md`,
  `docs/DATA_CURRENCY.md`, and `docs/REVIEW_PROCESS.md`.
- When release build output, manifest fields, artifact names/formats, checksums,
  publication steps, or GitHub release process changes, update
  `docs/releases.md`, `docs/GENERATED_ARTIFACTS.md`,
  `docs/RELEASE_CHECKLIST.md`, `schemas/release-manifest.schema.json`, and
  coordinate any pinned release changes in `datasets-api/dataset-releases.json`
  and website dataset metadata.

## Safety Notes

Telecom data can drift into sensitive or personal data. Default public records
must be numbering-plan metadata, not subscriber numbers, call records, network
coverage, cell towers, outages, surveillance, or live operational status. Hold
ambiguous records for maintainer review.
