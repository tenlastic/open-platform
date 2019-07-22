import { DatabasePayload, EventEmitter } from '@tenlastic/api-module';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, post, prop } from 'typegoose';

@index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })
@index({ hash: 1 })
@post('init', function(this: PasswordResetDocument) {
  this._original = this.toObject();
})
@post('remove', function(this: PasswordResetDocument) {
  PasswordResetSchema.OnDelete.emit({ after: null, before: this._original });
})
@post('save', function(this: PasswordResetDocument) {
  if (this.isNew) {
    PasswordResetSchema.OnCreate.emit({ after: this.toObject(), before: null });
  } else {
    PasswordResetSchema.OnUpdate.emit({ after: this.toObject(), before: this._original });
  }
})
export class PasswordResetSchema extends Typegoose {
  public static OnCreate = new EventEmitter<DatabasePayload<PasswordResetDocument>>();
  public static OnDelete = new EventEmitter<DatabasePayload<PasswordResetDocument>>();
  public static OnUpdate = new EventEmitter<DatabasePayload<PasswordResetDocument>>();

  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    required: true,
  })
  public hash: string;

  public updatedAt: Date;

  @prop({
    required: true,
  })
  public userId: mongoose.Types.ObjectId;

  private _original: PasswordResetDocument = null;
}

export type PasswordResetDocument = InstanceType<PasswordResetSchema>;
export type PasswordResetModel = ModelType<PasswordResetSchema>;
export const PasswordReset = new PasswordResetSchema().getModelForClass(PasswordResetSchema, {
  schemaOptions: {
    autoIndex: false,
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'passwordresets',
    timestamps: true,
  },
});
