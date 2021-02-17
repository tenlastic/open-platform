import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface LocalFile {
  md5: string;
  path: string;
}

export async function getLocalFiles(absoluteDirectory: string) {
  const paths = getAllFiles(absoluteDirectory);

  const files: LocalFile[] = [];
  for (const p of paths) {
    const stream = fs.createReadStream(p);
    const md5 = await getMd5FromStream(stream);

    const relativePath = p.replace(`${absoluteDirectory}/`, '');
    const file = { md5, path: relativePath };
    files.push(file);
  }

  return files;
}

function getAllFiles(absoluteDirectory: string, arrayOfFiles = []) {
  const files = fs.readdirSync(absoluteDirectory);

  for (const f of files) {
    const filePath = path.join(absoluteDirectory, f);

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  }

  return arrayOfFiles;
}

function getMd5FromStream(stream: fs.ReadStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}
