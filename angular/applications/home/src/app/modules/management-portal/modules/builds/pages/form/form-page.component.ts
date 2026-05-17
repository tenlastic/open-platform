import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiError,
  AuthorizationState,
  BuildModel,
  BuildService,
  BuildState,
  IAuthorization,
  IBuild,
  SubscriptionService,
  WebSocketService,
} from '@tenlastic/http';
import JSZip from 'jszip';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { environment } from '@home/environments/environment';
import { FileReaderService, FormService, IdentityService } from '../../../../../../core/services';
import { StatusNode, UpdatedFile } from '../../components';

export interface BuildForm {
  entrypoint: FormControl<string>;
  files: FormControl<UpdatedFile[]>;
  name: FormControl<string>;
  namespaceId: FormControl<string>;
  platform: FormControl<IBuild.Platform>;
  reference: FormGroup<{ _id: FormControl<string>; files: FormControl<string[]> }>;
}

enum Status {
  Ready,
  Uploading,
  Zipping,
}

interface Progress {
  current: number;
  total: number;
}

@Component({
  standalone: false,
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class BuildsFormPageComponent implements OnDestroy, OnInit {
  public Status = Status;
  public data: BuildModel;
  public errors: string[] = [];
  public form: FormGroup<BuildForm>;
  public hasWriteAuthorization: boolean;
  public isSaving: boolean;
  public platforms = [
    { label: 'Linux Server (x64)', value: IBuild.Platform.Server64 },
    { label: 'Windows Client (x64)', value: IBuild.Platform.Windows64 },
  ];
  public progress: Progress;
  public status = Status.Ready;
  public statusNodes: StatusNode[] = [];

  private updateBuild$ = new Subscription();
  private namespaceId: string;
  private subscriptions = [
    {
      Model: BuildModel,
      request: { _id: uuid(), path: `/subscriptions/builds` },
      service: this.buildService,
    },
  ];
  private get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private buildState: BuildState,
    private buildService: BuildService,
    private changeDetectorRef: ChangeDetectorRef,
    private fileReaderService: FileReaderService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.BuildsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      if (params.buildId !== 'new') {
        this.data = await this.buildService.findOne(params.namespaceId, params.buildId);
        this.statusNodes = this.data.getNestedStatusNodes();
      }

      this.setupForm();

      await this.unsubscribe();
      await this.subscribe();
    });
  }

  public async ngOnDestroy() {
    this.updateBuild$.unsubscribe();
    await this.unsubscribe();
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    this.errors = [];
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const referenceId = this.form.get('reference').get('_id').value;
    const unmodifiedFiles = this.form.get('files').value.filter((f) => f.status === 'unmodified');
    const reference = { _id: referenceId, files: unmodifiedFiles.map((uf) => uf.path) };

    const values: Partial<BuildModel> = {
      entrypoint: this.form.get('entrypoint').value,
      name: this.form.get('name').value,
      namespaceId: this.namespaceId,
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

    this.isSaving = false;
  }

  private async create(data: Partial<BuildModel>) {
    const files = this.form.get('files').value;
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
        this.progress = { current: progressEvent.loaded, total: progressEvent.total };
      },
    });

    this.progress = null;
    this.status = Status.Ready;

    return result;
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
      entrypoint: this.formBuilder.control(this.data.entrypoint, Validators.required),
      files: this.formBuilder.control(this.data.files || []),
      name: this.formBuilder.control(this.data.name, Validators.required),
      namespaceId: this.formBuilder.control(this.namespaceId),
      platform: this.formBuilder.control(
        this.data.platform || this.platforms[0].value,
        Validators.required,
      ),
      reference: this.formBuilder.group({
        _id: this.formBuilder.control(null),
        files: this.formBuilder.control([]),
      }),
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

      this.updateBuild$ = this.buildState
        .selectMany()
        .pipe(map((bs) => bs.filter((b) => b._id === this.data._id)))
        .subscribe((bs) => {
          const build = bs[0];
          this.data = build;
          this.form.get('files').setValue(build.files);
          this.statusNodes = build.getNestedStatusNodes();
        });
    }
  }

  private subscribe() {
    const promises = this.subscriptions.map((s) => {
      const options = { acks: true };

      return this.subscriptionService.subscribe(
        s.Model,
        { ...s.request },
        s.service,
        this.webSocket,
        options,
      );
    });

    return Promise.all(promises);
  }

  private unsubscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.unsubscribe(s.request._id, this.webSocket),
    );

    return Promise.all(promises);
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
