import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const idSchema = z.string().regex(/^sy-[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const sourceStatusSchema = z.enum(['pending_release', 'seed', 'released', 'deprecated']);
export const datasetReleaseStatusSchema = z.enum(['planned', 'seed', 'released', 'deprecated']);
export const datasetReadinessLevelSchema = z.enum([
  'raw_seed',
  'public_directory_ready',
  'api_ready',
]);
export const datasetPublicApiStatusSchema = z.enum(['not_approved', 'approved']);
export const datasetArtifactFormatSchema = z.enum(['json', 'ndjson', 'csv', 'sql', 'yaml', 'xml']);
export const sourceRegistryStatusSchema = z.enum(['approved', 'limited', 'proposed', 'rejected']);

export const localizedTextSchema = z
  .object({
    en: z.string().trim().min(1),
    ar: z.string().trim().min(1).optional(),
  })
  .strict();

export const sourceReferenceSchema = z
  .object({
    sourceId: z.string().trim().min(1),
    sourceRecordId: z.string().trim().min(1).optional(),
    sourceRecordDate: z
      .string()
      .regex(/^[0-9]{4}(?:-[0-9]{2}(?:-[0-9]{2})?)?$/)
      .optional(),
    accessedAt: z.string().datetime(),
  })
  .strict();

export const sourceRecordSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    url: z.string().url(),
    license: z.string().trim().min(1),
    licenseUrl: z.string().url().optional(),
    status: sourceRegistryStatusSchema,
    fields: z.array(z.string().trim().min(1)).min(1),
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export const lengthRangeSchema = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })
  .strict()
  .refine((value) => value.min <= value.max, {
    message: 'min must be less than or equal to max',
  });

const sourcedRecordFields = {
  sourceIds: z.array(z.string().trim().min(1)).min(1),
  sourceReferences: z.array(sourceReferenceSchema).min(1),
  sourceStatus: sourceStatusSchema,
  notes: z.string().trim().min(1).optional(),
};

export const countryNumberingPlanRecordSchema = z
  .object({
    id: idSchema,
    countryCode: z.string().regex(/^[0-9]{1,3}$/),
    countryIso2: z.string().regex(/^[A-Z]{2}$/),
    countryIso3: z.string().regex(/^[A-Z]{3}$/),
    nationalPrefix: z
      .string()
      .regex(/^[0-9]+$/)
      .nullable(),
    internationalPrefix: z
      .string()
      .regex(/^[0-9]+$/)
      .nullable(),
    planScope: z.enum(['fixed_and_mobile']),
    ...sourcedRecordFields,
  })
  .strict();

export const operatorRecordSchema = z
  .object({
    id: idSchema,
    name: localizedTextSchema,
    operatorType: z.enum(['fixed', 'mobile']),
    numberingRole: z.enum(['fixed_operator', 'mobile_operator']),
    assignmentStatus: z.enum(['assigned', 'reserved', 'inactive', 'unknown']),
    ...sourcedRecordFields,
  })
  .strict();

export const fixedAreaCodeRecordSchema = z
  .object({
    id: idSchema,
    name: localizedTextSchema,
    areaCode: z.string().regex(/^[1-9][0-9]$/),
    dialingPrefix: z.string().regex(/^0[1-9][0-9]$/),
    operatorId: idSchema,
    governorateIds: z.array(idSchema).min(1),
    subscriberNumberLength: lengthRangeSchema,
    nationalSignificantNumberLength: lengthRangeSchema,
    ...sourcedRecordFields,
  })
  .strict();

export const mobilePrefixRecordSchema = z
  .object({
    id: idSchema,
    prefix: z.string().regex(/^[1-9][0-9]$/),
    dialingPrefix: z.string().regex(/^0[1-9][0-9]$/),
    operatorId: idSchema,
    subscriberNumberLength: z.number().int().positive(),
    assignmentStatus: z.enum(['assigned', 'reserved', 'inactive', 'unknown']),
    ...sourcedRecordFields,
  })
  .strict();

