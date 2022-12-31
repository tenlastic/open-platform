import {
  AuthorizationModel,
  AuthorizationPermissions,
  AuthorizationRequestModel,
  AuthorizationRequestPermissions,
  FriendModel,
  FriendPermissions,
  GroupModel,
  GroupPermissions,
  GroupInvitationModel,
  GroupInvitationPermissions,
  IgnorationModel,
  IgnorationPermissions,
  MatchInvitationModel,
  MatchInvitationPermissions,
  MatchModel,
  MatchPermissions,
  MessageModel,
  MessagePermissions,
  NamespaceModel,
  NamespacePermissions,
  QueueMemberModel,
  QueueMemberPermissions,
  StorefrontModel,
  StorefrontPermissions,
  UserModel,
  UserPermissions,
  WebSocketModel,
  WebSocketPermissions,
} from '@tenlastic/mongoose';
import { Context, subscribe, SubscribeOptions } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context<SubscribeOptions>) {
  switch (ctx.params.collection) {
    case 'authorization-requests':
      return subscribe(ctx, AuthorizationRequestModel, AuthorizationRequestPermissions);

    case 'authorizations':
      return subscribe(ctx, AuthorizationModel, AuthorizationPermissions);

    case 'friends':
      return subscribe(ctx, FriendModel, FriendPermissions);

    case 'group-invitations':
      return subscribe(ctx, GroupInvitationModel, GroupInvitationPermissions);

    case 'groups':
      return subscribe(ctx, GroupModel, GroupPermissions);

    case 'ignorations':
      return subscribe(ctx, IgnorationModel, IgnorationPermissions);

    case 'match-invitations':
      return subscribe(ctx, MatchInvitationModel, MatchInvitationPermissions);

    case 'matches':
      return subscribe(ctx, MatchModel, MatchPermissions);

    case 'messages':
      return subscribe(ctx, MessageModel, MessagePermissions);

    case 'namespaces':
      return subscribe(ctx, NamespaceModel, NamespacePermissions);

    case 'queue-members':
      return subscribe(ctx, QueueMemberModel, QueueMemberPermissions);

    case 'storefronts':
      return subscribe(ctx, StorefrontModel, StorefrontPermissions);

    case 'users':
      return subscribe(ctx, UserModel, UserPermissions);

    case 'web-sockets':
      return subscribe(ctx, WebSocketModel, WebSocketPermissions);
  }
}
