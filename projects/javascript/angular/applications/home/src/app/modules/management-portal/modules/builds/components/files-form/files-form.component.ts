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
import {
  Build,
  BuildService,
  BuildTask,
  BuildTaskService,
  FileService,
  IBuild,
} from '@tenlastic/ng-http';
import JSZip from 'jszip';
import { last, map, tap } from 'rxjs/operators';

import { FileReaderService, IdentityService } from '../../../../../../core/services';

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
  @Input() public platform: string;
  @Input() public build = new Build();
  @Output() public OnSubmit = new EventEmitter<FileFormComponentData>();
  @ViewChild('selectFilesInput', { static: true }) public selectFilesInput: ElementRef;

  public TASKS = {
    build: 'Build',
    copy: 'Copy',
    remove: 'Remove',
    unzip: 'Unzip',
  };

  public builds: Build[] = [];
  public error: string;
  public get finishedTasks() {
    return this.tasks.filter(t => t.completedAt || t.failedAt);
  }
  public loadingMessage: string;
  public get modifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'modified');
  }
  public tasks: BuildTask[] = [];
  public previousFiles: any[] = [];
  public previousBuild: Build;
  public get removedFiles() {
    return this.stagedFiles.filter(f => f.status === 'removed');
  }
  public stagedFiles: UpdatedFile[] = [];
  public status: string;
  public get unmodifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'unmodified');
  }
  public get unfinishedTasks() {
    return this.tasks.filter(t => !t.completedAt && !t.failedAt);
  }
  public uploadStatus: any;
  public zipStatus: any;

  private isDestroyed = false;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private fileReaderService: FileReaderService,
    private fileService: FileService,
    public identityService: IdentityService,
    private buildTaskService: BuildTaskService,
    private buildService: BuildService,
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
    this.isDestroyed = true;
  }

  public cancel() {
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

    this.previousBuild = value;

    this.previousFiles = await this.fileService.find(this.previousBuild._id, this.platform, {
      limit: 1000,
      sort: 'path',
    });

    this.status = null;
  }

  public async upload() {
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

    this.tasks = await this.buildTaskService.find(this.build._id, {
      where: { platform: { $eq: this.platform } },
    });

    while (this.unfinishedTasks.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 15000));
    }

    this.status = null;
    this.uploadStatus = null;

    this.setPreviousBuild(this.builds.find(r => r._id === this.build._id));
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
    if (this.isDestroyed) {
      return;
    }

    try {
      this.tasks = await this.buildTaskService.find(this.build._id, {
        sort: '-createdAt',
        where: { platform: this.platform },
      });

      await new Promise(resolve => setTimeout(resolve, 15000));
    } catch {}

    return this.getBuildTasks();
  }
}
