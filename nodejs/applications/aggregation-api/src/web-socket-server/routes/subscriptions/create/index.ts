import {
  AuthorizationModel,
  AuthorizationPermissions,
  AuthorizationRequestModel,
  AuthorizationRequestPermissions,
  GroupModel,
  GroupPermissions,
  GroupInvitationModel,
  GroupInvitationPermissions,
  MatchInvitationModel,
  MatchInvitationPermissions,
  MatchModel,
  MatchPermissions,
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

    case 'group-invitations':
      return subscribe(ctx, GroupInvitationModel, GroupInvitationPermissions);

    case 'groups':
      return subscribe(ctx, GroupModel, GroupPermissions);

    case 'match-invitations':
      return subscribe(ctx, MatchInvitationModel, MatchInvitationPermissions);

    case 'matches':
      return subscribe(ctx, MatchModel, MatchPermissions);

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
