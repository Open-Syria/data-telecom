import path from 'node:path';
import {
  countryNumberingPlanRecordSchema,
  fixedAreaCodeRecordSchema,
  mobilePrefixRecordSchema,
  numberRangeRecordSchema,
  operatorRecordSchema,
  parseJsonArray,
  readJson,
  sourceRecordSchema,
} from './lib/data-schemas.mjs';

const root = process.cwd();

function getDataDirectory() {
  const dataDirArg = process.argv.find((arg) => arg.startsWith('--data-dir='));
  const dataDirIndex = process.argv.indexOf('--data-dir');

  if (!dataDirArg && dataDirIndex !== -1 && process.argv[dataDirIndex + 1] === undefined) {
    throw new Error('--data-dir requires a directory path');
  }

  const dataDirValue =
    dataDirArg?.slice('--data-dir='.length) ??
    (dataDirIndex === -1 ? undefined : process.argv[dataDirIndex + 1]);

  if (dataDirValue === '' || dataDirValue?.startsWith('--')) {
    throw new Error('--data-dir requires a directory path');
  }

  return path.resolve(root, dataDirValue ?? 'data');
}

function countBy(records, getKey) {
  return Object.fromEntries(
    [
      ...records.reduce((counts, record) => {
        const key = getKey(record);

        counts.set(key, (counts.get(key) ?? 0) + 1);

        return counts;
      }, new Map()),
    ].sort(([first], [second]) => first.localeCompare(second)),
  );
}

async function loadData(dataDirectory) {
  return {
    countryNumberingPlans: parseJsonArray(
      countryNumberingPlanRecordSchema,
      await readJson(path.join(dataDirectory, 'country-numbering-plans.json')),
      'countryNumberingPlans',
    ),
    fixedAreaCodes: parseJsonArray(
      fixedAreaCodeRecordSchema,
      await readJson(path.join(dataDirectory, 'fixed-area-codes.json')),
      'fixedAreaCodes',
    ),
    mobilePrefixes: parseJsonArray(
      mobilePrefixRecordSchema,
      await readJson(path.join(dataDirectory, 'mobile-prefixes.json')),
      'mobilePrefixes',
    ),
    numberRanges: parseJsonArray(
      numberRangeRecordSchema,
      await readJson(path.join(dataDirectory, 'number-ranges.json')),
      'numberRanges',
    ),
    operators: parseJsonArray(
      operatorRecordSchema,
      await readJson(path.join(dataDirectory, 'operators.json')),
      'operators',
    ),
    sources: parseJsonArray(
      sourceRecordSchema,
      await readJson(path.join(dataDirectory, 'sources.json')),
      'sources',
    ),
  };
}

function summarizeCountryPlans(records) {
  return {
    count: records.length,
    byPlanScope: countBy(records, (record) => record.planScope),
    withInternationalPrefix: records.filter((record) => Boolean(record.internationalPrefix)).length,
    withNationalPrefix: records.filter((record) => Boolean(record.nationalPrefix)).length,
    withSourceRecordDate: countWithSourceRecordDate(records),
  };
}

function summarizeOperators(records) {
  return {
    count: records.length,
    byAssignmentStatus: countBy(records, (record) => record.assignmentStatus),
    byOperatorType: countBy(records, (record) => record.operatorType),
    bySourceStatus: countBy(records, (record) => record.sourceStatus),
    withArabicName: records.filter((record) => Boolean(record.name.ar)).length,
    withSourceRecordDate: countWithSourceRecordDate(records),
  };
}

function summarizeFixedAreaCodes(records) {
  return {
    count: records.length,
    byAreaCode: countBy(records, (record) => record.areaCode),
    bySubscriberLength: countBy(records, (record) =>
      rangeLabel(record.subscriberNumberLength.min, record.subscriberNumberLength.max),
    ),
    bySourceStatus: countBy(records, (record) => record.sourceStatus),
    governorateLinks: records.reduce((count, record) => count + record.governorateIds.length, 0),
    withGeographyLinks: records.filter((record) =>
      record.sourceIds.includes('opensyria-data-geography'),
    ).length,
    withSourceRecordDate: countWithSourceRecordDate(records),
  };
}

function summarizeMobilePrefixes(records) {
  return {
    count: records.length,
    byAssignmentStatus: countBy(records, (record) => record.assignmentStatus),
    byOperatorId: countBy(records, (record) => record.operatorId),
    bySubscriberLength: countBy(records, (record) => String(record.subscriberNumberLength)),
    bySourceStatus: countBy(records, (record) => record.sourceStatus),
    withSourceRecordDate: countWithSourceRecordDate(records),
  };
}

function summarizeNumberRanges(records) {
  return {
    count: records.length,
    byAssignmentStatus: countBy(records, (record) => record.assignmentStatus),
    byRangeType: countBy(records, (record) => record.rangeType),
    rangeValues: records.reduce((count, record) => count + record.ranges.length, 0),
    withSourceRecordDate: countWithSourceRecordDate(records),
  };
}

function countWithSourceRecordDate(records) {
  return records.filter((record) =>
    record.sourceReferences.some((reference) => reference.sourceRecordDate),
  ).length;
}

function rangeLabel(min, max) {
  return min === max ? String(min) : `${min}-${max}`;
}

const dataDirectory = getDataDirectory();
const data = await loadData(dataDirectory);

console.log(
  JSON.stringify(
    {
      ok: true,
      dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/'),
      sources: {
        byLicense: countBy(data.sources, (source) => source.license),
        byStatus: countBy(data.sources, (source) => source.status),
        count: data.sources.length,
      },
      countryNumberingPlans: summarizeCountryPlans(data.countryNumberingPlans),
      fixedAreaCodes: summarizeFixedAreaCodes(data.fixedAreaCodes),
      mobilePrefixes: summarizeMobilePrefixes(data.mobilePrefixes),
      numberRanges: summarizeNumberRanges(data.numberRanges),
      operators: summarizeOperators(data.operators),
    },
    null,
    2,
  ),
);
