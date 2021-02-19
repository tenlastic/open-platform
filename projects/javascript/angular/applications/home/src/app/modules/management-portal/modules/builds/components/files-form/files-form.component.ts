import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Build, BuildQuery, BuildService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';

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
  @Input() public build = new Build();
  @Input() public form: FormGroup;
  @ViewChild('selectFilesInput', { static: true }) public selectFilesInput: ElementRef;

  public builds: Build[] = [];
  public get modifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'modified');
  }
  public referenceBuild: Build;
  public get removedFiles() {
    return this.stagedFiles.filter(f => f.status === 'removed');
  }
  public stagedFiles: UpdatedFile[] = [];
  public status: string;
  public get unmodifiedFiles() {
    return this.stagedFiles.filter(f => f.status === 'unmodified');
  }

  constructor(private buildService: BuildService) {}

  public async ngOnInit() {
    const referenceId = this.form.get('reference').get('_id').value;

    if (referenceId) {
      const build = await this.buildService.findOne(referenceId);
      this.setReferenceBuild(build);
    } else if (!this.build._id) {
      this.form.get('platform').valueChanges.subscribe(() => this.getReferenceBuilds());
    }

    this.form
      .get('reference')
      .get('_id')
      .valueChanges.subscribe(value => {
        const build = this.builds.find(b => b._id === value);
        this.setReferenceBuild(build);
      });
  }

  public cancel() {
    this.form.get('entrypoint').setValue(null);
    this.selectFilesInput.nativeElement.value = [];
    this.stagedFiles = [];
  }

  public setEntrypoint(value: string) {
    this.form.get('entrypoint').setValue(value);
  }

  public async onFilesChanged($event) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    this.form
      .get('entrypoint')
      .setValue((this.referenceBuild && this.referenceBuild.entrypoint) || '');
    this.status = 'Calculating file changes...';

    this.stagedFiles = [];
    await new Promise<void>(resolve => {
      const worker = new Worker('../../../../../../workers/file-reader.worker', { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.file) {
          this.stagedFiles.push(data.file);
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

    this.stagedFiles = this.stagedFiles.sort((a, b) =>
      a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
    );

    this.form.get('files').setValue(this.stagedFiles);
    this.status = null;
  }

  public setReferenceBuild(build: Build) {
    if (!build) {
      return;
    }

    this.referenceBuild = build;
    this.form
      .get('reference')
      .get('_id')
      .setValue(build._id);
  }

  private async getReferenceBuilds() {
    this.builds = await this.buildService.find({
      sort: '-publishedAt',
      where: {
        namespaceId: this.form.get('namespaceId').value,
        platform: this.form.get('platform').value,
      },
    });

    const build = this.builds.find(r => r.publishedAt);
    this.setReferenceBuild(build || this.builds[0]);
  }
}
