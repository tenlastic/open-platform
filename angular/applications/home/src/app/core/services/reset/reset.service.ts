import { Injectable } from '@angular/core';
import {
  ArticleState,
  AuthorizationState,
  BuildLogState,
  BuildState,
  CollectionState,
  GameServerLogState,
  GameServerState,
  GroupInvitationState,
  GroupState,
  NamespaceLogState,
  NamespaceState,
  QueueLogState,
  QueueMemberState,
  QueueState,
  RecordState,
  StorefrontState,
  UserState,
  WebSocketState,
  WorkflowLogState,
  WorkflowState,
} from '@tenlastic/http';

@Injectable({ providedIn: 'root' })
export class ResetService {
  constructor(
    private articleState: ArticleState,
    private authorizationState: AuthorizationState,
    private buildLogState: BuildLogState,
    private buildState: BuildState,
    private collectionState: CollectionState,
    private gameServerLogState: GameServerLogState,
    private gameServerState: GameServerState,
    private groupInvitationState: GroupInvitationState,
    private groupState: GroupState,
    private namespaceLogState: NamespaceLogState,
    private namespaceState: NamespaceState,
    private queueLogState: QueueLogState,
    private queueMemberState: QueueMemberState,
    private queueState: QueueState,
    private recordState: RecordState,
    private storefrontState: StorefrontState,
    private userState: UserState,
    private webSocketState: WebSocketState,
    private workflowLogState: WorkflowLogState,
    private workflowState: WorkflowState,
  ) {}

  public reset() {
    this.articleState.reset();
    this.authorizationState.reset();
    this.buildLogState.reset();
    this.buildState.reset();
    this.collectionState.reset();
    this.gameServerLogState.reset();
    this.gameServerState.reset();
    this.groupInvitationState.reset();
    this.groupState.reset();
    this.namespaceLogState.reset();
    this.namespaceState.reset();
    this.queueLogState.reset();
    this.queueMemberState.reset();
    this.queueState.reset();
    this.recordState.reset();
    this.storefrontState.reset();
    this.userState.reset();
    this.webSocketState.reset();
    this.workflowLogState.reset();
    this.workflowState.reset();
  }
}
