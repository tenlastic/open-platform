import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BuildModel, BuildService, IBuild } from '@tenlastic/ng-http';

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
  @Input() public build = new BuildModel();
  @Input() public form: FormGroup;
  @ViewChild('selectFilesInput', { static: true }) public selectFilesInput: ElementRef;

  public builds: BuildModel[] = [];
  public files: UpdatedFile[] = [];
  public get isNew() {
    return !this.build._id;
  }
  public get modifiedFiles() {
    return this.form.get('files').value.filter((f) => f.status === 'modified');
  }
  public referenceBuild: BuildModel;
  public get referenceFiles() {
    return this.form.get('reference').get('files').value;
  }
  public removedFiles: IBuild.File[] = [];
  public status: string;
  public get unmodifiedFiles() {
    return this.form.get('files').value.filter((f) => f.status === 'unmodified');
  }

  constructor(private buildService: BuildService) {}

  public async ngOnInit() {
    if (this.isNew) {
      await this.getReferenceBuilds();
      this.form.get('platform').valueChanges.subscribe(() => this.getReferenceBuilds());
    }

    this.form
      .get('reference')
      .get('_id')
      .valueChanges.subscribe((value) => {
        const build = this.builds.find((b) => b._id === value);
        this.setReferenceBuild(build);
      });
  }

  public setEntrypoint(value: string) {
    if (this.form.get('entrypoint').enabled) {
      this.form.get('entrypoint').setValue(value);
    }
  }

  public async onFilesChanged($event) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    if (this.referenceBuild && this.referenceBuild.entrypoint) {
      this.form.get('entrypoint').setValue(this.referenceBuild.entrypoint);
    }

    this.form.get('files').disable({ emitEvent: false });
    this.status = 'Calculating file changes...';

    this.form.get('files').setValue([]);
    await new Promise<void>((resolve) => {
      const worker = new Worker(
        new URL('../../../../../../workers/file-reader.worker', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = ({ data }) => {
        if (data.file) {
          if (this.referenceBuild) {
            const referenceFile = this.referenceBuild.files.find((f) => f.path === data.file.path);

            if (referenceFile) {
              data.file.status = data.file.md5 === referenceFile.md5 ? 'unmodified' : 'modified';
            } else {
              data.file.status = 'modified';
            }
          } else {
            data.file.status = 'modified';
          }

          this.form.get('files').value.push(data.file);
        }

        if (data.isDone) {
          return resolve();
        }
      };

      worker.postMessage({
        files,
        referenceFiles: this.referenceBuild ? this.referenceBuild.files : [],
      });
    });

    this.removedFiles = [];
    if (this.referenceBuild) {
      for (const referenceFile of this.referenceBuild.files) {
        const file = this.form.get('files').value.find((f) => f.path === referenceFile.path);

        if (!file) {
          this.removedFiles.push(referenceFile);
        }
      }
    }

    const sorted = this.form.get('files').value.sort((a, b) => this.sort(a.path, b.path));
    this.form.get('files').setValue(sorted);

    this.form.get('files').enable({ emitEvent: false });
    this.selectFilesInput.nativeElement.value = '';
    this.status = null;
  }

  public setReferenceBuild(build: BuildModel) {
    this.referenceBuild = build;
    this.form
      .get('reference')
      .get('_id')
      .setValue(this.referenceBuild ? this.referenceBuild._id : null, { emitEvent: false });
    this.form
      .get('reference')
      .get('files')
      .setValue(this.referenceBuild ? this.referenceBuild.files.map((f) => f.path) : [], {
        emitEvent: false,
      });

    if (this.form.get('files').value.length > 0) {
      for (const file of this.form.get('files').value) {
        if (this.referenceBuild) {
          const referenceFile = this.referenceBuild.files.find((f) => f.path === file.path);

          if (referenceFile) {
            file.status = file.md5 === referenceFile.md5 ? 'unmodified' : 'modified';
          } else {
            file.status = 'modified';
          }
        } else {
          file.status = 'modified';
        }
      }

      this.removedFiles = [];
      if (this.referenceBuild) {
        for (const referenceFile of this.referenceBuild.files) {
          const file = this.form.get('files').value.find((f) => f.path === referenceFile.path);

          if (!file) {
            this.removedFiles.push(referenceFile);
          }
        }
      }
    } else {
      if (this.referenceBuild?.entrypoint) {
        this.form.get('entrypoint').setValue(this.referenceBuild.entrypoint);
      }

      this.form.get('files').setValue([]);
      this.removedFiles = [];
    }
  }

  public useReferenceFiles() {
    if (this.referenceBuild?.entrypoint) {
      this.form.get('entrypoint').setValue(this.referenceBuild.entrypoint);
    }

    this.form.get('files').setValue([]);
    this.removedFiles = [];
  }

  private async getReferenceBuilds() {
    const namespaceId = this.form.get('namespaceId').value;

    this.builds = await this.buildService.find(namespaceId, {
      sort: '-publishedAt -createdAt',
      where: { platform: this.form.get('platform').value },
    });

    const build = this.builds.find((r) => r.publishedAt);
    this.setReferenceBuild(build || this.builds[0]);
  }

  private sort(a: string, b: string) {
    const aSplit = a.split('/').length;
    const bSplit = b.split('/').length;

    if (aSplit < bSplit) {
      return -1;
    } else if (aSplit > bSplit) {
      return 1;
    } else {
      return a < b ? -1 : a > b ? 1 : 0;
    }
  }
}
