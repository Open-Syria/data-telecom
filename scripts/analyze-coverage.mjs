import { mkdir, writeFile } from 'node:fs/promises';
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
const dataDirectory = path.resolve(root, getCliOption('--data-dir') ?? 'data');
const outputDirectory = path.resolve(root, getCliOption('--out-dir') ?? 'dist/coverage');
const maxItems = Number.parseInt(getCliOption('--max-items') ?? '25', 10);

if (!Number.isInteger(maxItems) || maxItems < 1) {
  throw new Error('--max-items must be a positive integer');
}

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

async function loadData() {
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

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fieldMetric(label, priority, records, hasValue) {
  const missingRecords = records.filter((record) => !hasValue(record));

  return {
    actionableMissing: missingRecords.length,
    actionableMissingRecordIds: ids(missingRecords),
    expected: records.length,
    knownMissing: 0,
    label,
    missing: missingRecords.length,
    percent: percent(records.length - missingRecords.length, records.length),
    present: records.length - missingRecords.length,
    priority,
  };
}

function buildCountryPlanCoverage(data) {
  return {
    fields: {
      countryCode: fieldMetric(
        'Country calling code',
        'high',
        data.countryNumberingPlans,
        (record) => hasText(record.countryCode),
      ),
      nationalPrefix: fieldMetric(
        'National trunk prefix',
        'high',
        data.countryNumberingPlans,
        (record) => hasText(record.nationalPrefix),
      ),
      sourceReferences: fieldMetric(
        'Dated source references',
        'high',
        data.countryNumberingPlans,
        (record) => record.sourceReferences.length > 0,
      ),
    },
    total: data.countryNumberingPlans.length,
  };
}

function buildOperatorCoverage(data) {
  return {
    fields: {
      englishName: fieldMetric('English operator name', 'high', data.operators, (record) =>
        hasText(record.name.en),
      ),
      arabicName: fieldMetric('Arabic operator name', 'low', data.operators, (record) =>
        hasText(record.name.ar),
      ),
      sourceRecordDate: fieldMetric('Source record date', 'medium', data.operators, (record) =>
        record.sourceReferences.some((reference) => reference.sourceRecordDate),
      ),
      sourceReferences: fieldMetric(
        'Dated source references',
        'high',
        data.operators,
        (record) => record.sourceReferences.length > 0,
      ),
    },
    total: data.operators.length,
  };
}

function buildFixedAreaCodeCoverage(data) {
  return {
    fields: {
      governorateIds: fieldMetric(
        'Governorate IDs',
        'high',
        data.fixedAreaCodes,
        (record) => record.governorateIds.length > 0,
      ),
      sourceRecordDate: fieldMetric('Source record date', 'medium', data.fixedAreaCodes, (record) =>
        record.sourceReferences.some((reference) => reference.sourceRecordDate),
      ),
      sourceReferences: fieldMetric(
        'Dated source references',
        'high',
        data.fixedAreaCodes,
        (record) => record.sourceReferences.length > 0,
      ),
      subscriberLength: fieldMetric(
        'Subscriber number length',
        'high',
        data.fixedAreaCodes,
        (record) => record.subscriberNumberLength.min > 0 && record.subscriberNumberLength.max > 0,
      ),
    },
    total: data.fixedAreaCodes.length,
  };
}

function buildMobilePrefixCoverage(data) {
  return {
    fields: {
      operatorId: fieldMetric('Operator ID', 'high', data.mobilePrefixes, (record) =>
        hasText(record.operatorId),
      ),
      sourceRecordDate: fieldMetric('Source record date', 'medium', data.mobilePrefixes, (record) =>
        record.sourceReferences.some((reference) => reference.sourceRecordDate),
      ),
      sourceReferences: fieldMetric(
        'Dated source references',
        'high',
        data.mobilePrefixes,
        (record) => record.sourceReferences.length > 0,
      ),
      subscriberLength: fieldMetric(
        'Subscriber number length',
        'high',
        data.mobilePrefixes,
        (record) => record.subscriberNumberLength > 0,
      ),
    },
    total: data.mobilePrefixes.length,
  };
}

function buildNumberRangeCoverage(data) {
  return {
    fields: {
      rangeValues: fieldMetric(
        'Range values',
        'high',
        data.numberRanges,
        (record) => record.ranges.length > 0,
      ),
      sourceRecordDate: fieldMetric('Source record date', 'medium', data.numberRanges, (record) =>
        record.sourceReferences.some((reference) => reference.sourceRecordDate),
      ),
      sourceReferences: fieldMetric(
        'Dated source references',
        'high',
        data.numberRanges,
        (record) => record.sourceReferences.length > 0,
      ),
    },
    total: data.numberRanges.length,
  };
}

function buildContributionFocus(report) {
  return [
    ...contributionItems('countryNumberingPlans', report.countryNumberingPlans.fields),
    ...contributionItems('operators', report.operators.fields),
    ...contributionItems('fixedAreaCodes', report.fixedAreaCodes.fields),
    ...contributionItems('mobilePrefixes', report.mobilePrefixes.fields),
    ...contributionItems('numberRanges', report.numberRanges.fields),
  ].sort((left, right) => priorityWeight(right.priority) - priorityWeight(left.priority));
}

function contributionItems(area, fields) {
  return Object.entries(fields).flatMap(([fieldId, field]) => {
    if (field.actionableMissing === 0) {
      return [];
    }

    return [
      {
        action: buildFieldAction(field.label),
        area: `${area}.${fieldId}`,
        count: field.actionableMissing,
        priority: field.priority,
        recordIds: field.actionableMissingRecordIds,
        title: `Improve ${field.label.toLowerCase()} coverage`,
      },
    ];
  });
}

function buildFieldAction(label) {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('arabic')) {
    return 'Add Arabic names only when an approved source supports the exact label.';
  }

  if (lowerLabel.includes('governorate')) {
    return 'Link fixed area codes to reviewed OpenSyria geography IDs.';
  }

  return `Add missing ${lowerLabel} values with approved public sources.`;
}

