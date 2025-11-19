import {
  ArticleDocument,
  ArticleModel,
  ArticlePermissionOptions,
  BuildDocument,
  BuildModel,
  BuildPermissionOptions,
  CollectionDocument,
  CollectionModel,
  CollectionPermissionOptions,
  GameServerDocument,
  GameServerModel,
  GameServerPermissionOptions,
  GameServerTemplateDocument,
  GameServerTemplateModel,
  GameServerTemplatePermissionOptions,
  getRecordModel,
  getRecordPermissionOptions,
  GroupDocument,
  GroupInvitationDocument,
  GroupInvitationModel,
  GroupInvitationPermissionOptions,
  GroupModel,
  GroupPermissionOptions,
  MatchDocument,
  MatchInvitationDocument,
  MatchInvitationModel,
  MatchInvitationPermissionOptions,
  MatchModel,
  MatchPermissionOptions,
  QueueDocument,
  QueueMemberDocument,
  QueueMemberModel,
  QueueMemberPermissionOptions,
  QueueModel,
  QueuePermissionOptions,
  RecordDocument,
  StorefrontDocument,
  StorefrontModel,
  StorefrontPermissionOptions,
  TeamDocument,
  TeamModel,
  TeamPermissionOptions,
  WebSocketDocument,
  WebSocketModel,
  WebSocketPermissionOptions,
  WorkflowDocument,
  WorkflowModel,
  WorkflowPermissionOptions,
} from '@tenlastic/mongoose';
import { Context, subscribe, SubscribeOptions } from '@tenlastic/web-socket-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: Context<SubscribeOptions<mongoose.Document>>) {
  switch (ctx.params.collection) {
    case 'articles':
      return subscribe<ArticleDocument>(ctx, ArticleModel, ArticlePermissionOptions);

    case 'builds':
      return subscribe<BuildDocument>(ctx, BuildModel, BuildPermissionOptions);

    case 'collections':
      return subscribe<CollectionDocument>(ctx, CollectionModel, CollectionPermissionOptions);

    case 'game-server-templates':
      return subscribe<GameServerTemplateDocument>(
        ctx,
        GameServerTemplateModel,
        GameServerTemplatePermissionOptions,
      );

    case 'game-servers':
      return subscribe<GameServerDocument>(ctx, GameServerModel, GameServerPermissionOptions);

    case 'group-invitations':
      return subscribe<GroupInvitationDocument>(
        ctx,
        GroupInvitationModel,
        GroupInvitationPermissionOptions,
      );

    case 'groups':
      return subscribe<GroupDocument>(ctx, GroupModel, GroupPermissionOptions);

    case 'match-invitations':
      return subscribe<MatchInvitationDocument>(
        ctx,
        MatchInvitationModel,
        MatchInvitationPermissionOptions,
      );

    case 'matches':
      return subscribe<MatchDocument>(ctx, MatchModel, MatchPermissionOptions);

    case 'queue-members':
      return subscribe<QueueMemberDocument>(ctx, QueueMemberModel, QueueMemberPermissionOptions);

    case 'queues':
      return subscribe<QueueDocument>(ctx, QueueModel, QueuePermissionOptions);

    case 'storefronts':
      return subscribe<StorefrontDocument>(ctx, StorefrontModel, StorefrontPermissionOptions);

    case 'teams':
      return subscribe<TeamDocument>(ctx, TeamModel, TeamPermissionOptions);

    case 'web-sockets':
      return subscribe<WebSocketDocument>(ctx, WebSocketModel, WebSocketPermissionOptions);

    case 'workflows':
      return subscribe<WorkflowDocument>(ctx, WorkflowModel, WorkflowPermissionOptions);
  }

  // Records.
  if (ctx.params.collectionId) {
    const collection = await CollectionModel.findOne({ _id: ctx.params.collectionId });
    const Model = getRecordModel(collection);
    const RecordPermissionOptions = getRecordPermissionOptions(collection);

    return subscribe<RecordDocument>(ctx, Model, RecordPermissionOptions);
  }
}
