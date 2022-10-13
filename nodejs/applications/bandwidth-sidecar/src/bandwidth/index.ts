import { Parser } from '@tenlastic/pcap';

import * as fs from 'fs';
import * as path from 'path';

const file = process.env.FILE;

/**
 * Reads the PCAP file generated by TCPDump and records the bytes sent.
 */
export async function bandwidth() {
  let previousMicroseconds = 0;
  let previousSeconds = 0;
  let wait = false;

  fs.watch(file, async (event, filename) => {
    if (!filename || wait) {
      return;
    }

    console.log(filename);

    // Debounce multiple events.
    wait = true;
    setTimeout(() => (wait = false), 100);

    let bytes = 0;
    let packets = 0;

    await new Promise<void>((resolve) => {
      const stream = fs.createReadStream(path.join(file, filename));
      const parser = new Parser(stream);
      parser.on('end', resolve);
      parser.on('header', (header) => {
        const { capturedLength, timestampMicroseconds, timestampSeconds } = header;

        if (
          previousSeconds > timestampSeconds ||
          (previousSeconds === timestampSeconds && previousMicroseconds >= timestampMicroseconds)
        ) {
          return;
        }

        bytes += capturedLength;
        packets++;
        previousMicroseconds = timestampMicroseconds;
        previousSeconds = timestampSeconds;
      });
    });

    console.log(`Packets: ${packets} - Bytes: ${bytes}.`);
  });
}