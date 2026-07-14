# Telecom Contribution Workflow

Use this guide for focused telecom numbering data corrections and missing-record
contributions.

## Before Editing

Check:

- `docs/FIELD_REFERENCE.md`
- `docs/ID_POLICY.md`
- `docs/SOURCES.md`
- `docs/REVIEW_PROCESS.md`

## Allowed Normal Edits

- add or correct public numbering-plan names and prefixes,
- add approved source IDs,
- add or update dated `sourceReferences` for approved source IDs,
- link fixed area-code records to existing OpenSyria geography IDs,
- mark ranges as assigned, reserved, unused, private, or short-number ranges
  only when an approved source supports that status.

## Safety Review

Hold a record for maintainer review if it includes subscriber numbers, personal
contact details, live network state, tower/coverage details, surveillance
signals, ambiguous licensing, or current operational claims that are not part of
the public numbering plan.

## Validation

Run:

```bash
pnpm run validate
```
