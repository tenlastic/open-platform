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
  GameServerLog,
  Group,
  GroupInvitation,
  Ignoration,
  Message,
  Namespace,
  PasswordReset,
  Pipeline,
  PipelineTemplate,
  Queue,
  QueueLog,
  QueueMember,
  RefreshToken,
  User,
  WebSocket,
} from './models';

export function deleteAll() {
  return Promise.all([
    Article.deleteMany({}),
    Build.deleteMany({}),
    BuildTask.deleteMany({}),
    Collection.deleteMany({}),
    File.deleteMany({}),
    Friend.deleteMany({}),
    Game.deleteMany({}),
    GameInvitation.deleteMany({}),
    GameServer.deleteMany({}),
    GameServerLog.deleteMany({}),
    Group.deleteMany({}),
    GroupInvitation.deleteMany({}),
    Ignoration.deleteMany({}),
    Message.deleteMany({}),
    Namespace.deleteMany({}),
    PasswordReset.deleteMany({}),
    Pipeline.deleteMany({}),
    PipelineTemplate.deleteMany({}),
    Queue.deleteMany({}),
    QueueLog.deleteMany({}),
    QueueMember.deleteMany({}),
    RefreshToken.deleteMany({}),
    User.deleteMany({}),
    WebSocket.deleteMany({}),
  ]);
}
