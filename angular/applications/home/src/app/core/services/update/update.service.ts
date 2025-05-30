import { Injectable } from '@angular/core';
import {
  AuthorizationModel,
  AuthorizationRequestModel,
  AuthorizationRequestService,
  AuthorizationService,
  BuildModel,
  BuildService,
  IAuthorization,
  IBuild,
  LoginService,
  StorefrontModel,
  StorefrontService,
  TokenService,
} from '@tenlastic/http';

import { environment } from '../../../../environments/environment';
import { ElectronService } from '../../services/electron/electron.service';
import { IdentityService } from '../../services/identity/identity.service';

export enum UpdateServiceState {
  AuthorizationRequestDenied,
  AuthorizationRequested,
  Banned,
  Checking,
  Deleting,
  Installing,
  NotAuthorized,
  NotAvailable,
  NotChecked,
  NotInstalled,
  NotUpdated,
  PendingAuthorization,
  Ready,
  RequestingAuthorization,
  Updating,
}

export interface UpdateServiceProgress {
  current?: number;
  speed?: number;
  total?: number;
}

export interface UpdateServiceStatus {
  authorizationRequest?: AuthorizationRequestModel;
  build?: BuildModel;
  modifiedFiles?: IBuild.File[];
  progress?: UpdateServiceProgress;
  state?: UpdateServiceState;
  text?: string;
}

interface UpdateServiceLocalFile {
  md5: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private get installPath() {
    return this.electronService.installPath;
  }
  private get platform() {
    const platform: string = navigator['userAgentData']?.platform || navigator.platform;

    if (platform.startsWith('Linux')) {
      return IBuild.Platform.Linux64;
    } else if (platform.startsWith('Mac')) {
      return IBuild.Platform.Mac64;
    } else if (platform.startsWith('Win')) {
      return IBuild.Platform.Windows64;
    }

    return null;
  }
  private status = new Map<string, UpdateServiceStatus>();

  constructor(
    private authorizationRequestService: AuthorizationRequestService,
    private authorizationService: AuthorizationService,
    private buildService: BuildService,
    private electronService: ElectronService,
    private identityService: IdentityService,
    private loginService: LoginService,
    private storefrontService: StorefrontService,
    private tokenService: TokenService,
  ) {
    this.loginService.emitter.on('logout', () => this.status.clear());
    this.subscribeToServices();
  }

  public async checkForUpdates(
    namespaceId: string,
    download: boolean,
    install: boolean,
    useCache: boolean,
  ) {
    const status = this.getStatus(namespaceId);

    if (
      status.state === UpdateServiceState.Checking ||
      status.state === UpdateServiceState.Deleting ||
      status.state === UpdateServiceState.Installing ||
      status.state === UpdateServiceState.Updating
    ) {
      return;
    }

    status.progress = null;
    status.state = UpdateServiceState.Checking;

    try {
      // Check Authorization...
      status.text = 'Checking authorization...';
      const authorizations = await this.authorizationService.findUserAuthorizations(
        namespaceId,
        this.identityService.user?._id,
      );
      if (authorizations.some((a) => a.bannedAt)) {
        status.state = UpdateServiceState.Banned;
        return;
      } else if (!authorizations.some((a) => a.hasRoles(IAuthorization.buildRoles))) {
        const [authorizationRequest] = await this.authorizationRequestService.find(namespaceId, {
          where: { grantedAt: null, userId: this.identityService.user?._id },
        });

        status.authorizationRequest = authorizationRequest;
        if (status.authorizationRequest?.deniedAt) {
          status.state = UpdateServiceState.AuthorizationRequestDenied;
        } else if (status.authorizationRequest?.hasRoles(IAuthorization.buildRoles)) {
          status.state = UpdateServiceState.AuthorizationRequested;
        } else {
          status.state = UpdateServiceState.NotAuthorized;
        }

        return;
      }

      // Get the latest Build from the server.
      status.text = 'Retrieving latest build...';
      const builds = await this.buildService.find(namespaceId, {
        limit: 1,
        sort: '-publishedAt',
        where: { namespaceId, platform: this.platform, publishedAt: { $exists: true } },
      });
      if (builds.length === 0) {
        status.state = UpdateServiceState.NotAvailable;
        return;
      }

      // Find Files associated with latest Build.
      status.build = builds[0];
      status.progress = null;
      status.text = 'Retrieving build files...';
      if (status.build.files.length === 0) {
        status.state = UpdateServiceState.NotAvailable;
        return;
      }

      // Do not check files without Electron.
      if (!this.electronService.isElectron) {
        status.state = UpdateServiceState.NotInstalled;
        return;
      }

      // Calculate local file checksums.
      status.progress = null;
      status.text = 'Checking local files...';
      const cachedFiles = useCache ? await this.getCachedFiles(namespaceId) : null;
      const localFiles = cachedFiles ? cachedFiles : await this.getLocalFiles(namespaceId);
      if (!install && localFiles.length === 0) {
        status.modifiedFiles = status.build.files;
        status.state = UpdateServiceState.NotInstalled;
        return;
      }

      // Calculate which files either don't exist locally or have a different checksum.
      status.progress = null;
      status.text = 'Calculating updated files...';
      const updatedFiles = this.getUpdatedFiles(namespaceId, localFiles);

      if (download && updatedFiles.length > 0) {
        status.modifiedFiles = updatedFiles;

        // Delete files no longer listed in the Build.
        status.progress = null;
        status.text = 'Deleting deprecated files...';
        await this.deleteRemovedFiles(localFiles, namespaceId, status.build.files);

        // Download new files.
        status.progress = null;
        status.state = UpdateServiceState.Updating;
        status.text = 'Downloading and installing update...';

        try {
          await this.download(status.build, localFiles, namespaceId);
        } catch (e) {
          console.error(e);
        }

        // Make sure download is complete.
        status.state = UpdateServiceState.NotChecked;
        await this.checkForUpdates(namespaceId, true, true, true);
      } else if (!download && updatedFiles.length > 0) {
        status.modifiedFiles = updatedFiles;
        status.progress = null;
        status.state = UpdateServiceState.NotUpdated;
      } else {
        status.modifiedFiles = [];
        status.progress = null;
        status.state = UpdateServiceState.Ready;
      }
    } catch (e) {
      console.error(e);

      status.progress = null;
      status.state = UpdateServiceState.NotAvailable;
    }
  }

