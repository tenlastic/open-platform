import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose } from 'typegoose';

export class ExampleSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;
  public updatedAt: Date;
}

export type ExampleDocument = InstanceType<ExampleSchema>;
export type ExampleModel = ModelType<ExampleSchema>;
export const Example = new ExampleSchema().getModelForClass(ExampleSchema, {
  schemaOptions: {
    autoIndex: false,
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'examples',
    timestamps: true,
  },
});
