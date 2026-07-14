# Sources

Canonical sources live in `data/sources.json`. Every public record must list at
least one approved `sourceId` and a matching entry in `sourceReferences`.

## Approved Sources

| Source ID | Use |
| --- | --- |
| `itu-national-numbering-plans` | Source discovery and country-code reference. |
| `itu-syria-numbering-plan-2022` | Country code, fixed area codes, mobile prefixes, operators, reserved ranges, private numbering ranges, and source dates. |
| `opensyria-data-geography` | OpenSyria governorate IDs used by fixed area-code records. |

## Licensing Notes

ITU material is publicly accessible, but ITU terms include reuse limits. This
repository stores reviewed factual numbering metadata with attribution and does
not mirror source PDFs.

When adding a source, create an import manifest under `imports/manifests/`,
update `data/sources.json`, and run `pnpm run validate:imports`.
