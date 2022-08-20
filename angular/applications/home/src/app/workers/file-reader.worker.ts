/// <reference lib="webworker" />

import SparkMd5 from 'spark-md5';

addEventListener('message', async ({ data }) => {
  const { files } = data;

  for (const file of files) {
    const content = await fileToArrayBuffer(file);
    const path = file.webkitRelativePath
      ? file.webkitRelativePath.substring(file.webkitRelativePath.indexOf('/') + 1)
      : file.name;

    const md5 = arrayBufferToMd5(content);

    const f = { arrayBuffer: content, md5, path, uncompressedBytes: file.size };
    postMessage({ file: f });
  }

  postMessage({ isDone: true });
});

function appendArrayBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

  return tmp.buffer as ArrayBuffer;
}

function arrayBufferToMd5(arrayBuffer: ArrayBuffer) {
  return SparkMd5.ArrayBuffer.hash(arrayBuffer);
}

function fileToArrayBuffer(file: File) {
  const chunkSize = 104857600; // read in chunks of 100MB
  const chunks = Math.ceil(file.size / chunkSize);
  const currentChunk = 0;
  const arrayBuffer = new ArrayBuffer(0);

  return loadNext(arrayBuffer, chunkSize, chunks, currentChunk, file);
}

function loadNext(
  arrayBuffer: ArrayBuffer,
  chunkSize: number,
  chunks: number,
  currentChunk: number,
  file: File,
) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const blobSlice = File.prototype.slice;
    const fileReader = new FileReader();

    fileReader.onload = async (e: any) => {
      arrayBuffer = appendArrayBuffer(arrayBuffer, e.target.result);
      currentChunk++;

      if (currentChunk < chunks) {
        arrayBuffer = await loadNext(arrayBuffer, chunkSize, chunks, currentChunk, file);
      }

      return resolve(arrayBuffer);
    };

    fileReader.onerror = reject;

    const start = currentChunk * chunkSize;
    const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
    fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
  });
}