  public async delete(namespaceId: string) {
    const { fs } = this.electronService;
    const status = this.getStatus(namespaceId);

    status.state = UpdateServiceState.Deleting;
    status.text = 'Deleting Files...';

    fs.rmdirSync(`${this.installPath}/${namespaceId}/`, { recursive: true });
    fs.unlinkSync(`${this.installPath}/${namespaceId}.json`);

    status.state = UpdateServiceState.NotInstalled;
  }

  public getStatus(namespaceId: string) {
    if (!this.status.has(namespaceId)) {
      const status = { state: UpdateServiceState.NotChecked };
      this.status.set(namespaceId, status);
    }

    return this.status.get(namespaceId);
  }

  public async requestAuthorization(namespaceId: string) {
    const status = this.getStatus(namespaceId);

    status.state = UpdateServiceState.RequestingAuthorization;
    status.text = 'Requesting authorization...';

    if (status.authorizationRequest) {
      await this.authorizationRequestService.delete(namespaceId, status.authorizationRequest._id);
    }

    try {
      const [storefront] = await this.storefrontService.find(namespaceId, {});

      const { roles } = storefront;
      const userId = this.identityService.user?._id;
      await this.authorizationRequestService.create(namespaceId, { roles, userId });

      status.state = UpdateServiceState.AuthorizationRequested;
    } catch (e) {
      console.error(e);
      status.state = UpdateServiceState.NotAuthorized;
    }
  }

  public showInExplorer(namespaceId: string) {
    const path = this.electronService.path.join(this.installPath, namespaceId);
    this.electronService.shell.openExternal(path);
  }

  private async deleteRemovedFiles(
    localFiles: UpdateServiceLocalFile[],
    namespaceId: string,
    remoteFiles: IBuild.File[],
  ) {
    const { fs } = this.electronService;

    for (let i = localFiles.length - 1; i >= 0; i--) {
      const localFile = localFiles[i];

      const localPath = localFile.path.replace(`${this.installPath}/${namespaceId}/`, '');
      const remotePaths = remoteFiles.map((rf) => rf.path);

      if (remotePaths.includes(localPath)) {
        continue;
      }

      try {
        fs.unlinkSync(`${this.installPath}/${namespaceId}/${localPath}`);
      } catch (e) {
        console.error(e);
      } finally {
        localFiles.splice(i, 1);
      }
    }

    fs.mkdirSync(this.installPath, { recursive: true });
    fs.writeFileSync(`${this.installPath}/${namespaceId}.json`, JSON.stringify(localFiles));
  }

