import { EventEmitter } from 'events';
import { Readable } from 'stream';
import * as util from 'util';

const GLOBAL_HEADER_LENGTH = 24;
const PACKET_HEADER_LENGTH = 16;

export declare interface Parser {
  on(event: 'end', listener: () => void): this;
  on(event: 'header', listener: (header: PacketHeader) => void): this;
  on(event: 'packet', listener: (packet: Packet) => void): this;
}

export interface Packet {
  data: Buffer;
  header: PacketHeader;
}

export interface PacketHeader {
  capturedLength: number;
  originalLength: number;
  timestampMicroseconds: number;
  timestampSeconds: number;
}

export type Endianness = 'BE' | 'LE';

export class Parser extends EventEmitter {
  private buffer: Buffer;
  private currentPacketHeader: PacketHeader;
  private endianness: Endianness;
  private errored: boolean;
  private state: () => boolean;
  private stream: Readable;

  constructor(stream: Readable) {
    super();

    this.stream = stream;

    this.stream.pause();
    this.stream.on('data', this.onData.bind(this));
    this.stream.on('error', this.onError.bind(this));
    this.stream.on('end', this.onEnd.bind(this));

    this.buffer = null;
    this.state = this.parseGlobalHeader;
    this.endianness = null;

    process.nextTick(this.stream.resume.bind(this.stream));
  }

  private onData(data) {
    if (this.errored) {
      return;
    }

    this.updateBuffer.call(this, data);
    while (this.state.call(this)) {}
  }

  private onEnd() {
    this.emit('end');
  }

  private onError(err) {
    this.emit('error', err);
  }

  private parseGlobalHeader() {
    const buffer = this.buffer;

    if (buffer.length >= GLOBAL_HEADER_LENGTH) {
      const magicNumber = buffer.toString('hex', 0, 4);

      // determine pcap endianness
      if (magicNumber === 'a1b2c3d4') {
        this.endianness = 'BE';
      } else if (magicNumber === 'd4c3b2a1') {
        this.endianness = 'LE';
      } else {
        this.errored = true;
        this.stream.pause();
        const msg = util.format('unknown magic number: %s', magicNumber);
        this.emit('error', new Error(msg));
        this.onEnd.call(this);
        return false;
      }

      const header = {
        magicNumber: buffer['readUInt32' + this.endianness](0, true),
        majorVersion: buffer['readUInt16' + this.endianness](4, true),
        minorVersion: buffer['readUInt16' + this.endianness](6, true),
        gmtOffset: buffer['readInt32' + this.endianness](8, true),
        timestampAccuracy: buffer['readUInt32' + this.endianness](12, true),
        snapshotLength: buffer['readUInt32' + this.endianness](16, true),
        linkLayerType: buffer['readUInt32' + this.endianness](20, true),
      };

      if (header.majorVersion !== 2 && header.minorVersion !== 4) {
        this.errored = true;
        this.stream.pause();
        const msg = util.format(
          'unsupported version %d.%d. pcap-parser only parses libpcap file format 2.4',
          header.majorVersion,
          header.minorVersion,
        );
        this.emit('error', new Error(msg));
        this.onEnd.call(this);
      } else {
        this.emit('globalHeader', header);
        this.buffer = buffer.slice(GLOBAL_HEADER_LENGTH);
        this.state = this.parsePacketHeader;
        return true;
      }
    }

    return false;
  }

  private parsePacketHeader() {
    const buffer = this.buffer;

    if (buffer.length >= PACKET_HEADER_LENGTH) {
      const header = {
        timestampSeconds: buffer['readUInt32' + this.endianness](0, true),
        timestampMicroseconds: buffer['readUInt32' + this.endianness](4, true),
        capturedLength: buffer['readUInt32' + this.endianness](8, true),
        originalLength: buffer['readUInt32' + this.endianness](12, true),
      };

      this.currentPacketHeader = header;
      this.emit('header', header);
      this.buffer = buffer.slice(PACKET_HEADER_LENGTH);
      this.state = this.parsePacketBody;
      return true;
    }

    return false;
  }

  private parsePacketBody() {
    const buffer = this.buffer;

    if (buffer.length >= this.currentPacketHeader.capturedLength) {
      const data = buffer.slice(0, this.currentPacketHeader.capturedLength);
      this.emit('packet', { data, header: this.currentPacketHeader });

      this.buffer = buffer.slice(this.currentPacketHeader.capturedLength);
      this.state = this.parsePacketHeader;
      return true;
    }

    return false;
  }

  private updateBuffer(data) {
    if (data === null || data === undefined) {
      return;
    }

    if (this.buffer === null) {
      this.buffer = data;
    } else {
      const extendedBuffer = Buffer.alloc(this.buffer.length + data.length);
      this.buffer.copy(extendedBuffer);
      data.copy(extendedBuffer, this.buffer.length);
      this.buffer = extendedBuffer;
    }
  }
}
