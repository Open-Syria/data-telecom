import { readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  ensurePublicationTextChecksPass,
  readJson,
  sourceImportManifestSchema,
} from './lib/data-schemas.mjs';

const root = process.cwd();
const manifestsDirectory = path.join(root, 'imports/manifests');

async function listManifestFiles() {
  const entries = await readdir(manifestsDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(manifestsDirectory, entry.name))
    .sort();
}

function ensureUniqueValues(values, label, relativePath) {
  const seen = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`${relativePath} contains duplicate ${label}: ${value}`);
    }

    seen.add(value);
  }
}

const manifestFiles = await listManifestFiles();

for (const manifestFile of manifestFiles) {
  const relativePath = path.relative(root, manifestFile).replaceAll('\\', '/');
  const manifest = sourceImportManifestSchema.parse(await readJson(manifestFile));

  ensurePublicationTextChecksPass(manifest, relativePath);
  ensureUniqueValues(manifest.importedFields, 'imported field', relativePath);
  ensureUniqueValues(manifest.targetFiles, 'target file', relativePath);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      files: manifestFiles.map((manifestFile) =>
        path.relative(root, manifestFile).replaceAll('\\', '/'),
      ),
      manifests: manifestFiles.length,
    },
    null,
    2,
  ),
);
