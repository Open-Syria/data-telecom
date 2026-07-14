import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  countryNumberingPlanRecordSchema,
  datasetReleaseStatusSchema,
  fixedAreaCodeRecordSchema,
  mobilePrefixRecordSchema,
  numberRangeRecordSchema,
  operatorRecordSchema,
  parseJsonArray,
  readJson,
  releaseManifestSchema,
  sourceRecordSchema,
} from './lib/data-schemas.mjs';

const root = process.cwd();
const dataDirectory = path.resolve(root, getCliOption('--data-dir') ?? 'data');
const releaseDirectory = path.resolve(root, getCliOption('--release-dir') ?? 'dist/release');
const packageJson = await readJson(path.join(root, 'package.json'));
const releaseVersion = process.env.RELEASE_VERSION ?? `v${packageJson.version}`;
const releaseStatus = datasetReleaseStatusSchema.parse(process.env.RELEASE_STATUS ?? 'released');
const releasePublishedAt = process.env.RELEASE_PUBLISHED_AT ?? null;
const assetBaseUrl = process.env.RELEASE_ASSET_BASE_URL;

const datasetConfigs = [
  {
    columns: [
      'id',
      'country_code',
      'country_iso2',
      'country_iso3',
      'national_prefix',
      'international_prefix',
      'plan_scope',
      'source_ids_json',
      'source_references_json',
      'latest_source_accessed_at',
      'latest_source_record_date',
      'source_status',
      'notes',
    ],
    fileName: 'country-numbering-plans.json',
    name: 'country-numbering-plans',
    schema: countryNumberingPlanRecordSchema,
    tableName: 'telecom_country_numbering_plans',
    toFlatRow: toCountryNumberingPlanFlatRow,
    toPublicRecord: toIdentityPublicRecord,
  },
  {
    columns: [
      'id',
      'name_en',
      'name_ar',
      'operator_type',
      'numbering_role',
      'assignment_status',
      'source_ids_json',
      'source_references_json',
      'latest_source_accessed_at',
      'latest_source_record_date',
      'source_status',
      'notes',
    ],
    fileName: 'operators.json',
    name: 'operators',
    schema: operatorRecordSchema,
    tableName: 'telecom_operators',
    toFlatRow: toOperatorFlatRow,
    toPublicRecord: toIdentityPublicRecord,
  },
  {
    columns: [
      'id',
      'name_en',
      'name_ar',
      'area_code',
      'dialing_prefix',
      'operator_id',
      'governorate_ids_json',
      'subscriber_number_length_min',
      'subscriber_number_length_max',
      'national_significant_number_length_min',
      'national_significant_number_length_max',
      'source_ids_json',
      'source_references_json',
      'latest_source_accessed_at',
      'latest_source_record_date',
      'source_status',
      'notes',
    ],
    fileName: 'fixed-area-codes.json',
    name: 'fixed-area-codes',
    schema: fixedAreaCodeRecordSchema,
    tableName: 'telecom_fixed_area_codes',
    toFlatRow: toFixedAreaCodeFlatRow,
    toPublicRecord: toIdentityPublicRecord,
  },
  {
    columns: [
      'id',
      'prefix',
      'dialing_prefix',
      'operator_id',
      'subscriber_number_length',
      'assignment_status',
      'source_ids_json',
      'source_references_json',
      'latest_source_accessed_at',
      'latest_source_record_date',
      'source_status',
      'notes',
    ],
    fileName: 'mobile-prefixes.json',
    name: 'mobile-prefixes',
    schema: mobilePrefixRecordSchema,
    tableName: 'telecom_mobile_prefixes',
    toFlatRow: toMobilePrefixFlatRow,
    toPublicRecord: toIdentityPublicRecord,
  },
  {
    columns: [
      'id',
      'name_en',
      'name_ar',
      'range_type',
      'ranges_json',
      'assignment_status',
      'source_ids_json',
      'source_references_json',
      'latest_source_accessed_at',
      'latest_source_record_date',
      'source_status',
      'notes',
    ],
    fileName: 'number-ranges.json',
    name: 'number-ranges',
    schema: numberRangeRecordSchema,
    tableName: 'telecom_number_ranges',
    toFlatRow: toNumberRangeFlatRow,
    toPublicRecord: toIdentityPublicRecord,
  },
];

