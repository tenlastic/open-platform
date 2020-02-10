import { HttpEvent, HttpEventType } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { IdentityService } from '@tenlastic/ng-authentication';
import {
  FileService,
  IRelease,
  Release,
  ReleaseService,
  ReleaseTask,
  ReleaseTaskService,
} from '@tenlastic/ng-http';
import JSZip from 'jszip';
import { last, map, tap } from 'rxjs/operators';

import { FileReaderService } from '../../../../core/services';

export interface FileFormComponentData {
  platform: IRelease.Platform;
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
export class FilesFormComponent implements OnInit {
  @Input() public platform: string;
  @Input() public release = new Release();
  @Output() public OnSubmit = new EventEmitter<FileFormComponentData>();
  @ViewChild('selectFilesInput', { static: true }) public selectFilesInput: ElementRef;

  public TASKS = {
    copy: 'Copy',
    remove: 'Remove',
    unzip: 'Unzip',
  };

  public error: string;
  public loadingMessage: string;
  public get modifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'modified');
  }
  public tasks: ReleaseTask[] = [];
  public previousFiles: any[] = [];
  public previousRelease: Release;
  public releases: Release[] = [];
  public get removedFiles() {
    return this.stagedFiles.filter(f => f.status === 'removed');
  }
  public stagedFiles: UpdatedFile[] = [];
  public status: string;
  public get unmodifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'unmodified');
  }
  public uploadStatus: any;
  public zipStatus: any;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private fileReaderService: FileReaderService,
    private fileService: FileService,
    public identityService: IdentityService,
    private releaseTaskService: ReleaseTaskService,
    private releaseService: ReleaseService,
  ) {}

  public async ngOnInit() {
    this.releases = await this.releaseService.find({
      sort: 'publishedAt',
      where: { gameId: this.release.gameId },
    });

    if (this.releases.length) {
      const release = this.releases.find(r => r.publishedAt);
      await this.setPreviousRelease(release || this.releases[0]);
    }
  }

  public cancel() {
    this.selectFilesInput.nativeElement.value = [];
    this.stagedFiles = [];
  }

  public async onFilesChanged($event) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    this.status = 'Calculating file changes...';

    this.stagedFiles = [];
    await new Promise(resolve => {
      const worker = new Worker('../../../../workers/file-reader.worker', { type: 'module' });
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

  public async setPreviousRelease(value: Release) {
    this.cancel();
    this.status = 'Retrieving files from previous Release...';

    this.previousRelease = value;

    this.previousFiles = await this.fileService.find(this.previousRelease._id, this.platform, {
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
      .upload(this.release._id, this.platform, {
        modified: this.modifiedFiles.map(f => f.path),
        previousReleaseId: this.previousRelease._id,
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

    do {
      this.tasks = await this.releaseTaskService.find(this.release._id, {
        where: { completedAt: { $eq: null } },
      });

      if (this.tasks.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } while (this.tasks.length > 0);

    this.status = null;
    this.uploadStatus = null;

    this.setPreviousRelease(this.releases.find(r => r._id === this.release._id));
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
}