export const numberRangeRecordSchema = z
  .object({
    id: idSchema,
    name: localizedTextSchema,
    rangeType: z.enum([
      'reserved_mobile_prefix',
      'used_range',
      'unused_range',
      'short_number',
      'private_numbering',
    ]),
    ranges: z.array(z.string().regex(/^[0-9x]+$/)).min(1),
    assignmentStatus: z.enum(['assigned', 'reserved', 'unused', 'used', 'private_numbering']),
    ...sourcedRecordFields,
  })
  .strict();

export const releaseManifestSourceSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    url: z.string().url().optional(),
    license: z.string().trim().min(1),
    accessedAt: z.string().datetime().optional(),
    fields: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const releaseManifestArtifactSchema = z
  .object({
    name: z.string().trim().min(1),
    format: datasetArtifactFormatSchema,
    path: z.string().trim().min(1),
    url: z.string().url().optional(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    sizeBytes: z.number().int().nonnegative(),
    recordCount: z.number().int().nonnegative().optional(),
    mediaType: z.string().trim().min(1).optional(),
  })
  .strict();

export const releaseReadinessCheckSchema = z
  .object({
    name: z.string().trim().min(1),
    status: z.enum(['passed', 'warning', 'blocked']),
    expected: z.union([z.string(), z.number(), z.boolean()]).optional(),
    actual: z.union([z.string(), z.number(), z.boolean()]).optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .strict();

export const releaseReadinessDomainSchema = z
  .object({
    name: z.enum([
      'country_numbering_plans',
      'operators',
      'fixed_area_codes',
      'mobile_prefixes',
      'number_ranges',
    ]),
    status: z.enum(['ready', 'partial', 'empty', 'blocked']),
    recordCount: z.number().int().nonnegative(),
    notes: z.string().trim().min(1),
  })
  .strict();

export const releaseReadinessSchema = z
  .object({
    level: datasetReadinessLevelSchema,
    publicApi: z
      .object({
        status: datasetPublicApiStatusSchema,
        minimumLevel: datasetReadinessLevelSchema,
        reason: z.string().trim().min(1),
      })
      .strict(),
    checks: z.array(releaseReadinessCheckSchema),
    domains: z.array(releaseReadinessDomainSchema),
    blockers: z.array(z.string().trim().min(1)),
  })
  .strict();

export const releaseManifestSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    generatedAt: z.string().datetime(),
    dataset: z
      .object({
        id: z.literal('opensyria-telecom'),
        slug: z.literal('telecom'),
        repository: z.literal('data-telecom'),
        category: z.literal('telecom'),
        title: localizedTextSchema,
      })
      .strict(),
    release: z
      .object({
        version: z.string().trim().min(1),
        status: datasetReleaseStatusSchema,
        publishedAt: z.string().datetime().nullable(),
        notes: z.string().nullable().optional(),
      })
      .strict(),
    artifacts: z.array(releaseManifestArtifactSchema),
    sources: z.array(releaseManifestSourceSchema),
    readiness: releaseReadinessSchema.optional(),
  })
  .strict();

export const sourceImportManifestSchema = z
  .object({
    sourceId: z.string().trim().min(1),
    sourceTitle: z.string().trim().min(1),
    sourceUrl: z.string().url(),
    license: z.string().trim().min(1),
    licenseUrl: z.string().url().optional(),
    accessedAt: z.string().datetime(),
    status: z.enum(['planned', 'imported', 'reviewed', 'rejected', 'superseded']),
    rawFiles: z.array(
      z
        .object({
          name: z.string().trim().min(1),
          sha256: z
            .string()
            .regex(/^[a-f0-9]{64}$/)
            .optional(),
          notes: z.string().trim().min(1).optional(),
        })
        .strict(),
    ),
    importedFields: z.array(z.string().trim().min(1)).min(1),
    targetFiles: z
      .array(
        z.enum([
          'data/country-numbering-plans.json',
          'data/fixed-area-codes.json',
          'data/mobile-prefixes.json',
          'data/number-ranges.json',
          'data/operators.json',
          'data/sources.json',
        ]),
      )
      .min(1),
    transforms: z.array(z.string().trim().min(1)).min(1),
    reviewNotes: z.string().trim().min(1),
  })
  .strict();

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

const publicationTextPatternEnv = 'OPENSYRIA_PUBLICATION_TEXT_PATTERNS';

function publicationTextPatterns() {
  const rawPatterns = process.env[publicationTextPatternEnv];

  if (!rawPatterns?.trim()) {
    return [];
  }

  return rawPatterns
    .split(/\r?\n|,/)
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .map((pattern, index) => {
      try {
        return new RegExp(pattern, 'i');
      } catch {
        throw new Error(`Invalid publication text check pattern at index ${index + 1}`);
      }
    });
}

function collectPublicationTextMatches(value, pathLabel, patterns, matches) {
  if (typeof value === 'string') {
    for (const pattern of patterns) {
      if (pattern.test(value)) {
        matches.push(pathLabel);
        break;
      }
    }

    return;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      collectPublicationTextMatches(item, `${pathLabel}[${index}]`, patterns, matches);
    }

    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      collectPublicationTextMatches(item, `${pathLabel}.${key}`, patterns, matches);
    }
  }
}