  private async download(
    build: BuildModel,
    localFiles: UpdateServiceLocalFile[],
    namespaceId: string,
  ) {
    const status = this.getStatus(namespaceId);

    let downloadedBytes = 0;
    const start = performance.now();
    const totalBytes = status.modifiedFiles.reduce(
      (previousValue, currentValue) => previousValue + currentValue.compressedBytes,
      0,
    );

    const modifiedFilePaths = status.modifiedFiles.map((f) => f.path);
    const files = build.files.map((f) => (modifiedFilePaths.includes(f.path) ? 1 : 0));
    const { fs, request, unzipper } = this.electronService;

    return new Promise<void>(async (resolve, reject) => {
      const accessToken = await this.tokenService.getAccessToken();

      const stream = request
        .get({
          headers: { Authorization: `Bearer ${accessToken.value}` },
          qs: { files: files.join('') },
          url: `${environment.apiUrl}/namespaces/${namespaceId}/builds/${status.build._id}/files`,
        })
        .on('data', (data) => {
          downloadedBytes += data.length;
          if (downloadedBytes > totalBytes) {
            downloadedBytes = totalBytes;
          }

          status.progress = {
            current: downloadedBytes,
            speed: (downloadedBytes / (performance.now() - start)) * 1000,
            total: totalBytes,
          };
        })
        .on('error', reject);

      stream
        .pipe(unzipper.Parse())
        .on('close', () => {
          fs.mkdirSync(this.installPath, { recursive: true });
          fs.writeFileSync(`${this.installPath}/${namespaceId}.json`, JSON.stringify(localFiles));
          return resolve();
        })
        .on('entry', (entry) => {
          if (entry.type !== 'File') {
            entry.autodrain();
            return;
          }

          const target = `${this.installPath}/${namespaceId}/${entry.path}`;
          const targetDirectory = target.substr(0, target.lastIndexOf('/'));
          fs.mkdirSync(targetDirectory, { recursive: true });

          entry.on('end', () => {
            const file = build.files.find((f) => entry.path === f.path);
            const index = localFiles.findIndex((lf) => lf.path === target);
            const localFile = { md5: file.md5, path: target };

            if (index >= 0) {
              localFiles[index] = localFile;
            } else {
              localFiles.push(localFile);
            }
          });

          entry.pipe(fs.createWriteStream(target));
        })
        .on('error', (err) => {
          fs.mkdirSync(this.installPath, { recursive: true });
          fs.writeFileSync(`${this.installPath}/${namespaceId}.json`, JSON.stringify(localFiles));
          stream.abort(err);
          return reject(err);
        });
    });
  }

  private async getCachedFiles(namespaceId: string) {
    const { fs } = this.electronService;

    const isCached = fs.existsSync(`${this.installPath}/${namespaceId}.json`);
    if (!isCached) {
      return null;
    }

    const file = fs.readFileSync(`${this.installPath}/${namespaceId}.json`, 'utf8');
    return JSON.parse(file) as UpdateServiceLocalFile[];
  }

  private async getLocalFiles(namespaceId: string) {
    const { crypto, fs, glob } = this.electronService;
    const status = this.getStatus(namespaceId);

    const files = glob.sync(`${this.installPath}/${namespaceId}/**/*`, { nodir: true });

    const localFiles: UpdateServiceLocalFile[] = [];
    for (let i = 0; i < files.length; i++) {
      status.progress = { current: i, total: files.length };

      const path = files[i];
      const md5 = await new Promise<string>((resolve, reject) => {
        const stream = fs.createReadStream(path);
        const hash = crypto.createHash('md5');
        hash.setEncoding('hex');

        stream.on('end', () => {
          hash.end();
          return resolve(hash.read());
        });

        stream.pipe(hash);
      });

      localFiles.push({ md5, path });
    }

    fs.mkdirSync(this.installPath, { recursive: true });
    fs.writeFileSync(`${this.installPath}/${namespaceId}.json`, JSON.stringify(localFiles));

    return localFiles;
  }

  private getUpdatedFiles(namespaceId: string, localFiles: UpdateServiceLocalFile[]) {
    const status = this.getStatus(namespaceId);

    let updatedFiles = status.build.files;
    if (localFiles.length > 0) {
      const localFilePaths = localFiles.reduce((previous, current) => {
        previous[current.path] = current;
        return previous;
      }, {});

      updatedFiles = status.build.files.filter((rf, i) => {
        status.progress = { current: i, total: status.build.files.length };

        const localFile = localFilePaths[`${this.installPath}/${namespaceId}/${rf.path}`];
        return !localFile || localFile.md5 !== rf.md5;
      });
    }

    return updatedFiles;
  }

  private onAuthorizationChange(record: AuthorizationModel) {
    if (!record.namespaceId || record.userId !== this.identityService.user._id) {
      return;
    }

    this.checkForUpdates(record.namespaceId, false, false, true);
  }

  private onBuildChange(record: BuildModel) {
    if (record.platform !== this.platform) {
      return;
    }

    this.checkForUpdates(record.namespaceId, false, false, true);
  }

  private onStorefrontChange(record: StorefrontModel) {
    this.checkForUpdates(record.namespaceId, false, false, true);
  }

  private subscribeToServices() {
    this.authorizationService.emitter.on('create', this.onAuthorizationChange.bind(this));
    this.authorizationService.emitter.on('delete', this.onAuthorizationChange.bind(this));
    this.authorizationService.emitter.on('update', this.onAuthorizationChange.bind(this));

    this.buildService.emitter.on('update', this.onBuildChange.bind(this));

    this.storefrontService.emitter.on('create', this.onStorefrontChange.bind(this));
    this.storefrontService.emitter.on('delete', this.onStorefrontChange.bind(this));
    this.storefrontService.emitter.on('update', this.onStorefrontChange.bind(this));
  }
}