function buildDatasetCounts(data) {
  return {
    countryNumberingPlans: data.countryNumberingPlans.length,
    fixedAreaCodes: data.fixedAreaCodes.length,
    mobilePrefixes: data.mobilePrefixes.length,
    numberRanges: data.numberRanges.length,
    operators: data.operators.length,
    sources: data.sources.length,
  };
}

function buildMarkdown(report) {
  const lines = [
    '# Telecom Coverage Report',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    `Data directory: \`${report.dataDirectory}\``,
    '',
    'This report identifies missing source-backed enrichment. It does not prove real-world numbering completeness.',
    '',
    '## Dataset Summary',
    '',
    markdownTable(
      ['Dataset', 'Records'],
      Object.entries(report.counts).map(([datasetName, count]) => [datasetName, count]),
    ),
    '',
  ];

  for (const [sectionName, section] of [
    ['Country Numbering Plan Coverage', report.countryNumberingPlans],
    ['Operator Coverage', report.operators],
    ['Fixed Area Code Coverage', report.fixedAreaCodes],
    ['Mobile Prefix Coverage', report.mobilePrefixes],
    ['Number Range Coverage', report.numberRanges],
  ]) {
    lines.push(
      `## ${sectionName}`,
      '',
      markdownTable(
        ['Field', 'Expected', 'Present', 'Missing', 'Actionable missing', 'Coverage', 'Examples'],
        Object.values(section.fields).map((field) => [
          field.label,
          field.expected,
          field.present,
          field.missing,
          field.actionableMissing,
          coverageCell(field),
          sampleIds(field.actionableMissingRecordIds),
        ]),
      ),
      '',
    );
  }

  lines.push('## Contribution Focus', '');

  if (report.contributionFocus.length === 0) {
    lines.push('No actionable coverage gaps were detected for the configured checks.', '');
  } else {
    lines.push(
      markdownTable(
        ['Priority', 'Area', 'Missing', 'Action', 'Example records'],
        report.contributionFocus.map((item) => [
          item.priority,
          item.area,
          item.count,
          item.action,
          sampleIds(item.recordIds),
        ]),
      ),
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

function coverageCell(metric) {
  return metric.expected === 0 ? 'n/a' : `${metric.percent}%`;
}

function sampleIds(recordIds) {
  if (recordIds.length === 0) {
    return '-';
  }

  const sampledIds = recordIds.slice(0, maxItems);
  const suffix =
    recordIds.length > sampledIds.length ? `, +${recordIds.length - sampledIds.length}` : '';

  return `${sampledIds.map((id) => `\`${id}\``).join(', ')}${suffix}`;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.map(escapeMarkdownCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(
      (row) => `| ${row.map((value) => escapeMarkdownCell(String(value))).join(' | ')} |`,
    ),
  ].join('\n');
}

function escapeMarkdownCell(value) {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function ids(records) {
  return records.map((record) => record.id).sort((first, second) => first.localeCompare(second));
}

function percent(part, total) {
  if (total === 0) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(2));
}

function priorityWeight(priority) {
  return {
    high: 3,
    low: 1,
    medium: 2,
  }[priority];
}

const data = await loadData();
const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  dataDirectory: path.relative(root, dataDirectory).replaceAll('\\', '/'),
  counts: buildDatasetCounts(data),
  countryNumberingPlans: buildCountryPlanCoverage(data),
  fixedAreaCodes: buildFixedAreaCodeCoverage(data),
  mobilePrefixes: buildMobilePrefixCoverage(data),
  numberRanges: buildNumberRangeCoverage(data),
  operators: buildOperatorCoverage(data),
};

report.contributionFocus = buildContributionFocus(report);

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'coverage-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
await writeFile(path.join(outputDirectory, 'COVERAGE.md'), buildMarkdown(report));

console.log(
  JSON.stringify(
    {
      ok: report.ok,
      counts: report.counts,
      dataDirectory: report.dataDirectory,
      outputDirectory: path.relative(root, outputDirectory).replaceAll('\\', '/'),
      contributionFocusItems: report.contributionFocus.length,
    },
    null,
    2,
  ),
);
