# Release Checklist

Before publishing a release:

1. Update `CHANGELOG.md`.
2. Run `pnpm validate`.
3. Run `pnpm run report:data` and inspect the summary.
4. Run:

   ```bash
   pnpm run release:prepare -- --version v0.1.0
   ```

5. Confirm `release-manifest.json` has the expected version, source list, record
   counts, checksums, and readiness notes.
6. Confirm `readiness.level` is `api_ready` and
   `readiness.publicApi.status` is `approved` before pinning the release in
   `datasets-api`.
7. Publish through the repository release workflow or `release:publish:github`
   with a valid `GITHUB_TOKEN`.
