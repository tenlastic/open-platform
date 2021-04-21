import {
  DocumentType,
  Ref,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

@modelOptions({
  schemaOptions: {
    collection: 'examples',
    timestamps: true,
  },
})
export class ExampleSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop()
  public jsonSchema: any;

  @prop()
  public properties: any;

  @prop()
  public name: string;

  @prop({ ref: 'ExampleSchema' })
  public parentId: Ref<ExampleDocument>;

  public updatedAt: Date;

  @arrayProp({ items: String })
  public urls: string[];

  @prop({ ref: 'ExampleSchema' })
  public userId: Ref<ExampleDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'parentId', ref: 'ExampleSchema' })
  public parent: ExampleDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async mock(this: ExampleModel, params: Partial<ExampleSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
    };

    return this.create({ ...defaults, ...params });
  }
}

export type ExampleDocument = DocumentType<ExampleSchema>;
export type ExampleModel = ReturnModelType<typeof ExampleSchema>;
export const Example = getModelForClass(ExampleSchema);
