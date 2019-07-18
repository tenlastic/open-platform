import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import {
  InstanceType,
  ModelType,
  Typegoose,
  index,
  instanceMethod,
  prop,
  staticMethod,
} from 'typegoose';

@index({ userId: 1 }, { unique: true })
export class PasswordSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    required: true,
  })
  public hash: string;

  @prop({
    required: true,
  })
  public userId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  /**
   * Hashes a plaintext password.
   */
  @staticMethod
  public static async getHashFromPlaintext(this: PasswordModel, plaintext: string) {
    const salt = await bcrypt.genSalt(8);
    return bcrypt.hash(plaintext, salt);
  }

  /**
   * Checks if a password is valid.
   */
  @instanceMethod
  public isValid(this: PasswordDocument, plaintext: string) {
    return bcrypt.compare(plaintext, this.hash);
  }
}

export type PasswordDocument = InstanceType<PasswordSchema>;
export type PasswordModel = ModelType<PasswordSchema>;
export const Password = new PasswordSchema().getModelForClass(PasswordSchema, {
  schemaOptions: {
    autoIndex: false,
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'passwords',
    timestamps: true,
  },
});
