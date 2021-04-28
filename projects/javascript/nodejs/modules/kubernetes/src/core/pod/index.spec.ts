import { expect } from 'chai';

import { podApiV1 } from './';

describe('core/pod', function() {
  describe('getBody()', function() {
    it('extracts the body from a log entry', function() {
      const value = '2020-07-12T20:29:58.5896575Z First Line';
      const results = podApiV1['getBody'](value);
      expect(results).to.eql('First Line');
    });
  });

  describe('getMicroseconds()', function() {
    it('extracts the Unix timestamp from a log entry', function() {
      const value = '2020-07-12T20:29:58.5896575Z First Line';
      const results = podApiV1['getMicroseconds'](value);
      expect(results).to.eql(6575);
    });
  });

  describe('getUnix()', function() {
    it('extracts the Unix timestamp from a log entry', function() {
      const value = '2020-07-12T20:29:58.5896575Z First Line';
      const results = podApiV1['getUnix'](value);
      expect(results).to.eql(1594585798589);
    });
  });

  describe('split()', function() {
    it('properly splits Kubernetes logs into multiple lines', function() {
      const first = '2020-07-12T20:29:58.5896575Z First Line';
      const second = '2020-07-12T20:29:58.5944985Z Second Line';
      const value = `${first}\n${second}\n\n`;

      const results = podApiV1['split'](value);

      expect(results).to.eql([first, second]);
    });
  });
});
