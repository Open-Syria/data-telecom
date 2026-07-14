import path from 'node:path';
import {
  countryNumberingPlanRecordSchema,
  ensureCountryNumberingPlanQuality,
  ensureFixedAreaCodeQuality,
  ensureKnownSources,
  ensureMobilePrefixQuality,
  ensureNumberRangeQuality,
  ensureOperatorQuality,
  ensurePublicationTextChecksPass,
  ensureUnique,
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

async function loadData(dataDirectory) {
  const sources = parseJsonArray(
    sourceRecordSchema,
    await readJson(path.join(dataDirectory, 'sources.json')),
    'sources',
  );
  const countryNumberingPlans = parseJsonArray(
    countryNumberingPlanRecordSchema,
    await readJson(path.join(dataDirectory, 'country-numbering-plans.json')),
    'countryNumberingPlans',
  );
  const operators = parseJsonArray(
    operatorRecordSchema,
    await readJson(path.join(dataDirectory, 'operators.json')),
    'operators',
  );
  const fixedAreaCodes = parseJsonArray(
    fixedAreaCodeRecordSchema,
    await readJson(path.join(dataDirectory, 'fixed-area-codes.json')),
    'fixedAreaCodes',
  );
  const mobilePrefixes = parseJsonArray(
    mobilePrefixRecordSchema,
    await readJson(path.join(dataDirectory, 'mobile-prefixes.json')),
    'mobilePrefixes',
  );
  const numberRanges = parseJsonArray(
    numberRangeRecordSchema,
    await readJson(path.join(dataDirectory, 'number-ranges.json')),
    'numberRanges',
  );

  return {
    countryNumberingPlans,
    fixedAreaCodes,
    mobilePrefixes,
    numberRanges,
    operators,
    sources,
  };
}

function validateData(data) {
  ensurePublicationTextChecksPass(data, 'data');
  ensureUnique(data.sources, (source) => source.id, 'sources');
  ensureUnique(data.countryNumberingPlans, (record) => record.id, 'countryNumberingPlans');
  ensureUnique(data.operators, (record) => record.id, 'operators');
  ensureUnique(data.fixedAreaCodes, (record) => record.id, 'fixedAreaCodes');
  ensureUnique(data.fixedAreaCodes, (record) => record.areaCode, 'fixedAreaCodes.areaCode');
  ensureUnique(
    data.fixedAreaCodes,
    (record) => record.dialingPrefix,
    'fixedAreaCodes.dialingPrefix',
  );
  ensureUnique(data.mobilePrefixes, (record) => record.id, 'mobilePrefixes');
  ensureUnique(data.mobilePrefixes, (record) => record.prefix, 'mobilePrefixes.prefix');
  ensureUnique(
    data.mobilePrefixes,
    (record) => record.dialingPrefix,
    'mobilePrefixes.dialingPrefix',
  );
  ensureUnique(data.numberRanges, (record) => record.id, 'numberRanges');
  ensureKnownSources(data.countryNumberingPlans, data.sources, 'countryNumberingPlan');
  ensureKnownSources(data.operators, data.sources, 'operator');
  ensureKnownSources(data.fixedAreaCodes, data.sources, 'fixedAreaCode');
  ensureKnownSources(data.mobilePrefixes, data.sources, 'mobilePrefix');
  ensureKnownSources(data.numberRanges, data.sources, 'numberRange');
  ensureCountryNumberingPlanQuality(data.countryNumberingPlans);
  ensureOperatorQuality(data.operators);
  ensureFixedAreaCodeQuality(data.fixedAreaCodes, data.operators);
  ensureMobilePrefixQuality(data.mobilePrefixes, data.operators);
  ensureNumberRangeQuality(data.numberRanges);
}

const dataDirectory = getDataDirectory();
const data = await loadData(dataDirectory);

validateData(data);

console.log(
  JSON.stringify(
    {
      ok: true,
      dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/'),
      counts: {
        countryNumberingPlans: data.countryNumberingPlans.length,
        fixedAreaCodes: data.fixedAreaCodes.length,
        mobilePrefixes: data.mobilePrefixes.length,
        numberRanges: data.numberRanges.length,
        operators: data.operators.length,
        sources: data.sources.length,
      },
    },
    null,
    2,
  ),
);
