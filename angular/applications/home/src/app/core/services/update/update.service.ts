import { Injectable } from '@angular/core';
import {
  AuthorizationModel,
  AuthorizationService,
  BuildModel,
  BuildService,
  GameServerModel,
  IAuthorization,
  IBuild,
  LoginService,
  StorefrontModel,
  StorefrontService,
  TokenService,
} from '@tenlastic/http';
import { ChildProcess } from 'child_process';
import { Subject } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ElectronService } from '../../services/electron/electron.service';
import { IdentityService } from '../../services/identity/identity.service';

export enum UpdateServiceState {
  Banned,
  Checking,
  Deleting,
  Downloading,
  Installing,
  NotAuthorized,
  NotAvailable,
  NotChecked,
  NotInstalled,
  NotUpdated,
  PendingAuthorization,
  Ready,
}

export interface UpdateServiceLocalFile {
  md5: string;
  path: string;
}

export interface UpdateServicePlayOptions {
  gameServer?: GameServerModel;
  groupId?: string;
}

export interface UpdateServiceProgress {
  current?: number;
  speed?: number;
  total?: number;
}

export interface UpdateServiceStatus {
  build?: BuildModel;
  childProcess?: ChildProcess;
  isInstalled?: boolean;
  modifiedFiles?: IBuild.File[];
  progress?: UpdateServiceProgress;
  state?: UpdateServiceState;
  text?: string;
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  public OnChange = new Subject<Map<StorefrontModel, UpdateServiceStatus>>();

  private get installPath() {
    return this.electronService.remote.app.getPath('userData').replace(/\\/g, '/') + '/Tenlastic';
  }
  private get platform() {
    if (!this.electronService.isElectron) {
      return null;
    }

    const arch = this.electronService.os.arch();
    const platform = this.electronService.os.platform();

    return `${this.platforms[platform]}${arch.replace('x', '')}`;
  }
  private platforms = {
    debian: 'mac',
    linux: 'linux',
    win32: 'windows',
    win64: 'windows',
  };
  private status = new Map<string, UpdateServiceStatus>();

  constructor(
    private authorizationService: AuthorizationService,
    private buildService: BuildService,
    private electronService: ElectronService,
    private identityService: IdentityService,
    private loginService: LoginService,
    private storefrontService: StorefrontService,
    private tokenService: TokenService,
  ) {
    this.subscribeToServices();
    this.loginService.emitter.on('logout', () => this.status.clear());
  }