const artifactFormats = [
  {
    extension: 'json',
    format: 'json',
    mediaType: 'application/json',
    serialize: ({ records }) => stringifyJson({ items: records }),
  },
  {
    extension: 'ndjson',
    format: 'ndjson',
    mediaType: 'application/x-ndjson',
    serialize: ({ records }) => records.map((record) => stringifyCompactJson(record)).join('\n'),
  },
  {
    extension: 'csv',
    format: 'csv',
    mediaType: 'text/csv',
    serialize: ({ columns, rows }) => serializeCsv(columns, rows),
  },
  {
    extension: 'sql',
    format: 'sql',
    mediaType: 'application/sql',
    serialize: ({ columns, rows, tableName }) => serializeSql(tableName, columns, rows),
  },
  {
    extension: 'yaml',
    format: 'yaml',
    mediaType: 'application/yaml',
    serialize: ({ records }) => serializeYaml({ items: records }),
  },
  {
    extension: 'xml',
    format: 'xml',
    mediaType: 'application/xml',
    serialize: ({ name, records }) => serializeXml(name, records),
  },
];

function getCliOption(name) {
  const equalArg = process.argv.find((arg) => arg.startsWith(`${name}=`));
  const optionIndex = process.argv.indexOf(name);

  if (!equalArg && optionIndex !== -1 && process.argv[optionIndex + 1] === undefined) {
    throw new Error(`${name} requires a value`);
  }

  const value =
    equalArg?.slice(`${name}=`.length) ??
    (optionIndex === -1 ? undefined : process.argv[optionIndex + 1]);

  if (value === '' || value?.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }

  return value;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function getArtifactUrl(relativePath) {
  if (!assetBaseUrl) {
    return undefined;
  }

  return `${assetBaseUrl.replace(/\/$/, '')}/${path.posix.basename(relativePath)}`;
}

function escapeNonAscii(value) {
  return value.replace(
    /[\u007f-\uffff]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

function stringifyJson(data) {
  return escapeNonAscii(JSON.stringify(data, null, 2));
}

function stringifyCompactJson(data) {
  return escapeNonAscii(JSON.stringify(data));
}

function removeUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );
}

function toIdentityPublicRecord(record) {
  return removeUndefined(record);
}

function sourceColumns(record) {
  return {
    latest_source_accessed_at: latestSourceAccessedAt(record),
    latest_source_record_date: latestSourceRecordDate(record),
    notes: record.notes ?? null,
    source_ids_json: stringifyCompactJson(record.sourceIds),
    source_references_json: stringifyCompactJson(record.sourceReferences),
    source_status: record.sourceStatus,
  };
}

function toCountryNumberingPlanFlatRow(record) {
  return {
    country_code: record.countryCode,
    country_iso2: record.countryIso2,
    country_iso3: record.countryIso3,
    id: record.id,
    international_prefix: record.internationalPrefix,
    national_prefix: record.nationalPrefix,
    plan_scope: record.planScope,
    ...sourceColumns(record),
  };
}

function toOperatorFlatRow(record) {
  return {
    assignment_status: record.assignmentStatus,
    id: record.id,
    name_ar: record.name.ar ?? null,
    name_en: record.name.en,
    numbering_role: record.numberingRole,
    operator_type: record.operatorType,
    ...sourceColumns(record),
  };
}

function toFixedAreaCodeFlatRow(record) {
  return {
    area_code: record.areaCode,
    dialing_prefix: record.dialingPrefix,
    governorate_ids_json: stringifyCompactJson(record.governorateIds),
    id: record.id,
    name_ar: record.name.ar ?? null,
    name_en: record.name.en,
    national_significant_number_length_max: record.nationalSignificantNumberLength.max,
    national_significant_number_length_min: record.nationalSignificantNumberLength.min,
    operator_id: record.operatorId,
    subscriber_number_length_max: record.subscriberNumberLength.max,
    subscriber_number_length_min: record.subscriberNumberLength.min,
    ...sourceColumns(record),
  };
}

function toMobilePrefixFlatRow(record) {
  return {
    assignment_status: record.assignmentStatus,
    dialing_prefix: record.dialingPrefix,
    id: record.id,
    operator_id: record.operatorId,
    prefix: record.prefix,
    subscriber_number_length: record.subscriberNumberLength,
    ...sourceColumns(record),
  };
}

function toNumberRangeFlatRow(record) {
  return {
    assignment_status: record.assignmentStatus,
    id: record.id,
    name_ar: record.name.ar ?? null,
    name_en: record.name.en,
    range_type: record.rangeType,
    ranges_json: stringifyCompactJson(record.ranges),
    ...sourceColumns(record),
  };
}

function latestSourceAccessedAt(record) {
  return latestStringValue(record.sourceReferences.map((reference) => reference.accessedAt));
}

function latestSourceRecordDate(record) {
  return latestStringValue(
    record.sourceReferences
      .map((reference) => reference.sourceRecordDate)
      .filter((value) => value !== undefined),
  );
}

function latestStringValue(values) {
  if (values.length === 0) {
    return null;
  }

  return values.toSorted().at(-1);
}

function formatTextArtifact(content) {
  if (content.length === 0) {
    return Buffer.from('\n');
  }

  return Buffer.from(`${content}\n`);
}

async function writeArtifact(relativePath, content) {
  const buffer = formatTextArtifact(content);
  const filePath = path.join(releaseDirectory, relativePath);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  return buffer;
}

async function writeJson(filePath, data) {
  const buffer = Buffer.from(`${stringifyJson(data)}\n`);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  return buffer;
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = escapeNonAscii(String(value));

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function serializeCsv(columns, rows) {
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n');
}

function sqlIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return `'${escapeNonAscii(String(value)).replaceAll("'", "''")}'`;
}

function sqlColumnType(column) {
  if (/_length(?:_min|_max)?$/.test(column)) {
    return 'INTEGER';
  }

  return 'TEXT';
}

function serializeSql(tableName, columns, rows) {
  const createTable = [
    `CREATE TABLE IF NOT EXISTS ${sqlIdentifier(tableName)} (`,
    columns
      .map((column, index) => {
        const suffix = index === columns.length - 1 ? '' : ',';
        const primaryKey = column === 'id' ? ' PRIMARY KEY' : '';

        return `  ${sqlIdentifier(column)} ${sqlColumnType(column)}${primaryKey}${suffix}`;
      })
      .join('\n'),
    ');',
  ].join('\n');

  const inserts = rows.map((row) => {
    const identifiers = columns.map(sqlIdentifier).join(', ');
    const values = columns.map((column) => sqlValue(row[column])).join(', ');

    return `INSERT INTO ${sqlIdentifier(tableName)} (${identifiers}) VALUES (${values});`;
  });

  return [createTable, ...inserts].join('\n');
}

function yamlScalar(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return escapeNonAscii(JSON.stringify(String(value)));
}

function serializeYamlValue(value, indentation = 0) {
  const indent = ' '.repeat(indentation);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          return `${indent}- ${serializeYamlValue(item, indentation + 2).trimStart()}`;
        }

        return `${indent}- ${yamlScalar(item)}`;
      })
      .join('\n');
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return '{}';
    }

    return entries
      .map(([key, entryValue]) => {
        if (entryValue && typeof entryValue === 'object') {
          const serializedValue = serializeYamlValue(entryValue, indentation + 2);

          if (serializedValue === '[]' || serializedValue === '{}') {
            return `${indent}${key}: ${serializedValue}`;
          }

          return `${indent}${key}:\n${serializedValue}`;
        }

        return `${indent}${key}: ${yamlScalar(entryValue)}`;
      })
      .join('\n');
  }

  return yamlScalar(value);
}

