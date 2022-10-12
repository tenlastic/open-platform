import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'examples', timestamps: true },
})
export class ExampleSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ type: mongoose.Schema.Types.Mixed })
  public jsonSchema: any;

  @prop({ merge: true, type: mongoose.Schema.Types.Mixed })
  public properties: any;

  @prop({ type: String })
  public name: string;

  @prop({ ref: 'ExampleSchema', type: mongoose.Schema.Types.ObjectId })
  public parentId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ type: String }, PropType.ARRAY)
  public urls: string[];

  @prop({ ref: 'ExampleSchema', type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

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
