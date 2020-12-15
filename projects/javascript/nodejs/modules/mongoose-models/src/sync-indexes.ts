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

export function syncIndexes() {
  return Promise.all([
    Article.syncIndexes({ background: true }),
    Build.syncIndexes({ background: true }),
    BuildTask.syncIndexes({ background: true }),
    Collection.syncIndexes({ background: true }),
    File.syncIndexes({ background: true }),
    Friend.syncIndexes({ background: true }),
    Game.syncIndexes({ background: true }),
    GameInvitation.syncIndexes({ background: true }),
    GameServer.syncIndexes({ background: true }),
    GameServerLog.syncIndexes({ background: true }),
    Group.syncIndexes({ background: true }),
    GroupInvitation.syncIndexes({ background: true }),
    Ignoration.syncIndexes({ background: true }),
    Message.syncIndexes({ background: true }),
    Namespace.syncIndexes({ background: true }),
    PasswordReset.syncIndexes({ background: true }),
    Pipeline.syncIndexes({ background: true }),
    PipelineTemplate.syncIndexes({ background: true }),
    Queue.syncIndexes({ background: true }),
    QueueLog.syncIndexes({ background: true }),
    QueueMember.syncIndexes({ background: true }),
    RefreshToken.syncIndexes({ background: true }),
    User.syncIndexes({ background: true }),
    WebSocket.syncIndexes({ background: true }),
  ]);
}
