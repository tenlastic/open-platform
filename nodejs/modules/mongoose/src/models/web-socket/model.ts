import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';

export interface WebSocket {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  disconnectedAt?: Date;
  expiresAt?: Date;
  namespaceId?: mongoose.Types.ObjectId;
  nodeId: string;
  updatedAt?: Date;
  userId: mongoose.Types.ObjectId;
}

export type WebSocketDocument = mongoose.Document<mongoose.Types.ObjectId> & WebSocket;

export interface WebSocketModelType extends mongoose.Model<WebSocketDocument> {
  /**
   * Updates the disconnectedAt timestamp in MongoDB.
   */
  disconnect(this: WebSocketModelType, _id: mongoose.Types.ObjectId): Promise<void>;

  /**
   * Updates the disconnectedAt timestamp in MongoDB by Node ID.
   */
  disconnectByNodeId(this: WebSocketModelType, nodeId: string): Promise<void>;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: WebSocketModelType, values?: Partial<WebSocket>): WebSocketDocument;
}

const WebSocketSchema = new mongoose.Schema<WebSocketDocument, WebSocketModelType>(
  {
    disconnectedAt: { type: Date },
    expiresAt: { type: Date },
    namespaceId: { ref: 'NamespaceSchema', type: mongoose.Schema.Types.ObjectId },
    nodeId: { maxlength: 256, trim: true, required: true, type: String },
    userId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  { collection: 'web-sockets', timestamps: true },
);

WebSocketSchema.index({ disconnectedAt: 1 });
WebSocketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
WebSocketSchema.index({ namespaceId: 1 });
WebSocketSchema.index({ nodeId: 1 });
WebSocketSchema.index({ userId: 1 });

WebSocketSchema.plugin(unsetPlugin);

WebSocketSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: 'namespaceId',
  foreignField: 'namespaceId',
});

WebSocketSchema.statics.disconnect = async function (_id: mongoose.Types.ObjectId) {
  const disconnectedAt = new Date();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await this.findOneAndUpdate(
    { _id, disconnectedAt: { $exists: false } },
    { disconnectedAt, expiresAt },
  );
};

WebSocketSchema.statics.disconnectByNodeId = async function (nodeId: string) {
  const disconnectedAt = new Date();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await this.updateMany(
    { disconnectedAt: { $exists: false }, nodeId },
    { disconnectedAt, expiresAt },
  );
};

WebSocketSchema.statics.mock = function (values: Partial<WebSocket> = {}) {
  const chance = new Chance();
  const defaults: Partial<WebSocket> = {
    nodeId: chance.hash(),
    userId: new mongoose.Types.ObjectId(),
  };

  return new this({ ...defaults, ...values });
};

export const WebSocketModel = mongoose.model<WebSocketDocument, WebSocketModelType>(
  'WebSocketSchema',
  WebSocketSchema,
);

export { WebSocketSchema };

export default WebSocketModel;
