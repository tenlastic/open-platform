import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { IdentityService } from '@tenlastic/ng-authentication';
import { FileService, IRelease, Release, ReleaseService } from '@tenlastic/ng-http';
import JSZip from 'jszip';

import { FileReaderService } from '../../../../core/services';
import { MatSelectChange } from '@angular/material';

export interface FileFormComponentData {
  platform: IRelease.Platform;
}

export interface UpdatedFile {
  arrayBuffer?: ArrayBuffer;
  md5: string;
  path: string;
  size: number;
  status: string;
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

  public error: string;
  public loadingMessage: string;
  public get modifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'modified');
  }
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

  constructor(
    private fileReaderService: FileReaderService,
    private fileService: FileService,
    public identityService: IdentityService,
    private releaseService: ReleaseService,
  ) {}

  public async ngOnInit() {
    this.releases = await this.releaseService.find({
      sort: 'publishedAt',
      where: { gameId: this.release.gameId },
    });

    if (this.releases.length) {
      const release = this.releases.find(r => r.publishedAt);
      await this.setPreviousRelease(release);
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

    const sortArray = ['modified', 'removed', 'unmodified'];
    for (const file of files) {
      const content = await this.fileReaderService.fileToArrayBuffer(file);
      const path = file.webkitRelativePath.substring(file.webkitRelativePath.indexOf('/') + 1);
      const previousFile = this.previousFiles.find(p => p.path === path);

      const md5 = this.fileReaderService.arrayBufferToMd5(content);
      const status = !previousFile || previousFile.md5 !== md5 ? 'modified' : 'unmodified';

      this.stagedFiles.push({ arrayBuffer: content, md5, path, size: file.size, status });
      this.stagedFiles.sort((a, b) => sortArray.indexOf(a.status) - sortArray.indexOf(b.status));
    }

    const updatedFilePaths = this.stagedFiles.map(u => u.path);
    const removedFiles = this.previousFiles
      .filter(f => !updatedFilePaths.includes(f.path))
      .map(f => ({ md5: f.md5, path: f.path, size: 0, status: 'removed' }));
    this.stagedFiles = this.stagedFiles
      .concat(removedFiles)
      .sort((a, b) => sortArray.indexOf(a.status) - sortArray.indexOf(b.status));

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
    this.stagedFiles
      .filter(u => u.status === 'modified')
      .forEach(u => {
        const blob = this.fileReaderService.arrayBufferToBlob(u.arrayBuffer);
        zip.file(u.path, blob);
      });

    const zipBlob = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: {
        level: 5,
      },
      type: 'blob',
    });

    this.status = 'Uploading files...';

    await this.fileService.upload(this.release._id, this.platform, {
      modified: this.modifiedFiles.map(f => f.path),
      previousReleaseId: this.previousRelease._id,
      removed: this.removedFiles.map(f => f.path),
      unmodified: this.unmodifiedFiles.map(f => f.path),
      zip: zipBlob,
    });

    this.status = null;
  }
}
