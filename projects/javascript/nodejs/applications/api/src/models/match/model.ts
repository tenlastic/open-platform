import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  arrayProp,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { Queue, QueueDocument } from '../queue';
import { User, UserDocument } from '../user';

// Publish changes to Kafka.
export const MatchEvent = new EventEmitter<IDatabasePayload<MatchDocument>>();
MatchEvent.on(payload => {
  kafka.publish(payload);
});

@index({ queueId: 1 })
@index(
  { userIds: 1 },
  {
    partialFilterExpression: {
      finishedAt: { $type: 'null' },
    },
    unique: true,
  },
)
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'matches',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: MatchEvent,
})
export class MatchSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ default: null })
  public finishedAt: Date;

  @prop({ ref: Queue, required: true })
  public queueId: Ref<QueueDocument>;

  @prop({ default: null })
  public startedAt: Date;

  @arrayProp({ itemsRef: User })
  public userIds: Array<Ref<UserDocument>>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: false, localField: 'userIds', ref: User })
  public userDocuments: UserDocument[];
}

export type MatchDocument = DocumentType<MatchSchema>;
export type MatchModel = ReturnModelType<typeof MatchSchema>;
export const Match = getModelForClass(MatchSchema);
