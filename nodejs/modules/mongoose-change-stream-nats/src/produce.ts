import {
  OnArticleProduced,
  OnAuthorizationProduced,
  OnBuildProduced,
  OnCollectionProduced,
  OnFriendProduced,
  OnGameServerProduced,
  OnGroupInvitationProduced,
  OnGroupProduced,
  OnIgnorationProduced,
  OnLoginProduced,
  OnMessageProduced,
  OnNamespaceProduced,
  OnPasswordResetProduced,
  OnQueueMemberProduced,
  OnQueueProduced,
  OnRecordProduced,
  OnStorefrontProduced,
  OnUserProduced,
  OnWebSocketProduced,
  OnWorkflowProduced,
} from '@tenlastic/mongoose-models';

import { publish } from './publish';

export function produce() {
  OnArticleProduced.sync(publish);
  OnAuthorizationProduced.sync(publish);
  OnBuildProduced.sync(publish);
  OnCollectionProduced.sync(publish);
  OnFriendProduced.sync(publish);
  OnGameServerProduced.sync(publish);
  OnGroupInvitationProduced.sync(publish);
  OnGroupProduced.sync(publish);
  OnIgnorationProduced.sync(publish);
  OnLoginProduced.sync(publish);
  OnMessageProduced.sync(publish);
  OnNamespaceProduced.sync(publish);
  OnPasswordResetProduced.sync(publish);
  OnQueueMemberProduced.sync(publish);
  OnQueueProduced.sync(publish);
  OnRecordProduced.sync(publish);
  OnStorefrontProduced.sync(publish);
  OnUserProduced.sync(publish);
  OnWebSocketProduced.sync(publish);
  OnWorkflowProduced.sync(publish);
}