function serializeYaml(value) {
  return serializeYamlValue(value);
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replace(
      /[\u007f-\uffff]/g,
      (character) => `&#x${character.charCodeAt(0).toString(16).padStart(4, '0')};`,
    );
}

function serializeXmlElement(name, value, indentation = 0) {
  const indent = ' '.repeat(indentation);

  if (value === null || value === undefined) {
    return `${indent}<${name} />`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}<${name} />`;
    }

    return [
      `${indent}<${name}>`,
      ...value.map((item) => serializeXmlElement('item', item, indentation + 2)),
      `${indent}</${name}>`,
    ].join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return `${indent}<${name} />`;
    }

    return [
      `${indent}<${name}>`,
      ...entries.map(([key, entryValue]) => serializeXmlElement(key, entryValue, indentation + 2)),
      `${indent}</${name}>`,
    ].join('\n');
  }

  return `${indent}<${name}>${xmlEscape(value)}</${name}>`;
}

function serializeXml(name, records) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<dataset name="${xmlEscape(name)}">`,
    serializeXmlElement('items', records, 2),
    '</dataset>',
  ].join('\n');
}

async function loadDataset(config) {
  return parseJsonArray(
    config.schema,
    await readJson(path.join(dataDirectory, config.fileName)),
    config.name,
  );
}

