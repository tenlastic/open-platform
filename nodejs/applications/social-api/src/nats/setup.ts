import {
  FriendModel,
  GroupInvitationModel,
  GroupModel,
  IgnorationModel,
  MessageModel,
  UserModel,
} from '@tenlastic/mongoose';
import { subscribe } from '@tenlastic/mongoose-change-stream-nats';
import * as nats from '@tenlastic/nats';

import { FriendEvent } from './friend';
import { GroupEvent } from './group';
import { GroupInvitationEvent } from './group-invitation';
import { IgnorationEvent } from './ignoration';
import { MessageEvent } from './message';
import { UserEvent } from './user';

export interface SetupOptions extends nats.ConnectionOptions {
  database: string;
  durable: string;
}

export async function setup(options: SetupOptions) {
  await nats.connect({ connectionString: options.connectionString });
  await nats.upsertStream(options.database);

  Promise.all([
    subscribe(options.database, options.durable, FriendModel, (payload) =>
      FriendEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, GroupInvitationModel, (payload) =>
      GroupInvitationEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, GroupModel, (payload) => GroupEvent.emit(payload)),
    subscribe(options.database, options.durable, IgnorationModel, (payload) =>
      IgnorationEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, MessageModel, (payload) =>
      MessageEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, UserModel, (payload) => UserEvent.emit(payload)),
  ]).catch((err) => console.error(err));
}
