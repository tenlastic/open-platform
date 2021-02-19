import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatTreeNestedDataSource } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Build, BuildQuery, BuildService } from '@tenlastic/ng-http';
import JSZip from 'jszip';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  FileReaderService,
  IdentityService,
  SelectedNamespaceService,
  SocketService,
} from '../../../../../../core/services';
import { UpdatedFile } from '../../components';

interface Progress {
  current: number;
  total: number;
}

interface StatusNode {
  children: StatusNode[];
}

enum Status {
  Ready,
  Uploading,
  Zipping,
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class BuildsFormPageComponent implements OnDestroy, OnInit {
  public $data: Observable<Build>;
  public Status = Status;
  public data: Build;
  public dataSource = new MatTreeNestedDataSource<StatusNode>();
  public errors: string[] = [];
  public form: FormGroup;
  public platforms = [
    { label: 'Linux Server (x64)', value: 'server64' },
    { label: 'Windows Client (x64)', value: 'windows64' },
  ];
  public progress: Progress;
  public status = Status.Ready;
  public treeControl = new NestedTreeControl<StatusNode>(node => node.children);

  private buildSubscriptionId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private changeDetectorRef: ChangeDetectorRef,
    private fileReaderService: FileReaderService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
    private socketService: SocketService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.buildService.findOne(_id);
        this.dataSource.data = this.data.getNestedStatusNodes();

        this.buildSubscriptionId = this.socketService.subscribe(
          'builds',
          Build,
          this.buildService,
          {
            _id: { $eq: _id },
          },
        );
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.socketService.unsubscribe(this.buildSubscriptionId);
  }

  public hasChild(_: number, node: StatusNode) {
    return !!node.children && node.children.length > 0;
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<Build> = {
      entrypoint: this.form.get('entrypoint').value,
      namespaceId: this.form.get('namespaceId').value,
      platform: this.form.get('platform').value,
      version: this.form.get('version').value,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, {
        entrypoint: 'Entrypoint',
        namespaceId: 'Namespace',
        platform: 'Platform',
        version: 'Version',
      });
    }
  }

  private async create(data: Partial<Build>) {
    const files: UpdatedFile[] = this.form.get('files').value;

    const unmodifiedFiles = files.filter(u => u.status === 'unmodified');
    this.form
      .get('reference')
      .get('files')
      .setValue(unmodifiedFiles.map(f => f.path));

    const modifiedFiles = files.filter(u => u.status === 'modified');

    this.form.disable();
    this.progress = { current: 0, total: modifiedFiles.length };
    this.status = Status.Zipping;

    const zip = new JSZip();
    for (const file of modifiedFiles) {
      const fileBlob = this.fileReaderService.arrayBufferToBlob(file.arrayBuffer);
      zip.file(file.path, fileBlob);
    }

    const zipBlob = await zip.generateAsync(
      {
        compression: 'DEFLATE',
        compressionOptions: { level: 5 },
        type: 'blob',
      },
      metadata => {
        const total = modifiedFiles.length;
        this.progress = { current: Math.floor(total * (metadata.percent / 100)), total };

        this.changeDetectorRef.detectChanges();
      },
    );

    this.progress = { current: 0, total: zipBlob.size };
    this.status = Status.Uploading;

    const result = await new Promise<Build>(resolve => {
      this.buildService.create(data, zipBlob).subscribe(event => {
        const file = new File([zipBlob], 'file');

        switch (event.type) {
          case HttpEventType.Sent:
            this.progress = { current: 0, total: file.size };
            return;

          case HttpEventType.UploadProgress:
            this.progress = { current: event.loaded, total: event.total };
            return;

          case HttpEventType.Response:
            return resolve(event.body.record);
        }
      });
    });

    this.data = new Build(result);
    this.form.enable();
    this.progress = null;
    this.status = Status.Ready;
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map(e => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map(p => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    this.data = this.data || new Build();

    this.form = this.formBuilder.group({
      entrypoint: [this.data.entrypoint, Validators.required],
      files: [this.data.files || [], Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      platform: [this.data.platform, Validators.required],
      reference: this.formBuilder.group({
        _id: [this.data.reference && this.data.reference._id],
        files: [this.data.reference && this.data.reference.files],
      }),
      version: [this.data.version, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));

    this.form.get('platform').valueChanges.subscribe(value => {
      const entrypoint = this.form.get('entrypoint');
      entrypoint.setValidators(value === 'server64' ? [] : [Validators.required]);
      entrypoint.updateValueAndValidity();
    });

    if (this.data._id) {
      this.form.get('entrypoint').disable({ emitEvent: false });
      this.form.get('files').disable({ emitEvent: false });
      this.form.get('platform').disable({ emitEvent: false });
      this.form.get('reference').disable({ emitEvent: false });

      this.$data = this.buildQuery.selectAll({ filterBy: w => w._id === this.data._id }).pipe(
        map(builds => {
          const build = new Build(builds[0]);
          build.status = build.status || { nodes: [], phase: 'Pending' };
          this.dataSource.data = build.getNestedStatusNodes();
          this.form.get('files').setValue(build.files);
          return build;
        }),
      );
    }
  }

  private async upsert(data: Partial<Build>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.buildService.update(data);
    } else {
      await this.create(data);
      this.router.navigate(['../', this.data._id], { relativeTo: this.activatedRoute });
    }

    this.matSnackBar.open('Build saved successfully.');
  }
}
