import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as path from 'path';

export function getZipStream(root: string, paths: string[]) {
  const zip = new JSZip();

  for (const p of paths) {
    const absolutePath = path.resolve(root, p);
    const stream = fs.createReadStream(absolutePath);
    zip.file(p, stream);
  }

  return zip.generateAsync({
    compression: 'DEFLATE',
    compressionOptions: { level: 5 },
    type: 'nodebuffer',
  });
}
