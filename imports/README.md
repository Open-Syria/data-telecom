# Imports

Import manifests document reviewed public sources before their facts enter the canonical
`data/*.json` files.

Use `imports/manifests/source-import.template.json` for new sources, then run:

```bash
pnpm run validate:imports
pnpm run validate:data
```
