# Import Workflow

1. Review source terms and decide whether factual metadata can be represented.
2. Add or update a manifest under `imports/manifests/`.
3. Add source registry entries to `data/sources.json`.
4. Normalize facts into the canonical `data/*.json` files.
5. Add dated `sourceReferences` for every changed public record.
6. Run `pnpm validate`.
7. Document source decisions in `docs/SOURCE_DECISIONS.md` when scope or reuse is non-obvious.

Raw source files should not be committed unless maintainers explicitly approve
them. Prefer manifests and factual extracted records.
