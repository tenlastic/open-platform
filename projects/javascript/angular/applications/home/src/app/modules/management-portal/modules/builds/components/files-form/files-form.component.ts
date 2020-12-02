import { HttpEvent, HttpEventType } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';
import {
  Build,
  BuildService,
  BuildTask,
  BuildTaskQuery,
  BuildTaskService,
  FileService,
  IBuild,
} from '@tenlastic/ng-http';
import JSZip from 'jszip';
import { Observable, Subscription } from 'rxjs';
import { last, map, tap } from 'rxjs/operators';

import { FileReaderService, IdentityService } from '../../../../../../core/services';
import { Order, sortByOptions } from '@datorama/akita';
import { MAT_SORT_HEADER_INTL_PROVIDER } from '@angular/material';

export interface FileFormComponentData {
  platform: IBuild.Platform;
}

export interface UpdatedFile {
  arrayBuffer?: ArrayBuffer;
  md5: string;
  path: string;
  status: string;
  uncompressedBytes?: number;
}

@Component({
  selector: 'app-files-form',
  templateUrl: 'files-form.component.html',
  styleUrls: ['files-form.component.scss'],
})
export class FilesFormComponent implements OnDestroy, OnInit {
  @Input() public build = new Build();
  @Input() public platform: string;
  @Output() public OnSubmit = new EventEmitter<FileFormComponentData>();
  @ViewChild('selectFilesInput', { static: true }) public selectFilesInput: ElementRef;

  public TASKS = {
    build: 'Build',
    copy: 'Copy',
    remove: 'Remove',
    unzip: 'Unzip',
  };

