import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, prop, staticMethod } from 'typegoose';

export class ExampleSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public name: string;

  @prop({ ref: 'ExampleSchema' })
  public parentId: Ref<ExampleSchema>;

  @prop({
    foreignField: '_id',
    justOne: true,
    localField: 'parentId',
    ref: 'ExampleSchema',
    overwrite: true,
  })
  public get parent(): ExampleDocument {
    return this.parent;
  }

  public updatedAt: Date;

  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  @staticMethod
  public static async mock(this: ModelType<ExampleSchema>, params: Partial<ExampleSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
    };

    return this.create({ ...defaults, ...params });
  }
}

export type ExampleDocument = InstanceType<ExampleSchema>;
export type ExampleModel = ModelType<ExampleSchema>;
export const Example = new ExampleSchema().getModelForClass(ExampleSchema, {
  schemaOptions: {
    collection: 'examples',
    timestamps: true,
  },
});
