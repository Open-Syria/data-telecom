# OpenSyria Data Telecom

Canonical OpenSyria telecom numbering reference datasets.

This repository publishes source-backed public metadata for Syrian telephone
numbering. It is intended for validation, formatting, area-code lookup,
operator-prefix lookup, and civic reference use.

The dataset does not include personal phone numbers, subscriber records, tower
locations, coverage maps, outages, surveillance-related data, or live network
status.

## Current Status

The first seed contains:

- 1 national numbering plan record for Syria country code `+963`,
- 4 public operator/reference entities,
- 13 fixed area-code records linked to OpenSyria geography governorate IDs,
- 8 assigned mobile prefixes,
- 7 reserved, unused, short-number, used, or private-numbering range records,
- 3 source registry records.

The seed is based on public ITU-hosted numbering-plan material announced by the
Syrian Telecommunications and Post Regulatory Authority. ITU material is public,
but ITU terms do not make every source document unrestricted open data. This
repository stores reviewed factual numbering metadata with source attribution and
keeps source-use limitations visible in `data/sources.json` and
`docs/SOURCE_DECISIONS.md`.

## Repository Layout

```text
data/                  Canonical JSON records
schemas/               JSON Schemas for canonical records and releases
examples/              Single-record examples for documentation and tests
fixtures/valid-data/   Minimal valid fixtures for validation tests
imports/manifests/     Source review and import manifests
scripts/               Validation, reporting, coverage, and release tooling
docs/                  Schema, source, release, and review documentation
```

## Commands

Install dependencies:

```bash
pnpm install
```

Run the full validation pipeline:

```bash
pnpm validate
```

Run focused checks:

```bash
pnpm run check
pnpm run validate:schemas
pnpm run validate:imports
pnpm run validate:data
pnpm run report:data
pnpm run coverage:data
pnpm run release:build
```

Generated release artifacts are written to `dist/release/` and are ignored by
Git.

## Public Data Model

Canonical files:

- `data/country-numbering-plans.json`
- `data/operators.json`
- `data/fixed-area-codes.json`
- `data/mobile-prefixes.json`
- `data/number-ranges.json`
- `data/sources.json`

Each public record carries `sourceIds`, dated `sourceReferences`, and
`sourceStatus` so consumers can inspect provenance consistently.

## Contribution Scope

Good contributions include:

- correcting public numbering-plan metadata,
- adding source-backed fixed area-code or mobile-prefix changes,
- improving source attribution or source dates,
- linking fixed area codes to reviewed OpenSyria geography IDs,
- documenting source conflicts or licensing limitations,
- improving schemas, examples, reports, and release tooling.

Do not add:

- subscriber phone numbers,
- private contact directories,
- call-detail records,
- tower, coverage, outage, surveillance, or interception data,
- live operational status,
- proprietary map or telecom databases,
- source material whose terms do not allow public reference use.

For contribution details, start with [CONTRIBUTING.md](CONTRIBUTING.md) and
[contributions/README.md](contributions/README.md).

## Release Artifacts

`pnpm run release:build` emits JSON, NDJSON, CSV, SQL, YAML, and XML artifacts
for the public data files plus a release manifest.

The canonical source of truth remains the JSON files in `data/`.
