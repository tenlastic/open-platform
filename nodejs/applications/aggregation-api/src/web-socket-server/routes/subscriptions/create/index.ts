import {
  AuthorizationDocument,
  AuthorizationModel,
  AuthorizationPermissionOptions,
  AuthorizationRequestDocument,
  AuthorizationRequestModel,
  AuthorizationRequestPermissionOptions,
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
  NamespaceDocument,
  NamespaceModel,
  NamespacePermissionOptions,
  QueueMemberDocument,
  QueueMemberModel,
  QueueMemberPermissionOptions,
  StorefrontDocument,
  StorefrontModel,
  StorefrontPermissionOptions,
  UserDocument,
  UserModel,
  UserPermissionOptions,
  WebSocketDocument,
  WebSocketModel,
  WebSocketPermissionOptions,
} from '@tenlastic/mongoose';
import { Context, subscribe, SubscribeOptions } from '@tenlastic/web-socket-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: Context<SubscribeOptions<mongoose.Document>>) {
  switch (ctx.params.collection) {
    case 'authorization-requests':
      return subscribe<AuthorizationRequestDocument>(
        ctx,
        AuthorizationRequestModel,
        AuthorizationRequestPermissionOptions,
      );

    case 'authorizations':
      return subscribe<AuthorizationDocument>(
        ctx,
        AuthorizationModel,
        AuthorizationPermissionOptions,
      );

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

    case 'namespaces':
      return subscribe<NamespaceDocument>(ctx, NamespaceModel, NamespacePermissionOptions);

    case 'queue-members':
      return subscribe<QueueMemberDocument>(ctx, QueueMemberModel, QueueMemberPermissionOptions);

    case 'storefronts':
      return subscribe<StorefrontDocument>(ctx, StorefrontModel, StorefrontPermissionOptions);

    case 'users':
      return subscribe<UserDocument>(ctx, UserModel, UserPermissionOptions);

    case 'web-sockets':
      return subscribe<WebSocketDocument>(ctx, WebSocketModel, WebSocketPermissionOptions);
  }
}
