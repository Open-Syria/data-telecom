# Generated Artifacts

Run:

```bash
pnpm run release:build
```

The release builder writes `dist/release/release-manifest.json` and artifacts
under `dist/release/artifacts/`.

Formats:

- JSON
- NDJSON
- CSV
- SQL
- YAML
- XML

Generated files are ignored by Git. The canonical source of truth remains
`data/*.json`.
