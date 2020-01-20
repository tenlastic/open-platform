import { Model } from './model';

export class File extends Model {
  public md5: string;
  public path: string;
  public platform: string;
  public releaseId: string;

  constructor(params?: Partial<File>) {
    super(params);
  }
}
