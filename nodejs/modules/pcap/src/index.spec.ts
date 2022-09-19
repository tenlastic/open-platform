import { expect } from 'chai';
import * as fs from 'fs';

import { PacketHeader, Parser } from './';

describe('index', function () {
  it('parses TCP files', async function () {
    const stream = fs.createReadStream('./fixtures/tcp.pcap');

    const header = await new Promise<PacketHeader>((resolve) => {
      const parser = new Parser(stream);
      parser.on('header', resolve);
    });

    expect(header.capturedLength).to.eql(66);
    expect(header.originalLength).to.eql(66);
    expect(header.timestampMicroseconds).to.eql(242339);
    expect(header.timestampSeconds).to.eql(1413578829);
  });

  it('parses UDP files', async function () {
    const stream = fs.createReadStream('./fixtures/udp.pcap');

    const header = await new Promise<PacketHeader>((resolve) => {
      const parser = new Parser(stream);
      parser.on('header', resolve);
    });

    expect(header.capturedLength).to.eql(87);
    expect(header.originalLength).to.eql(87);
    expect(header.timestampMicroseconds).to.eql(113945);
    expect(header.timestampSeconds).to.eql(1413589518);
  });
});
