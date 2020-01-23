import { Model } from './model';

export class File extends Model {
  public compressedBytes: number;
  public md5: string;
  public path: string;
  public platform: string;
  public releaseId: string;
  public uncompressedBytes: number;

  constructor(params?: Partial<File>) {
    super(params);
  }
}
