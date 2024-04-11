import {
  ArticleModel,
  ArticlePermissions,
  BuildModel,
  BuildPermissions,
  CollectionModel,
  CollectionPermissions,
  GameServerModel,
  GameServerPermissions,
  GameServerTemplateModel,
  GameServerTemplatePermissions,
  MatchInvitationModel,
  MatchInvitationPermissions,
  MatchModel,
  MatchPermissions,
  QueueMemberModel,
  QueueMemberPermissions,
  QueueModel,
  QueuePermissions,
  RecordPermissions,
  RecordSchema,
  StorefrontModel,
  StorefrontPermissions,
  WebSocketModel,
  WebSocketPermissions,
  WorkflowModel,
  WorkflowPermissions,
} from '@tenlastic/mongoose';
import { Context, subscribe, SubscribeOptions } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context<SubscribeOptions>) {
  switch (ctx.params.collection) {
    case 'articles':
      return subscribe(ctx, ArticleModel, ArticlePermissions);

    case 'builds':
      return subscribe(ctx, BuildModel, BuildPermissions);

    case 'collections':
      return subscribe(ctx, CollectionModel, CollectionPermissions);

    case 'game-server-templates':
      return subscribe(ctx, GameServerTemplateModel, GameServerTemplatePermissions);

    case 'game-servers':
      return subscribe(ctx, GameServerModel, GameServerPermissions);

    case 'match-invitations':
      return subscribe(ctx, MatchInvitationModel, MatchInvitationPermissions);

    case 'matches':
      return subscribe(ctx, MatchModel, MatchPermissions);

    case 'queue-members':
      return subscribe(ctx, QueueMemberModel, QueueMemberPermissions);

    case 'queues':
      return subscribe(ctx, QueueModel, QueuePermissions);

    case 'storefronts':
      return subscribe(ctx, StorefrontModel, StorefrontPermissions);

    case 'web-sockets':
      return subscribe(ctx, WebSocketModel, WebSocketPermissions);

    case 'workflows':
      return subscribe(ctx, WorkflowModel, WorkflowPermissions);
  }

  // Records.
  if (ctx.params.collectionId) {
    const collection = await CollectionModel.findOne({ _id: ctx.params.collectionId });
    const Model = RecordSchema.getModel(collection);
    const Permissions = RecordPermissions(collection, Model);

    return subscribe(ctx, Model, Permissions);
  }
}