export function ensurePublicationTextChecksPass(value, label) {
  const patterns = publicationTextPatterns();

  if (patterns.length === 0) {
    return;
  }

  const matches = [];

  collectPublicationTextMatches(value, label, patterns, matches);

  if (matches.length > 0) {
    throw new Error(
      `Data failed publication text checks:\n${matches
        .map((pathLabel) => `- ${pathLabel}`)
        .join('\n')}`,
    );
  }
}

export function parseJsonArray(schema, value, label) {
  const result = z.array(schema).safeParse(value);

  if (!result.success) {
    throw new Error(
      `${label} failed schema validation: ${JSON.stringify(z.treeifyError(result.error), null, 2)}`,
    );
  }

  return result.data;
}

export function ensureUnique(records, getKey, label) {
  const seen = new Set();

  for (const record of records) {
    const key = getKey(record);

    if (seen.has(key)) {
      throw new Error(`${label} contains duplicate key: ${key}`);
    }

    seen.add(key);
  }
}

export function ensureKnownSources(records, sources, label) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  for (const record of records) {
    const seenSourceIds = new Set();

    for (const sourceId of record.sourceIds) {
      if (seenSourceIds.has(sourceId)) {
        throw new Error(`${label} ${record.id} contains duplicate source ID: ${sourceId}`);
      }

      seenSourceIds.add(sourceId);
      ensureApprovedSource(sourceById, sourceId, `${label} ${record.id}`);
    }

    for (const reference of record.sourceReferences) {
      ensureApprovedSource(sourceById, reference.sourceId, `${label} ${record.id}`);

      if (!seenSourceIds.has(reference.sourceId)) {
        throw new Error(
          `${label} ${record.id} sourceReferences contains source not listed in sourceIds: ${reference.sourceId}`,
        );
      }
    }
  }
}

function ensureApprovedSource(sourceById, sourceId, label) {
  const source = sourceById.get(sourceId);

  if (!source) {
    throw new Error(`${label} references unknown source: ${sourceId}`);
  }

  if (source.status !== 'approved') {
    throw new Error(`${label} references non-approved source: ${sourceId}`);
  }
}

export function ensureSourceReferenceQuality(records, label) {
  for (const record of records) {
    const referenceSourceIds = new Set();

    for (const reference of record.sourceReferences) {
      if (referenceSourceIds.has(reference.sourceId)) {
        throw new Error(
          `${label} ${record.id} contains duplicate source reference: ${reference.sourceId}`,
        );
      }

      referenceSourceIds.add(reference.sourceId);
    }

    for (const sourceId of record.sourceIds) {
      if (!referenceSourceIds.has(sourceId)) {
        throw new Error(
          `${label} ${record.id} sourceIds contains source without sourceReferences entry: ${sourceId}`,
        );
      }
    }
  }
}

export function ensureCountryNumberingPlanQuality(records) {
  ensureUnique(records, (record) => record.countryCode, 'countryNumberingPlans.countryCode');
  ensureSourceReferenceQuality(records, 'countryNumberingPlan');
}

