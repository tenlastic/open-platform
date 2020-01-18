import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IdentityService } from '@tenlastic/ng-authentication';
import { IRelease, Release } from '@tenlastic/ng-http';
import * as JSZip from 'jszip';

import { FileReaderService } from '../../../../core/services';

export interface FileFormComponentData {
  platform: IRelease.Platform;
}

export interface UpdatedFile {
  arrayBuffer: ArrayBuffer;
  md5: string;
  relativePath: string;
  size: number;
}

@Component({
  selector: 'app-files-form',
  templateUrl: 'files-form.component.html',
  styleUrls: ['files-form.component.scss'],
})
export class FilesFormComponent implements OnInit {
  @Input() public release = new Release();
  @Output() public OnSubmit = new EventEmitter<FileFormComponentData>();

  public error: string;
  public executable: string;
  public executables: string[] = [];
  public form: FormGroup;
  public processingMessage: string;
  public updatedFiles: UpdatedFile[] = [];

  constructor(
    private fileReaderService: FileReaderService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
  ) {}

  public ngOnInit() {
    this.setupForm();
  }

  public async onSubmit($event) {
    $event.preventDefault();

    if (this.form.invalid) {
      this.form.get('platform').markAsTouched();
      this.form.get('zip').markAsTouched();

      return;
    }

    const zip = new JSZip();
    this.updatedFiles.forEach(updatedFile => {
      const blob = this.fileReaderService.arrayBufferToBlob(updatedFile.arrayBuffer);
      zip.file(updatedFile.relativePath, blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    this.form.get('zip').setValue(zipBlob);

    this.OnSubmit.emit({
      platform: this.form.get('platform').value,
    });
  }

  public async onFilesChanged($event) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    this.executables = [];
    this.processingMessage = 'Calculating file changes...';
    this.updatedFiles = [];

    for (const file of files) {
      const content = await this.fileReaderService.fileToArrayBuffer(file);
      const relativePath = file.webkitRelativePath.substring(
        file.webkitRelativePath.indexOf('/') + 1,
      );

      const executableRegex = /^.*\.exe$/;
      if (executableRegex.test(relativePath)) {
        this.executables.push(relativePath);
      }

      const md5 = this.fileReaderService.arrayBufferToMd5(content);
      this.updatedFiles.push({ arrayBuffer: content, md5, relativePath, size: file.size });
    }

    this.processingMessage = null;
  }

  private setupForm(): void {
    this.form = this.formBuilder.group({});

    this.form.valueChanges.subscribe(() => (this.error = null));
  }
}
