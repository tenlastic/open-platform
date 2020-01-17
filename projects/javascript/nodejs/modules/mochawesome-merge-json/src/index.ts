import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import { argv } from 'yargs';

import { merge } from './merge';

const output = (argv.output as string) || 'mochawesome.json';
const pattern = argv.pattern as string;

// Merge all mochawesome JSON files.
const result = merge(pattern);

if (result) {
  // Create the directory if it does not exist.
  const dirname = path.dirname(output);
  mkdirp.sync(dirname);

  // Write the results to a JSON file.
  fs.writeFileSync(output, JSON.stringify(result));
}
