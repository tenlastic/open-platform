import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  pre,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@index({ name: 1, timestamp: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'migrations' } })
@pre('remove', function (this: MigrationDocument) {
  return this.down ? this.down(this) : null;
})
@pre('save', async function (this: MigrationDocument) {
  return this.up ? this.up(this) : null;
})
export class MigrationSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ required: true, type: Date })
  public timestamp: Date;

  public get down() {
    return this._down;
  }
  public set down(callback: (migration: MigrationDocument) => Promise<void>) {
    this._down = callback;
  }

  public get up() {
    return this._up;
  }
  public set up(callback: (migration: MigrationDocument) => Promise<void>) {
    this._up = callback;
  }

  private _down: (migration: MigrationDocument) => Promise<void>;
  private _up: (migration: MigrationDocument) => Promise<void>;
}

export type MigrationDocument = DocumentType<MigrationSchema>;
export type MigrationModel = ReturnModelType<typeof MigrationSchema>;
export const Migration = getModelForClass(MigrationSchema);
