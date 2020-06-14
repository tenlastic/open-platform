import { Injectable } from '@angular/core';
import SparkMd5 from 'spark-md5';

@Injectable({ providedIn: 'root' })
export class FileReaderService {
  public arrayBufferToBlob(arrayBuffer: ArrayBuffer) {
    return new Blob([new Uint8Array(arrayBuffer)]);
  }

  public arrayBufferToMd5(arrayBuffer: ArrayBuffer) {
    return SparkMd5.ArrayBuffer.hash(arrayBuffer);
  }

  public fileToArrayBuffer(file: File) {
    const chunkSize = 104857600; // read in chunks of 100MB
    const chunks = Math.ceil(file.size / chunkSize);
    const currentChunk = 0;
    const arrayBuffer = new ArrayBuffer(0);

    return this.loadNext(arrayBuffer, chunkSize, chunks, currentChunk, file);
  }

  private appendArrayBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

    return tmp.buffer as ArrayBuffer;
  }

  private loadNext(
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
        arrayBuffer = this.appendArrayBuffer(arrayBuffer, e.target.result);
        currentChunk++;

        if (currentChunk < chunks) {
          arrayBuffer = await this.loadNext(arrayBuffer, chunkSize, chunks, currentChunk, file);
        }

        return resolve(arrayBuffer);
      };

      fileReader.onerror = reject;

      const start = currentChunk * chunkSize;
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    });
  }
}
