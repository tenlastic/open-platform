import { Component, Input, OnInit } from '@angular/core';
import { QueueMemberModel, QueueMemberService, QueueQuery, QueueService } from '@tenlastic/http';

@Component({
  selector: 'app-queue-member-button',
  styleUrls: ['./queue-member-button.component.scss'],
  templateUrl: './queue-member-button.component.html',
})
export class QueueMemberButtonComponent implements OnInit {
  @Input() public queueMember: QueueMemberModel;

  constructor(
    private queueMemberService: QueueMemberService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
  ) {}

  public async ngOnInit() {
    if (!this.queueQuery.hasEntity(this.queueMember.queueId)) {
      await this.queueService.find(this.queueMember.namespaceId, {
        where: { _id: this.queueMember.queueId },
      });
    }
  }

  public getQueue(_id: string) {
    return this.queueQuery.getEntity(_id);
  }

  public async leave(queueMember: QueueMemberModel) {
    await this.queueMemberService.delete(queueMember.namespaceId, queueMember._id);
  }
}
