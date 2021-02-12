import { modelOptions, prop } from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({
  schemaOptions: {
    minimize: false,
    timestamps: true,
  },
})
export class LogBase {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public body: string;

  public createdAt: Date;

  @prop()
  public expiresAt: Date;

  @prop({ required: true })
  public unix: number;

  public updatedAt: Date;
}
