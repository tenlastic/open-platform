import * as child_process from 'child_process';

describe('index', function () {
  it('does the thing', async function () {
    const child = child_process.spawn('tcpdump', ['-l', '-nn', '-t', '-Z', 'nobody']);

    child.on('close', () => {
      console.log('closed');
    });

    child.stderr.on('data', (data: string) => data.split('\n').forEach((l) => console.log(l)));
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (data: string) => {
      let bytes = 0;
      const regex = new RegExp('length ([0-9]+)', 'g');
      const matches = [...data.matchAll(regex)];

      for (const match of matches) {
        bytes += parseInt(match[1], 10);
      }

      console.log(`Bytes: ${bytes}.`);
    });
    child.stdout.setEncoding('utf8');

    await new Promise((res) => setTimeout(res, 60 * 1000));
  });
});
