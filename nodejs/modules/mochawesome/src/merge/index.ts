import * as fs from 'fs';
import * as glob from 'glob';

const collectReportSuites = flatMap((report) => report.results.filter((r) => r !== false));
const getAllTests = flatMap((suite) => [...suite.tests, ...getAllTests(suite.suites)]);

export function merge(pattern = 'mochawesome.json') {
  const reports = collectReportFiles(pattern);

  if (reports.length === 0) {
    return;
  }

  const results = collectReportSuites(reports);
  const stats = generateStats(results);

  return { meta: reports[0].meta, results, stats };
}

function collectReportFiles(pattern: string) {
  const files = glob.sync(pattern);

  return files.map((file) => {
    const data = fs.readFileSync(file).toString();
    return JSON.parse(data);
  });
}

function flatMap(fn) {
  return (items) => flatten(items.map(fn));
}

function flatten(items) {
  return items.reduce((acc, arr) => [...acc, ...arr], []);
}

function generateStats(suites) {
  const tests = getAllTests(suites);
  const passes = tests.filter((test) => test.pass);
  const pending = tests.filter((test) => test.pending);
  const failures = tests.filter((test) => test.fail);
  const skipped = tests.filter((test) => test.skipped);

  return {
    duration: tests.map((test) => test.duration).reduce((a, b) => a + b, 0),
    end: new Date().toISOString(),
    failures: failures.length,
    hasOther: false,
    hasSkipped: !!skipped.length,
    other: 0,
    passPercent: (passes.length * 100) / tests.length,
    passes: passes.length,
    pending: pending.length,
    pendingPercent: (pending.length * 100) / tests.length,
    skipped: skipped.length,
    start: new Date().toISOString(),
    suites: suites.length,
    tests: tests.length,
    testsRegistered: tests.length,
  };
}