const datasetRecordsByName = new Map();

async function buildDatasetArtifacts(config) {
  const sourceRecords = await loadDataset(config);
  datasetRecordsByName.set(config.name, sourceRecords);

  const records = sourceRecords.map(config.toPublicRecord);
  const rows = records.map(config.toFlatRow);
  const artifacts = [];

  for (const artifactFormat of artifactFormats) {
    const fileName = `${config.name}.${artifactFormat.extension}`;
    const relativePath = path.posix.join('artifacts', fileName);
    const content = artifactFormat.serialize({
      columns: config.columns,
      name: config.name,
      records,
      rows,
      tableName: config.tableName,
    });
    const buffer = await writeArtifact(relativePath, content);
    const url = getArtifactUrl(relativePath);

    artifacts.push({
      format: artifactFormat.format,
      mediaType: artifactFormat.mediaType,
      name: config.name,
      path: relativePath,
      recordCount: records.length,
      sha256: sha256(buffer),
      sizeBytes: buffer.byteLength,
      ...(url ? { url } : {}),
    });
  }

  return artifacts;
}

function buildReleaseReadiness() {
  const countryNumberingPlans = datasetRecordsByName.get('country-numbering-plans') ?? [];
  const operators = datasetRecordsByName.get('operators') ?? [];
  const fixedAreaCodes = datasetRecordsByName.get('fixed-area-codes') ?? [];
  const mobilePrefixes = datasetRecordsByName.get('mobile-prefixes') ?? [];
  const numberRanges = datasetRecordsByName.get('number-ranges') ?? [];
  const allRecords = [
    ...countryNumberingPlans,
    ...operators,
    ...fixedAreaCodes,
    ...mobilePrefixes,
    ...numberRanges,
  ];
  const fixedOperatorIds = new Set(
    operators.filter((record) => record.operatorType === 'fixed').map((record) => record.id),
  );
  const mobileOperatorIds = new Set(
    operators.filter((record) => record.operatorType === 'mobile').map((record) => record.id),
  );
  const recordsWithCompleteReferences = allRecords.filter(
    (record) => record.sourceReferences.length === record.sourceIds.length,
  ).length;
  const fixedOperatorReferences = fixedAreaCodes.filter((record) =>
    fixedOperatorIds.has(record.operatorId),
  ).length;
  const mobileOperatorReferences = mobilePrefixes.filter((record) =>
    mobileOperatorIds.has(record.operatorId),
  ).length;
  const hardRequirementsPassed =
    countryNumberingPlans.length > 0 &&
    operators.length > 0 &&
    fixedAreaCodes.length > 0 &&
    mobilePrefixes.length > 0 &&
    numberRanges.length > 0 &&
    recordsWithCompleteReferences === allRecords.length &&
    fixedOperatorReferences === fixedAreaCodes.length &&
    mobileOperatorReferences === mobilePrefixes.length;

  return {
    blockers: hardRequirementsPassed ? [] : ['telecom_seed_empty_or_incomplete'],
    checks: [
      {
        actual: countryNumberingPlans.length,
        expected: 'one or more country numbering-plan records',
        name: 'country_numbering_plan_count',
        status: countryNumberingPlans.length > 0 ? 'passed' : 'blocked',
      },
      {
        actual: operators.length,
        expected: 'one or more reviewed operator records',
        name: 'operator_count',
        status: operators.length > 0 ? 'passed' : 'blocked',
      },
      {
        actual: fixedAreaCodes.length,
        expected: 'one or more reviewed fixed area-code records',
        name: 'fixed_area_code_count',
        status: fixedAreaCodes.length > 0 ? 'passed' : 'blocked',
      },
      {
        actual: mobilePrefixes.length,
        expected: 'one or more reviewed mobile prefix records',
        name: 'mobile_prefix_count',
        status: mobilePrefixes.length > 0 ? 'passed' : 'blocked',
      },
      {
        actual: numberRanges.length,
        expected: 'one or more reviewed non-standard range records',
        name: 'number_range_count',
        status: numberRanges.length > 0 ? 'passed' : 'blocked',
      },
      {
        actual: recordsWithCompleteReferences,
        expected: allRecords.length,
        name: 'complete_source_references',
        status: recordsWithCompleteReferences === allRecords.length ? 'passed' : 'blocked',
      },
      {
        actual: fixedOperatorReferences,
        expected: fixedAreaCodes.length,
        name: 'fixed_operator_references',
        status: fixedOperatorReferences === fixedAreaCodes.length ? 'passed' : 'blocked',
      },
      {
        actual: mobileOperatorReferences,
        expected: mobilePrefixes.length,
        name: 'mobile_operator_references',
        status: mobileOperatorReferences === mobilePrefixes.length ? 'passed' : 'blocked',
      },
    ],
    domains: [
      domainReadiness('country_numbering_plans', countryNumberingPlans.length),
      domainReadiness('operators', operators.length),
      domainReadiness('fixed_area_codes', fixedAreaCodes.length),
      domainReadiness('mobile_prefixes', mobilePrefixes.length),
      domainReadiness('number_ranges', numberRanges.length),
    ],
    level: hardRequirementsPassed ? 'public_directory_ready' : 'raw_seed',
    publicApi: {
      minimumLevel: 'api_ready',
      reason:
        'Release artifacts are ready, but datasets-api does not expose telecom endpoints yet.',
      status: 'not_approved',
    },
  };
}

