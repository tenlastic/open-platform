import {
  Article,
  Build,
  BuildLog,
  Collection,
  Database,
  Friend,
  Game,
  GameServer,
  GameServerLog,
  Group,
  GroupInvitation,
  Ignoration,
  Message,
  Namespace,
  PasswordReset,
  Queue,
  QueueLog,
  QueueMember,
  RefreshToken,
  User,
  WebSocket,
  Workflow,
  WorkflowLog,
} from './models';

export function deleteAll() {
  return Promise.all([
    Article.deleteMany({}),
    Build.deleteMany({}),
    BuildLog.deleteMany({}),
    Collection.deleteMany({}),
    Database.deleteMany({}),
    Friend.deleteMany({}),
    Game.deleteMany({}),
    GameServer.deleteMany({}),
    GameServerLog.deleteMany({}),
    Group.deleteMany({}),
    GroupInvitation.deleteMany({}),
    Ignoration.deleteMany({}),
    Message.deleteMany({}),
    Namespace.deleteMany({}),
    PasswordReset.deleteMany({}),
    Queue.deleteMany({}),
    QueueLog.deleteMany({}),
    QueueMember.deleteMany({}),
    RefreshToken.deleteMany({}),
    User.deleteMany({}),
    WebSocket.deleteMany({}),
    Workflow.deleteMany({}),
    WorkflowLog.deleteMany({}),
  ]);
}
