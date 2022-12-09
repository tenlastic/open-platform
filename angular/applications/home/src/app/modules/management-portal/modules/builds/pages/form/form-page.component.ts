import { NestedTreeControl } from '@angular/cdk/tree';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  ApiError,
  AuthorizationQuery,
  BuildModel,
  BuildQuery,
  BuildService,
  IAuthorization,
  IBuild,
} from '@tenlastic/http';
import JSZip from 'jszip';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { FileReaderService, FormService, IdentityService } from '../../../../../../core/services';
import { UpdatedFile } from '../../components';

enum Status {
  Ready,
  Uploading,
  Zipping,
}

interface Progress {
  current: number;
  total: number;
}

interface StatusNode {
  children?: StatusNode[];
  displayName?: string;
  finishedAt?: Date;
  message?: string;
  name?: string;
  phase?: string;
  startedAt?: Date;
  type?: string;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class BuildsFormPageComponent implements OnInit {
  public $data: Observable<BuildModel>;
  public Status = Status;
  public data: BuildModel;
  public dataSource = new MatTreeNestedDataSource<StatusNode>();
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public platforms = [
    { label: 'Linux Server (x64)', value: IBuild.Platform.Server64 },
    { label: 'Windows Client (x64)', value: IBuild.Platform.Windows64 },
  ];
  public progress: Progress;
  public status = Status.Ready;
  public treeControl = new NestedTreeControl<StatusNode>((node) => node.children);

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private changeDetectorRef: ChangeDetectorRef,
    private fileReaderService: FileReaderService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.BuildsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      if (params.buildId !== 'new') {
        this.data = await this.buildService.findOne(params.namespaceId, params.buildId);
        this.dataSource.data = this.data.getNestedStatusNodes();
      }

      this.setupForm();
    });
  }

  public hasChild(_: number, node: StatusNode) {
    return !!node.children && node.children.length > 0;
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const referenceId = this.form.get('reference').get('_id').value;
    const unmodifiedFiles = this.form.get('files').value.filter((f) => f.status === 'unmodified');
    const reference = { _id: referenceId, files: unmodifiedFiles.map((uf) => uf.path) };

    const values: Partial<BuildModel> = {
      entrypoint: this.form.get('entrypoint').value,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
      platform: this.form.get('platform').value,
      reference: reference._id ? reference : undefined,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, {
        entrypoint: 'Entrypoint',
        name: 'Name',
        namespaceId: 'Namespace',
        platform: 'Platform',
      });
    }
  }

  public showStatusNode(node: StatusNode) {
    return ['Pod', 'Workflow'].includes(node.type);
  }

  private async create(data: Partial<BuildModel>) {
    this.form.disable({ emitEvent: false });

    const files: UpdatedFile[] = this.form.get('files').value;
    const modifiedFiles = files.filter((u) => u.status === 'modified');

    // Zip files.
    let zipBlob: Blob;
    if (files.length > 0) {
      this.progress = { current: 0, total: modifiedFiles.length };
      this.status = Status.Zipping;

      const zip = new JSZip();
      for (const file of modifiedFiles) {
        const fileBlob = this.fileReaderService.arrayBufferToBlob(file.arrayBuffer);
        zip.file(file.path, fileBlob);
      }
      zipBlob = await zip.generateAsync(
        {
          compression: 'DEFLATE',
          compressionOptions: { level: 1 },
          type: 'blob',
        },
        (metadata) => {
          const total = modifiedFiles.length;
          this.progress = { current: Math.floor(total * (metadata.percent / 100)), total };

          this.changeDetectorRef.detectChanges();
        },
      );
    } else {
      data.reference.files = this.form.get('reference').get('files').value;
    }

    // Reset files.
    this.form.get('files').setValue([]);
    this.form.get('reference').get('files').setValue([]);

    // Upload files.
    this.progress = { current: 0, total: zipBlob?.size };
    this.status = Status.Uploading;

    const formData = new FormData();
    formData.append('record', JSON.stringify(data));
    formData.append('zip', zipBlob);

    const result = await this.buildService.create(data.namespaceId, formData, {
      onUploadProgress: (progressEvent) => {
        this.progress = { current: progressEvent.loaded * 100, total: progressEvent.total };
      },
    });

    this.form.enable({ emitEvent: false });
    this.progress = null;
    this.status = Status.Ready;

    return new BuildModel(result);
  }

  private async handleHttpError(err: ApiError, pathMap: any) {
    if (err.errors) {
      this.errors = err.errors.map((e) => {
        if (e.name === 'DuplicateKeyError') {
          const combination = e.paths.length > 1 ? 'combination ' : '';
          const paths = e.paths.map((p) => pathMap[p]);
          return `${paths.join(' / ')} ${combination}is not unique.`;
        } else {
          return e.message;
        }
      });
    } else {
      this.errors = ['Error uploading Build. Please try again in a few minutes.'];
    }

    this.form.enable({ emitEvent: false });
    this.progress = null;
    this.status = Status.Ready;
  }

  private setupForm() {
    this.data ??= new BuildModel();

    this.form = this.formBuilder.group({
      entrypoint: [this.data.entrypoint, Validators.required],
      files: [this.data.files || []],
      name: [this.data.name, Validators.required],
      namespaceId: [this.params.namespaceId, Validators.required],
      platform: [this.data.platform || this.platforms[0].value, Validators.required],
      reference: this.formBuilder.group({ _id: [null], files: [[]] }),
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.form.get('entrypoint').disable({ emitEvent: false });
      this.form.get('files').disable({ emitEvent: false });
      this.form.get('platform').disable({ emitEvent: false });
      this.form.get('reference').disable({ emitEvent: false });

      this.$data = this.buildQuery.selectAll({ filterBy: (b) => b._id === this.data._id }).pipe(
        map((builds) => {
          const build = new BuildModel(builds[0]);
          build.status = build.status || { nodes: [], phase: 'Pending' };
          this.dataSource.data = build.getNestedStatusNodes();
          this.form.get('files').setValue(build.files);
          return build;
        }),
      );
    }
  }

  private async upsert(data: Partial<BuildModel>) {
    if (this.data._id) {
      data._id = this.data._id;
      this.data = await this.buildService.update(data.namespaceId, data._id, data);
    } else {
      this.data = await this.create(data);
    }

    this.matSnackBar.open('Build saved successfully.');
    this.router.navigate(['../', this.data._id], { relativeTo: this.activatedRoute });
  }
}