function domainReadiness(name, recordCount) {
  return {
    name,
    notes:
      recordCount > 0
        ? 'Reviewed source-backed records are present for this domain.'
        : 'No reviewed source-backed records are present for this domain.',
    recordCount,
    status: recordCount > 0 ? 'ready' : 'empty',
  };
}

const sources = parseJsonArray(
  sourceRecordSchema,
  await readJson(path.join(dataDirectory, 'sources.json')),
  'sources',
);
const approvedSources = sources.filter((source) => source.status === 'approved');
const artifacts = [];

for (const config of datasetConfigs) {
  artifacts.push(...(await buildDatasetArtifacts(config)));
}

const manifest = {
  artifacts,
  dataset: {
    category: 'telecom',
    id: 'opensyria-telecom',
    repository: 'data-telecom',
    slug: 'telecom',
    title: {
      en: 'Telecom Numbering',
    },
  },
  generatedAt: new Date().toISOString(),
  readiness: buildReleaseReadiness(),
  release: {
    notes: 'Generated telecom numbering release artifacts.',
    publishedAt: releasePublishedAt,
    status: releaseStatus,
    version: releaseVersion,
  },
  schemaVersion: '1.0',
  sources: approvedSources.map((source) => ({
    fields: source.fields,
    id: source.id,
    license: source.license,
    title: source.title,
    url: source.url,
  })),
};

releaseManifestSchema.parse(manifest);

await writeJson(path.join(releaseDirectory, 'release-manifest.json'), manifest);

console.log(
  JSON.stringify(
    {
      ok: true,
      artifacts: manifest.artifacts,
      dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/'),
      releaseDirectory,
    },
    null,
    2,
  ),
);