export function ensureOperatorQuality(records) {
  ensureSourceReferenceQuality(records, 'operator');

  for (const record of records) {
    const expectedRole = record.operatorType === 'fixed' ? 'fixed_operator' : 'mobile_operator';

    if (record.numberingRole !== expectedRole) {
      throw new Error(
        `operator ${record.id} has ${record.numberingRole}, expected ${expectedRole}`,
      );
    }
  }
}

export function ensureFixedAreaCodeQuality(records, operators) {
  const operatorById = new Map(operators.map((operator) => [operator.id, operator]));

  ensureSourceReferenceQuality(records, 'fixedAreaCode');

  for (const record of records) {
    const operator = operatorById.get(record.operatorId);

    if (!operator) {
      throw new Error(
        `fixedAreaCode ${record.id} references unknown operator: ${record.operatorId}`,
      );
    }

    if (operator.operatorType !== 'fixed') {
      throw new Error(
        `fixedAreaCode ${record.id} references non-fixed operator: ${record.operatorId}`,
      );
    }

    if (record.dialingPrefix !== `0${record.areaCode}`) {
      throw new Error(
        `fixedAreaCode ${record.id} dialingPrefix must be 0 + areaCode: ${record.dialingPrefix}`,
      );
    }

    ensureRangeMath(
      record.subscriberNumberLength,
      `fixedAreaCode ${record.id}.subscriberNumberLength`,
    );
    ensureRangeMath(
      record.nationalSignificantNumberLength,
      `fixedAreaCode ${record.id}.nationalSignificantNumberLength`,
    );

    const expectedNsnMin = record.areaCode.length + record.subscriberNumberLength.min;
    const expectedNsnMax = record.areaCode.length + record.subscriberNumberLength.max;

    if (
      record.nationalSignificantNumberLength.min !== expectedNsnMin ||
      record.nationalSignificantNumberLength.max !== expectedNsnMax
    ) {
      throw new Error(
        `fixedAreaCode ${record.id} nationalSignificantNumberLength must equal areaCode length plus subscriberNumberLength`,
      );
    }

    ensureUniqueValues(record.governorateIds, `fixedAreaCode ${record.id}.governorateIds`);
  }
}

export function ensureMobilePrefixQuality(records, operators) {
  const operatorById = new Map(operators.map((operator) => [operator.id, operator]));

  ensureSourceReferenceQuality(records, 'mobilePrefix');

  for (const record of records) {
    const operator = operatorById.get(record.operatorId);

    if (!operator) {
      throw new Error(
        `mobilePrefix ${record.id} references unknown operator: ${record.operatorId}`,
      );
    }

    if (operator.operatorType !== 'mobile') {
      throw new Error(
        `mobilePrefix ${record.id} references non-mobile operator: ${record.operatorId}`,
      );
    }

    if (record.dialingPrefix !== `0${record.prefix}`) {
      throw new Error(
        `mobilePrefix ${record.id} dialingPrefix must be 0 + prefix: ${record.dialingPrefix}`,
      );
    }
  }
}

export function ensureNumberRangeQuality(records) {
  ensureSourceReferenceQuality(records, 'numberRange');

  for (const record of records) {
    ensureUniqueValues(record.ranges, `numberRange ${record.id}.ranges`);

    const expectedStatusByType = {
      private_numbering: 'private_numbering',
      reserved_mobile_prefix: 'reserved',
      short_number: 'used',
      unused_range: 'unused',
      used_range: 'used',
    };
    const expectedStatus = expectedStatusByType[record.rangeType];

    if (record.assignmentStatus !== expectedStatus) {
      throw new Error(
        `numberRange ${record.id} has ${record.assignmentStatus}, expected ${expectedStatus}`,
      );
    }
  }
}

function ensureRangeMath(range, label) {
  if (range.min > range.max) {
    throw new Error(`${label} min must be less than or equal to max`);
  }
}

function ensureUniqueValues(values, label) {
  const seen = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`${label} contains duplicate value: ${value}`);
    }

    seen.add(value);
  }
}
