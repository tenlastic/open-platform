import {
  Article,
  Build,
  BuildTask,
  Collection,
  File,
  Friend,
  Game,
  GameInvitation,
  GameServer,
  Group,
  GroupInvitation,
  Ignoration,
  Log,
  Message,
  Namespace,
  PasswordReset,
  Queue,
  QueueMember,
  RefreshToken,
  User,
  WebSocket,
} from './models';

export function syncIndexes() {
  return Promise.all([
    Article.syncIndexes({}),
    Build.syncIndexes({}),
    BuildTask.syncIndexes({}),
    Collection.syncIndexes({}),
    File.syncIndexes({}),
    Friend.syncIndexes({}),
    Game.syncIndexes({}),
    GameInvitation.syncIndexes({}),
    GameServer.syncIndexes({}),
    Group.syncIndexes({}),
    GroupInvitation.syncIndexes({}),
    Ignoration.syncIndexes({}),
    Log.syncIndexes({}),
    Message.syncIndexes({}),
    Namespace.syncIndexes({}),
    PasswordReset.syncIndexes({}),
    Queue.syncIndexes({}),
    QueueMember.syncIndexes({}),
    RefreshToken.syncIndexes({}),
    User.syncIndexes({}),
    WebSocket.syncIndexes({}),
  ]);
}