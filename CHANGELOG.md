# Changelog

## Unreleased

- Make tag-driven release manifests reproducible from the tagged commit timestamp.
- Prevent release workflow reruns from replacing published assets; matching assets are retained and changed bytes require a new version.
- Align validation, CodeQL, and dependency-review workflow security and skip behavior with the other dataset repositories.
- Apply the shared pnpm supply-chain policy, audit dependencies during validation, and pin the patched `fast-uri` release.

## v0.1.0

- Add initial telecom numbering dataset repository scaffold.
- Add canonical seed data for Syria country code `+963`, fixed area codes,
  mobile prefixes, operators, and public numbering ranges.
- Add schemas, examples, fixtures, source import manifests, release tooling,
  coverage reporting, and validation scripts.
- Mark the initial release manifest API-ready for the public `datasets-api`
  telecom endpoints.
