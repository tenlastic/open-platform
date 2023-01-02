import { expect } from 'chai';
import * as mock from 'mock-fs';

import { merge } from './';

describe('merge', function () {
  beforeEach(function () {
    mock({
      './mochawesome/mochawesome.json': JSON.stringify({
        stats: {
          suites: 1,
          tests: 2,
          passes: 2,
          pending: 0,
          failures: 0,
          start: '2018-12-21T17:41:49.071Z',
          end: '2018-12-21T17:42:36.693Z',
          duration: 100,
          testsRegistered: 2,
          passPercent: 100,
          pendingPercent: 0,
          other: 0,
          hasOther: false,
          skipped: 0,
          hasSkipped: false,
        },
        results: [
          {
            uuid: 'a559f8cb-bec0-4001-a028-ed77d8fb77bf',
            title: 'Suite 0',
            fullFile: '',
            file: '',
            beforeHooks: [],
            afterHooks: [],
            tests: [
              {
                title: 'Test 1',
                fullTitle: 'Test 1',
                duration: 100,
                state: 'passed',
                speed: 'slow',
                pass: true,
                fail: false,
                pending: false,
                code: 'assert(true === true)',
                err: {},
                isRoot: false,
                uuid: '00a557e2-f97e-46ac-81ac-d2e7a2561f34',
                isHook: false,
                skipped: false,
              },
              {
                title: 'Test 2',
                fullTitle: 'Test 2',
                duration: 100,
                state: 'passed',
                speed: 'slow',
                pass: true,
                fail: false,
                pending: false,
                code: 'assert(false === false)\n assert(1 === 1)',
                err: {},
                isRoot: false,
                uuid: '784f5d05-2717-4e21-a5b6-9e56685918d6',
                isHook: false,
                skipped: false,
              },
            ],
            suites: [],
            passes: [
              '00a557e2-f97e-46ac-81ac-d2e7a2561f34',
              '784f5d05-2717-4e21-a5b6-9e56685918d6',
            ],
            failures: [],
            pending: [],
            skipped: [],
            duration: 200,
            root: false,
            rootEmpty: false,
            _timeout: 2000,
          },
        ],
      }),
      './mochawesome/mochawesome-1.json': JSON.stringify({
        stats: {
          suites: 1,
          tests: 1,
          passes: 0,
          pending: 0,
          failures: 1,
          start: '2018-12-21T17:41:49.071Z',
          end: '2018-12-21T17:42:36.693Z',
          duration: 100,
          testsRegistered: 1,
          passPercent: 0,
          pendingPercent: 0,
          other: 0,
          hasOther: false,
          skipped: 0,
          hasSkipped: false,
        },
        results: [
          {
            uuid: 'b527abbe-ae4e-4f8d-a847-14ded62c3f87',
            title: 'Suite 1',
            fullFile: '',
            file: '',
            beforeHooks: [],
            afterHooks: [],
            tests: [
              {
                title: 'Test 1',
                fullTitle: 'Test 1',
                duration: 100,
                state: 'failed',
                speed: 'slow',
                pass: false,
                fail: true,
                pending: false,
                code: 'assert(true === false)',
                err: {},
                isRoot: false,
                uuid: 'adb6842f-f468-4b4d-a1b9-ce6027b65ebc',
                isHook: false,
                skipped: false,
              },
            ],
            suites: [],
            passes: [],
            failures: ['adb6842f-f468-4b4d-a1b9-ce6027b65ebc'],
            pending: [],
            skipped: [],
            duration: 100,
            root: false,
            rootEmpty: false,
            _timeout: 2000,
          },
        ],
      }),
    });
  });

  afterEach(function () {
    mock.restore();
  });

  it('merges JSON files', function () {
    const report = merge('./mochawesome/*.json');

    expect(report.stats.end).to.be.a('string');
    expect(report.stats.start).to.be.a('string');
    expect(report.results.length).to.eql(2);

    expect(report.results[0].tests.length).to.eql(1);
    expect(report.results[0].passes.length).to.eql(0);
    expect(report.results[0].failures.length).to.eql(1);

    expect(report.results[1].tests.length).to.eql(2);
    expect(report.results[1].passes.length).to.eql(2);
    expect(report.results[1].failures.length).to.eql(0);
  });
});
