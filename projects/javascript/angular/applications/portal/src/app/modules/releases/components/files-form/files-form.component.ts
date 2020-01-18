import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IdentityService } from '@tenlastic/ng-authentication';
import { IRelease, Release } from '@tenlastic/ng-http';

import { FileReaderService } from '../../../../core/services';

export interface FileFormComponentData {
  platform: IRelease.Platform;
}

export interface UpdatedFile {
  arrayBuffer: ArrayBuffer;
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

      this.updatedFiles.push({ arrayBuffer: content, relativePath, size: file.size });
    }

    this.processingMessage = null;
  }

  private setupForm(): void {
    this.form = this.formBuilder.group({});

    this.form.valueChanges.subscribe(() => (this.error = null));
  }
}
