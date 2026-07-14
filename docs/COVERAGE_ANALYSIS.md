# Coverage Analysis

Run:

```bash
pnpm run coverage:data
```

Outputs:

- `dist/coverage/coverage-report.json`
- `dist/coverage/COVERAGE.md`

Initial seed counts:

| Dataset | Records |
| --- | ---: |
| Country numbering plans | 1 |
| Operators | 4 |
| Fixed area codes | 13 |
| Mobile prefixes | 8 |
| Number ranges | 7 |
| Sources | 3 |

The coverage report highlights missing enrichment such as Arabic labels while
separating those gaps from release blockers.
