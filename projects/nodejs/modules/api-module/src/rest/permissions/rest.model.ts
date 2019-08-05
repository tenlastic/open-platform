import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, prop, staticMethod } from 'typegoose';

export class RestSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public name: string;

  @prop({ ref: 'RestSchema' })
  public parentId: Ref<RestSchema>;

  @prop({ foreignField: '_id', justOne: true, localField: 'parentId', ref: 'RestSchema', overwrite: true })
  public get parent(): RestDocument {
    return this.parent;
  }

  public updatedAt: Date;

  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  @staticMethod
  public static async mock(this: ModelType<RestSchema>, params: Partial<RestSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
    };

    return this.create({ ...defaults, ...params });
  }
}

export type RestDocument = InstanceType<RestSchema>;
export type RestModel = ModelType<RestSchema>;
export const Rest = new RestSchema().getModelForClass(RestSchema, {
  schemaOptions: {
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'rests',
    timestamps: true,
  },
});