  public $tasks: Observable<BuildTask[]>;
  public setTasks$ = new Subscription();
  public builds: Build[] = [];
  public error: string;
  public get finishedTasks() {
    return this.tasks.filter(t => t.completedAt || t.failedAt);
  }
  public loadingMessage: string;
  public get modifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'modified');
  }
  public previousBuild: Build;
  public previousFiles: any[] = [];
  public get removedFiles() {
    return this.stagedFiles.filter(f => f.status === 'removed');
  }
  public stagedEntrypoint: FormControl;
  public stagedFiles: UpdatedFile[] = [];
  public status: string;
  public tasks: BuildTask[] = [];
  public get unmodifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'unmodified');
  }
  public get unfinishedTasks() {
    return this.tasks.filter(t => !t.completedAt && !t.failedAt);
  }
  public uploadStatus: any;
  public zipStatus: any;

  constructor(
    private buildService: BuildService,
    private buildTaskQuery: BuildTaskQuery,
    private buildTaskService: BuildTaskService,
    private changeDetectorRef: ChangeDetectorRef,
    private fileReaderService: FileReaderService,
    private fileService: FileService,
    public identityService: IdentityService,
  ) {}

  public async ngOnInit() {
    this.builds = await this.buildService.find({
      sort: '-publishedAt',
      where: { namespaceId: this.build.namespaceId },
    });

    if (this.builds.length) {
      const build = this.builds.find(r => r.publishedAt);
      await this.setPreviousBuild(build || this.builds[0]);
    }

    this.getBuildTasks();
  }

  public ngOnDestroy() {
    this.setTasks$.unsubscribe();
  }

  public cancel() {
    this.stagedEntrypoint = null;
    this.selectFilesInput.nativeElement.value = [];
    this.stagedFiles = [];
  }

  public getBuildTaskStatusText(buildTask: BuildTask) {
    const datePipe = new DatePipe('en-US');

    if (buildTask.completedAt) {
      return `Completed at ${datePipe.transform(buildTask.completedAt, 'h:mm a on M/d/yy')}`;
    } else if (buildTask.failedAt) {
      return `Failed at ${datePipe.transform(buildTask.failedAt, 'h:mm a on M/d/yy')}`;
    } else if (buildTask.startedAt) {
      return `Started at ${datePipe.transform(buildTask.startedAt, 'h:mm a on M/d/yy')}`;
    } else {
      return `Created at ${datePipe.transform(buildTask.createdAt, 'h:mm a on M/d/yy')}`;
    }
  }

  public async onFilesChanged($event) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    this.stagedEntrypoint = new FormControl(
      this.previousBuild.entrypoints[this.platform] || '',
      Validators.required,
    );
    this.status = 'Calculating file changes...';

    this.stagedFiles = [];
    await new Promise(resolve => {
      const worker = new Worker('../../../../../../workers/file-reader.worker', { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.file) {
          this.stagedFiles.push(data.file);
        }

        if (data.isDone) {
          return resolve();
        }
      };
      worker.postMessage({ files, previousFiles: this.previousFiles });
    });

    this.stagedFiles = this.stagedFiles.sort((a, b) =>
      a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
    );

    this.status = null;
  }

  public async setPreviousBuild(value: Build) {
    this.cancel();
    this.status = 'Retrieving files from previous Build...';

    const build = this.builds.find(b => b._id === value._id);
    Object.assign(build, value);

    this.previousBuild = build;

    this.previousFiles = await this.fileService.find(this.previousBuild._id, this.platform, {
      limit: 1000,
      sort: 'path',
    });

    this.status = null;
  }

  public async upload() {
    if (this.stagedEntrypoint.invalid) {
      this.stagedEntrypoint.markAsTouched();
      return;
    }

    this.status = 'Saving entrypoint...';
    this.build.entrypoints[this.platform] = this.stagedEntrypoint.value;
    this.build = await this.buildService.update(this.build);

    this.status = 'Zipping files...';

    const zip = new JSZip();
    const zipFiles = this.stagedFiles.filter(u => u.status === 'modified');
    zipFiles.forEach(u => {
      const blob = this.fileReaderService.arrayBufferToBlob(u.arrayBuffer);
      zip.file(u.path, blob);
    });

    const zipBlob = await zip.generateAsync(
      {
        compression: 'DEFLATE',
        compressionOptions: {
          level: 5,
        },
        type: 'blob',
      },
      metadata => {
        const total = zipFiles.length;
        this.zipStatus = { current: Math.floor(total * (metadata.percent / 100)), total };

        this.changeDetectorRef.detectChanges();
      },
    );
    this.zipStatus = null;

    this.status = 'Uploading files...';
    await this.fileService
      .upload(this.build._id, this.platform, {
        modified: this.modifiedFiles.map(f => f.path),
        previousBuildId: this.previousBuild._id,
        removed: this.removedFiles.map(f => f.path),
        unmodified: this.unmodifiedFiles.map(f => f.path),
        zip: zipBlob,
      })
      .pipe(
        map(event => this.getEventMessage(event, zipBlob)),
        tap(message => (this.uploadStatus = message)),
        last(),
      )
      .toPromise();

    this.status = 'Waiting for background tasks...';
    this.uploadStatus = null;

    while (this.unfinishedTasks.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.status = null;
    this.uploadStatus = null;

    this.setPreviousBuild(this.build);
  }

  private getEventMessage(event: HttpEvent<any>, blob: Blob) {
    const file = new File([blob], 'file');

    switch (event.type) {
      case HttpEventType.Sent:
        return { current: 0, total: file.size };

      case HttpEventType.UploadProgress:
        return { current: event.loaded, total: event.total };

      case HttpEventType.Response:
        return { current: file.size, total: file.size };
    }
  }

  private async getBuildTasks() {
    this.$tasks = this.buildTaskQuery.selectAll({
      filterBy: t => t.buildId === this.build._id && t.platform === this.platform,
      sortBy: 'createdAt',
      sortByOrder: Order.DESC,
    });
    this.setTasks$ = this.$tasks.subscribe(t => (this.tasks = t));

    await this.buildTaskService.find(this.build._id, {
      sort: '-createdAt',
      where: { platform: this.platform },
    });
  }
}
