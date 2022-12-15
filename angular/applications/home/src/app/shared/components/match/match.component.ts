import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  MatchInvitationModel,
  MatchInvitationQuery,
  MatchInvitationService,
  MatchModel,
  MatchQuery,
  MatchService,
  QueueMemberModel,
  QueueMemberQuery,
  QueueMemberService,
  QueueModel,
  QueueQuery,
  QueueService,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { ElectronService, IdentityService } from '../../../core/services';
import {
  MatchPromptComponent,
  MatchPromptComponentData,
} from '../match-prompt/match-prompt.component';

@Component({
  selector: 'app-match',
  styleUrls: ['./match.component.scss'],
  templateUrl: './match.component.html',
})
export class MatchComponent implements OnDestroy, OnInit {
  public $matches: Observable<MatchModel[]>;
  public $queueMembers: Observable<QueueMemberModel[]>;

  private fetchMatchReferences$ = new Subscription();
  private fetchQueueMemberReferences$ = new Subscription();
  private updateQueueMembers$ = new Subscription();
  private matDialogRef: MatDialogRef<MatchPromptComponent>;
  private onMatchInvitationServiceCreate = this.newMatchInvitationNotification.bind(this);
  private onMatchServiceCreate = this.newMatchNotification.bind(this);

  constructor(
    private electronService: ElectronService,
    private identityService: IdentityService,
    private matchInvitationService: MatchInvitationService,
    private matchQuery: MatchQuery,
    private matchService: MatchService,
    private matDialog: MatDialog,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    const userId = this.identityService.user._id;

    this.$matches = this.matchQuery.selectAll({
      filterBy: (m) => !m.finishedAt && m.userIds.includes(userId) && Boolean(m.startedAt),
    });
    this.$queueMembers = this.queueMemberQuery.selectAll({
      filterBy: (qm) => qm.userIds.includes(userId),
    });

    this.fetchMatchReferences$ = this.$matches.subscribe((ms) => {
      const missingQueueIds = ms
        .filter((m) => !this.queueQuery.hasEntity(m.queueId))
        .reduce((p, c) => this.getGroupsByNamespaceId(c, 'queueId', p), {});
      const missingStorefrontIds = ms.filter((m) => !this.storefrontQuery.hasEntity(m.namespaceId));

      const promises = [];
      for (const [key, value] of Object.entries(missingQueueIds)) {
        promises.push(this.queueService.find(key, { where: { _id: { $in: value } } }));
      }
      if (missingStorefrontIds.length > 0) {
        promises.push(
          this.storefrontService.find(null, { where: { _id: { $in: missingStorefrontIds } } }),
        );
      }

      return Promise.all(promises);
    });

    this.fetchQueueMemberReferences$ = this.$queueMembers.subscribe((qms) => {
      const missingQueueIds = qms
        .filter((qm) => !this.queueQuery.hasEntity(qm.queueId))
        .reduce((p, c) => this.getGroupsByNamespaceId(c, 'queueId', p), {});

      const promises = [];
      for (const [key, value] of Object.entries(missingQueueIds)) {
        promises.push(this.queueService.find(key, { where: { _id: { $in: value } } }));
      }

      return Promise.all(promises);
    });

    this.matchInvitationService.emitter.on('create', this.onMatchInvitationServiceCreate);
    this.matchService.emitter.on('create', this.onMatchServiceCreate);

    return Promise.all([
      this.matchService.find(null, { where: { 'teams.userIds': userId } }),
      this.queueMemberService.find(null, { where: { userIds: userId } }),
    ]);
  }

  public ngOnDestroy() {
    this.fetchMatchReferences$.unsubscribe();
    this.fetchQueueMemberReferences$.unsubscribe();
    this.updateQueueMembers$.unsubscribe();
  }

  public getQueue(_id: string) {
    const queue = this.queueQuery.getEntity(_id);
    return new QueueModel(queue);
  }

  public getStorefront(namespaceId: string) {
    const [storefront] = this.storefrontQuery.getAll({
      filterBy: (s) => s.namespaceId === namespaceId,
    });
    return new StorefrontModel(storefront);
  }

  public async joinMatch(match: MatchModel) {
    this.openDialog({ match });
  }

  public async leaveQueue(queueMember: QueueMemberModel) {
    await this.queueMemberService.delete(queueMember.namespaceId, queueMember._id);
  }

  private getGroupsByNamespaceId(current: any, key: string, previous: any) {
    const { namespaceId } = current;
    const value = current[key];

    previous[namespaceId] = previous[namespaceId] ? [...previous[namespaceId], value] : [value];

    return previous;
  }

  private focusWindow() {
    const window = this.electronService.remote.getCurrentWindow();
    window.flashFrame(true);
    window.show();

    if (!window.isFocused()) {
      window.on('focus', () => window.setAlwaysOnTop(false));
      window.setAlwaysOnTop(true);
    }
  }

  private async newMatchInvitationNotification(matchInvitation: MatchInvitationModel) {
    if (matchInvitation.userId !== this.identityService.user._id) {
      return;
    }

    this.focusWindow();
    this.openDialog({ matchInvitation });
  }

  private async newMatchNotification(match: MatchModel) {
    if (!match.userIds.includes(this.identityService.user._id)) {
      return;
    }

    this.focusWindow();
    this.openDialog({ match });
  }

  private openDialog(data: MatchPromptComponentData) {
    if (this.matDialogRef) {
      this.matDialogRef.close();
    }

    const options = { autoFocus: false, data, disableClose: true };
    this.matDialogRef = this.matDialog.open(MatchPromptComponent, options);
  }
}
