import { Injectable } from '@angular/core';
import {
  ArticleStore,
  AuthorizationStore,
  BuildLogStore,
  BuildStore,
  CollectionStore,
  GameServerLogStore,
  GameServerStore,
  GroupInvitationStore,
  GroupStore,
  NamespaceLogStore,
  NamespaceStore,
  QueueLogStore,
  QueueMemberStore,
  QueueStore,
  RecordStore,
  RefreshTokenStore,
  StorefrontStore,
  UserStore,
  WebSocketStore,
  WorkflowLogStore,
  WorkflowStore,
} from '@tenlastic/http';

@Injectable({ providedIn: 'root' })
export class ResetService {
  constructor(
    private articleStore: ArticleStore,
    private authorizationStore: AuthorizationStore,
    private buildLogStore: BuildLogStore,
    private buildStore: BuildStore,
    private collectionStore: CollectionStore,
    private gameServerLogStore: GameServerLogStore,
    private gameServerStore: GameServerStore,
    private groupInvitationStore: GroupInvitationStore,
    private groupStore: GroupStore,
    private namespaceLogStore: NamespaceLogStore,
    private namespaceStore: NamespaceStore,
    private queueLogStore: QueueLogStore,
    private queueMemberStore: QueueMemberStore,
    private queueStore: QueueStore,
    private recordStore: RecordStore,
    private refreshTokenStore: RefreshTokenStore,
    private storefrontStore: StorefrontStore,
    private userStore: UserStore,
    private webSocketStore: WebSocketStore,
    private workflowLogStore: WorkflowLogStore,
    private workflowStore: WorkflowStore,
  ) {}

  public reset() {
    this.articleStore.reset();
    this.authorizationStore.reset();
    this.buildLogStore.reset();
    this.buildStore.reset();
    this.collectionStore.reset();
    this.gameServerLogStore.reset();
    this.gameServerStore.reset();
    this.groupInvitationStore.reset();
    this.groupStore.reset();
    this.namespaceLogStore.reset();
    this.namespaceStore.reset();
    this.queueLogStore.reset();
    this.queueMemberStore.reset();
    this.queueStore.reset();
    this.recordStore.reset();
    this.refreshTokenStore.reset();
    this.storefrontStore.reset();
    this.userStore.reset();
    this.webSocketStore.reset();
    this.workflowLogStore.reset();
    this.workflowStore.reset();
  }
}
