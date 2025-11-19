import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  BuildModel,
  BuildService,
  BuildState,
  IAuthorization,
  IBuild,
  WebSocketService,
} from '@tenlastic/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { formatDate } from '@angular/common';
import { IdentityService, OverlayReference, OverlayService } from '@home/app/core/services';
import {
  ListTableColumn,
  ListTableSubscription,
  PromptOverlayComponent,
  PromptOverlayComponentData,
} from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

@Component({
  standalone: false,
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class BuildsListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<BuildModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<BuildModel>[] = [
    { header: 'Name', text: (v) => v.name },
    { header: 'Platform', text: (v) => this.getPlatform(v.platform) },
    { header: 'Status', text: (v) => (v.status ? v.status.phase : 'Pending') },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
  ];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: BuildModel,
      request: { _id: uuid(), path: `/subscriptions/builds` },
      service: this.buildService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  private namespaceId: string;
  private get where() {
    const where: any = { namespaceId: this.namespaceId };

    if (this.$filter.value) {
      where.$or = [
        { name: { $regex: this.$filter.value, $options: 'i' } },
        { 'status.phase': { $regex: this.$filter.value, $options: 'i' } },
      ];
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private buildState: BuildState,
    private buildService: BuildService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private overlayService: OverlayService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.$records = this.buildState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.BuildsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(this.namespaceId, roles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.buildService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: BuildModel) => {
    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (!this.$filter.value) {
      return true;
    }

    const regex = new RegExp(this.$filter.value, 'i');
    return regex.test(record.name) || regex.test(record.status.phase);
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.buildService.find(this.namespaceId, {
      limit: pageSize,
      select: '-files -reference.files',
      skip: page * pageSize,
      sort: '-createdAt',
      where: this.where,
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: BuildModel) => {
    return [record._id];
  };

  public async publish($event: Event, build: BuildModel) {
    $event.stopPropagation();

    if (build.platform === IBuild.Platform.Server64 && build.reference) {
      let referenceBuild: BuildModel;

      try {
        referenceBuild = await this.buildService.findOne(build.namespaceId, build.reference._id);
      } catch {}

      const dialogRef = this.overlayService.open<PromptOverlayComponentData, string>(
        PromptOverlayComponent,
        {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: referenceBuild
            ? `Publishing this Build will restart and update Game Servers that use its Reference Build (${referenceBuild.name}). ` +
              `Are you sure you want to publish this Build?`
            : `Publishing this Build will restart and update Game Servers that use its Reference Build. ` +
              `Are you sure you want to publish this Build?`,
        },
      );

      dialogRef.$close.subscribe(async (result) => {
        if (result === 'Yes') {
          await this.buildService.update(build.namespaceId, build._id, { publishedAt: new Date() });
          this.matSnackBar.open('Build published successfully.');
        }
      });
    } else {
      await this.buildService.update(build.namespaceId, build._id, { publishedAt: new Date() });
      this.matSnackBar.open('Build published successfully.');
    }
  }

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public async showDeletePrompt($event: Event, record: BuildModel) {
    $event.stopPropagation();

    let overlay: OverlayReference<string>;

    if (record.platform === IBuild.Platform.Server64 && record.reference) {
      let referenceBuild: BuildModel;

      try {
        referenceBuild = await this.buildService.findOne(record.namespaceId, record.reference._id);
      } catch {}

      overlay = this.overlayService.open<PromptOverlayComponentData, string>(
        PromptOverlayComponent,
        {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: referenceBuild
            ? `Deleting this Build will restart and rollback Game Servers to use its Reference Build (${referenceBuild.name}). ` +
              'Are you sure you want to delete this Build?'
            : 'Deleting this Build will restart and rollback Game Servers to use its Reference Build. ' +
              'Are you sure you want to delete this Build?',
        },
      );
    } else {
      overlay = this.overlayService.open<PromptOverlayComponentData, string>(
        PromptOverlayComponent,
        {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: 'Are you sure you want to delete this Build?',
        },
      );
    }

    overlay.$close.subscribe(async (result) => {
      if (result === 'Yes') {
        await this.buildService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Build deleted successfully.');
      }
    });
  }

  public async unpublish($event: Event, build: BuildModel) {
    $event.stopPropagation();

    if (build.platform === IBuild.Platform.Server64 && build.reference) {
      let referenceBuild: BuildModel;

      try {
        referenceBuild = await this.buildService.findOne(build.namespaceId, build.reference._id);
      } catch {}

      const dialogRef = this.overlayService.open<PromptOverlayComponentData, string>(
        PromptOverlayComponent,
        {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: referenceBuild
            ? `Unpublishing this Build will restart and rollback Game Servers to use its Reference Build (${referenceBuild.name}). ` +
              `Are you sure you want to unpublish this Build?`
            : `Unpublishing this Build will restart and rollback Game Servers to use its Reference Build. ` +
              `Are you sure you want to unpublish this Build?`,
        },
      );

      dialogRef.$close.subscribe(async (result) => {
        if (result === 'Yes') {
          await this.buildService.update(build.namespaceId, build._id, { publishedAt: null });
          this.matSnackBar.open('Build unpublished successfully.');
        }
      });
    } else {
      await this.buildService.update(build.namespaceId, build._id, { publishedAt: null });
      this.matSnackBar.open('Build unpublished successfully.');
    }
  }

  private getPlatform(platform: string) {
    const map = {
      [IBuild.Platform.Server64]: 'Linux Server (x64)',
      [IBuild.Platform.Windows64]: 'Windows Client (x64)',
    };

    return map[platform];
  }
}