  public async checkForUpdates(namespaceId: string, useCache = false) {
    const status = this.getStatus(namespaceId);
    if (
      status.state !== UpdateServiceState.NotChecked &&
      status.state !== UpdateServiceState.NotAvailable
    ) {
      return;
    }

    status.progress = null;
    status.state = UpdateServiceState.Checking;

    // Check Authorization...
    status.text = 'Checking authorization...';
    const authorization = await this.getAuthorization(namespaceId);
    const roles = [
      IAuthorization.Role.BuildsRead,
      IAuthorization.Role.BuildsReadPublished,
      IAuthorization.Role.BuildsReadWrite,
    ];
    if (!authorization || !authorization.roles.some((r) => roles.includes(r))) {
      status.state = UpdateServiceState.NotAuthorized;
      return;
    }

    // Get the latest Build from the server.
    status.text = 'Retrieving latest build...';
    const builds = await this.buildService.find(namespaceId, {
      limit: 1,
      sort: '-publishedAt',
      where: { namespaceId, platform: this.platform, publishedAt: { $exists: true, $ne: null } },
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

    // Calculate local file checksums.
    status.progress = null;
    status.text = 'Checking local files...';
    const cachedFiles = useCache ? await this.getCachedFiles(namespaceId) : null;
    const localFiles = cachedFiles || (await this.getLocalFiles(namespaceId));
    if (localFiles.length === 0) {
      status.modifiedFiles = status.build.files;
      status.state = UpdateServiceState.NotInstalled;
      return;
    }

    // Delete files no longer listed in the Build.
    status.isInstalled = true;
    status.progress = null;
    status.text = 'Deleting stale files...';
    await this.deleteRemovedFiles(localFiles, namespaceId, status.build.files);

    // Calculate which files either don't exist locally or have a different checksum.
    status.progress = null;
    status.text = 'Calculating updated files...';
    const updatedFiles = this.getUpdatedFiles(namespaceId, localFiles);

    if (updatedFiles.length > 0) {
      status.modifiedFiles = updatedFiles;
      status.progress = null;
      status.state = UpdateServiceState.Downloading;
      status.text = 'Downloading and installing update...';

      try {
        await this.download(status.build, namespaceId);
      } catch (e) {
        console.error(e);
      }

      // Make sure download is complete.
      status.state = UpdateServiceState.NotChecked;
      await this.checkForUpdates(namespaceId, false);
    } else {
      status.modifiedFiles = [];
      status.progress = null;
      status.state = UpdateServiceState.Ready;
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
      this.status.set(namespaceId, { state: UpdateServiceState.NotChecked });
    }

    return this.status.get(namespaceId);
  }

  public async install(namespaceId: string) {
    const status = this.getStatus(namespaceId);

    status.modifiedFiles = status.build.files;
    status.progress = null;
    status.state = UpdateServiceState.Downloading;
    status.text = 'Downloading and installing...';

    try {
      await this.download(status.build, namespaceId);
    } catch (e) {
      console.error(e);
    }

    // Make sure download is complete.
    status.state = UpdateServiceState.NotChecked;
    await this.checkForUpdates(namespaceId);
  }

  public async play(namespaceId: string, options: UpdateServicePlayOptions = {}) {
    const status = this.getStatus(namespaceId);
    if (status.childProcess) {
      return;
    }

    const accessToken = await this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();

    const storefronts = await this.storefrontService.find(namespaceId, {});
    const env = {
      ...process.env,
      ACCESS_TOKEN: accessToken.value,
      GAME_JSON: storefronts.length > 0 ? JSON.stringify(storefronts[0]) : null,
      GAME_SERVER_JSON: JSON.stringify(options.gameServer),
      GROUP_ID: options.groupId,
      REFRESH_TOKEN: refreshToken.value,
    };
    const target = `${this.installPath}/${namespaceId}/${status.build.entrypoint}`;

    status.childProcess = this.electronService.childProcess.execFile(target, null, { env });
    status.childProcess.on('close', () => (status.childProcess = null));
  }

  public showInExplorer(namespaceId: string) {
    const path = this.electronService.path.join(this.installPath, namespaceId);
    this.electronService.shell.openExternal(path);
  }

  public stop(namespaceId: string) {
    const status = this.getStatus(namespaceId);
    if (!status.childProcess) {
      return;
    }

    status.childProcess.kill();
  }

  private async deleteRemovedFiles(
    localFiles: { md5: string; path: string }[],
    namespaceId: string,
    remoteFiles: IBuild.File[],
  ) {
    const { fs } = this.electronService;

    for (const localFile of localFiles) {
      const localPath = localFile.path.replace(`${this.installPath}/${namespaceId}/`, '');
      const remotePaths = remoteFiles.map((rf) => rf.path);

      if (!remotePaths.includes(localPath)) {
        await new Promise<void>((resolve) =>
          fs.unlink(`${this.installPath}/${namespaceId}/${localPath}`, () => resolve()),
        );
      }
    }
  }

  private async download(build: BuildModel, namespaceId: string) {
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

    return new Promise(async (resolve, reject) => {
      const accessToken = await this.tokenService.getAccessToken();

      request
        .get({
          headers: { Authorization: `Bearer ${accessToken.value}` },
          qs: { query: JSON.stringify({ files: files.join('') }) },
          url: `${environment}/${status.build._id}/files`,
        })
        .on('data', (data) => {
          downloadedBytes += data.length;
          status.progress = {
            current: downloadedBytes,
            speed: (downloadedBytes / (performance.now() - start)) * 1000,
            total: totalBytes,
          };
        })
        .on('error', reject)
        .pipe(unzipper.Parse())
        .on('close', resolve)
        .on('entry', (entry) => {
          if (entry.type !== 'File') {
            entry.autodrain();
            return;
          }

          const target = `${this.installPath}/${namespaceId}/${entry.path}`;
          const targetDirectory = target.substr(0, target.lastIndexOf('/'));
          fs.mkdirSync(targetDirectory, { recursive: true });

          entry.pipe(fs.createWriteStream(target));
        })
        .on('error', reject);
    });
  }

  private async getAuthorization(namespaceId: string) {
    const authorizations = await this.authorizationService.findUserAuthorizations(
      namespaceId,
      this.identityService.user._id,
    );

    return authorizations[0];
  }

  private async getCachedFiles(namespaceId: string) {
    const { fs } = this.electronService;

    const isCached = fs.existsSync(`${this.installPath}/${namespaceId}.json`);
    if (!isCached) {
      return null;
    }

    const file = fs.readFileSync(`${this.installPath}/${namespaceId}.json`, 'utf8');
    return JSON.parse(file);
  }

  private async getLocalFiles(namespaceId: string) {
    const { crypto, fs, glob } = this.electronService;
    const status = this.getStatus(namespaceId);

    const files = glob.sync(`${this.installPath}/${namespaceId}/**/*`, { nodir: true });

    const localFiles: { md5: string; path: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      status.progress = { current: i, total: files.length };

      const path = files[i];
      const md5 = await new Promise<string>((resolve, reject) => {
        const stream = fs.createReadStream(path);
        const hash = crypto.createHash('md5');
        hash.setEncoding('hex');

        stream.on('end', () => {
          hash.end();
          return resolve(hash.read() as string);
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

  private onStorefrontChange(record: StorefrontModel) {
    this.checkForUpdates(record.namespaceId);
  }

  private onAuthorizationChange(record: AuthorizationModel) {
    if (record.userId !== this.identityService.user._id) {
      return;
    }

    this.checkForUpdates(record.namespaceId);
  }

  private subscribeToServices() {
    this.buildService.emitter.on('update', (record: BuildModel) => {
      if (!record.namespaceId) {
        return;
      }

      this.checkForUpdates(record.namespaceId);
    });

    this.storefrontService.emitter.on('delete', (record: StorefrontModel) =>
      this.onStorefrontChange(record),
    );
    this.storefrontService.emitter.on('update', (record: StorefrontModel) =>
      this.onStorefrontChange(record),
    );
    this.storefrontService.emitter.on('create', (record: StorefrontModel) =>
      this.onStorefrontChange(record),
    );
    this.authorizationService.emitter.on('create', (record: AuthorizationModel) =>
      this.onAuthorizationChange(record),
    );
    this.authorizationService.emitter.on('delete', (record: AuthorizationModel) =>
      this.onAuthorizationChange(record),
    );
    this.authorizationService.emitter.on('update', (record: AuthorizationModel) =>
      this.onAuthorizationChange(record),
    );
  }
}
