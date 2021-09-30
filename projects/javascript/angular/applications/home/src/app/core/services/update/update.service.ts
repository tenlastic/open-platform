import { Injectable } from '@angular/core';
import {
  Build,
  BuildService,
  Game,
  GameAuthorization,
  GameAuthorizationService,
  GameQuery,
  GameServer,
  GameService,
  IBuild,
  IGame,
  IGameAuthorization,
  IUser,
  LoginService,
  Namespace,
  NamespaceService,
} from '@tenlastic/ng-http';
import { ChildProcess } from 'child_process';
import { Subject } from 'rxjs';

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
  gameServer?: GameServer;
  groupId?: string;
}

export interface UpdateServiceProgress {
  current?: number;
  speed?: number;
  total?: number;
}

export interface UpdateServiceStatus {
  build?: Build;
  childProcess?: ChildProcess;
  isInstalled?: boolean;
  modifiedFiles?: IBuild.File[];
  progress?: UpdateServiceProgress;
  state?: UpdateServiceState;
  text?: string;
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  public OnChange = new Subject<Map<Game, UpdateServiceStatus>>();

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
    private buildService: BuildService,
    private electronService: ElectronService,
    private gameQuery: GameQuery,
    private gameService: GameService,
    private gameAuthorizationService: GameAuthorizationService,
    private identityService: IdentityService,
    private loginService: LoginService,
    private namespaceService: NamespaceService,
  ) {
    this.subscribeToServices();
    this.loginService.onLogout.subscribe(() => this.status.clear());
  }

  public async checkForUpdates(gameId: string, useCache = false) {
    const status = this.getStatus(gameId);
    if (
      status.state !== UpdateServiceState.NotChecked &&
      status.state !== UpdateServiceState.NotAvailable
    ) {
      return;
    }

    status.progress = null;
    status.state = UpdateServiceState.Checking;

    // Check Game Authorization...
    status.text = 'Checking authorization...';
    const { Games } = IUser.Role;
    const { game, gameAuthorization, namespaceUser } = await this.getAuthorization(gameId);
    const { user } = this.identityService;
    if (!user.roles.includes(Games) && !namespaceUser?.roles.includes(Games)) {
      if (gameAuthorization?.status === IGameAuthorization.GameAuthorizationStatus.Revoked) {
        status.state = UpdateServiceState.Banned;
        return;
      }

      if (game.access !== IGame.Access.Public) {
        if (gameAuthorization?.status === IGameAuthorization.GameAuthorizationStatus.Pending) {
          status.state = UpdateServiceState.PendingAuthorization;
          return;
        } else if (
          gameAuthorization?.status !== IGameAuthorization.GameAuthorizationStatus.Granted
        ) {
          status.state = UpdateServiceState.NotAuthorized;
          return;
        }
      }
    }

    // Get the latest Build from the server.
    status.text = 'Retrieving latest build...';
    const builds = await this.buildService.find({
      limit: 1,
      sort: '-publishedAt',
      where: {
        gameId,
        platform: this.platform,
        publishedAt: { $exists: true, $ne: null },
      },
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
    const cachedFiles = useCache ? await this.getCachedFiles(gameId) : null;
    const localFiles = cachedFiles || (await this.getLocalFiles(gameId));
    if (localFiles.length === 0) {
      status.modifiedFiles = status.build.files;
      status.state = UpdateServiceState.NotInstalled;
      return;
    }

    // Delete files no longer listed in the Build.
    status.isInstalled = true;
    status.progress = null;
    status.text = 'Deleting stale files...';
    await this.deleteRemovedFiles(gameId, localFiles, status.build.files);

    // Calculate which files either don't exist locally or have a different checksum.
    status.progress = null;
    status.text = 'Calculating updated files...';
    const updatedFiles = this.getUpdatedFiles(gameId, localFiles);

    if (updatedFiles.length > 0) {
      status.modifiedFiles = updatedFiles;
      status.progress = null;
      status.state = UpdateServiceState.Downloading;
      status.text = 'Downloading and installing update...';

      try {
        await this.download(status.build, gameId);
      } catch (e) {
        console.error(e);
      }

      // Make sure download is complete.
      status.state = UpdateServiceState.NotChecked;
      await this.checkForUpdates(gameId, false);
    } else {
      status.modifiedFiles = [];
      status.progress = null;
      status.state = UpdateServiceState.Ready;
    }
  }

  public async delete(gameId: string) {
    const { fs } = this.electronService;
    const status = this.getStatus(gameId);

    status.state = UpdateServiceState.Deleting;
    status.text = 'Deleting Files...';

    fs.rmdirSync(`${this.installPath}/${gameId}/`, { recursive: true });
    fs.unlinkSync(`${this.installPath}/${gameId}.json`);

    status.state = UpdateServiceState.NotInstalled;
  }

  public getStatus(gameId: string) {
    if (!this.status.has(gameId)) {
      this.status.set(gameId, { state: UpdateServiceState.NotChecked });
    }

    return this.status.get(gameId);
  }

  public async install(gameId: string) {
    const status = this.getStatus(gameId);

    status.modifiedFiles = status.build.files;
    status.progress = null;
    status.state = UpdateServiceState.Downloading;
    status.text = 'Downloading and installing...';

    try {
      await this.download(status.build, gameId);
    } catch (e) {
      console.error(e);
    }

    // Make sure download is complete.
    status.state = UpdateServiceState.NotChecked;
    await this.checkForUpdates(gameId);
  }

  public async play(gameId: string, options: UpdateServicePlayOptions = {}) {
    const status = this.getStatus(gameId);
    if (status.childProcess) {
      return;
    }

    const accessToken = await this.identityService.getAccessToken();
    const game = this.gameQuery.getEntity(gameId);
    const refreshToken = this.identityService.getRefreshToken();

    const env = {
      ...process.env,
      ACCESS_TOKEN: accessToken.value,
      GAME_JSON: JSON.stringify(game),
      GAME_SERVER_JSON: JSON.stringify(options.gameServer),
      GROUP_ID: options.groupId,
      REFRESH_TOKEN: refreshToken.value,
    };
    const target = `${this.installPath}/${gameId}/${status.build.entrypoint}`;

    status.childProcess = this.electronService.childProcess.execFile(target, null, { env });
    status.childProcess.on('close', () => (status.childProcess = null));
  }

  public stop(gameId: string) {
    const status = this.getStatus(gameId);
    if (!status.childProcess) {
      return;
    }

    status.childProcess.kill();
  }

  private async deleteRemovedFiles(
    gameId: string,
    localFiles: { md5: string; path: string }[],
    remoteFiles: IBuild.File[],
  ) {
    const { fs } = this.electronService;

    for (const localFile of localFiles) {
      const localPath = localFile.path.replace(`${this.installPath}/${gameId}/`, '');
      const remotePaths = remoteFiles.map(rf => rf.path);

      if (!remotePaths.includes(localPath)) {
        await new Promise<void>(resolve =>
          fs.unlink(`${this.installPath}/${gameId}/${localPath}`, () => resolve()),
        );
      }
    }
  }

  private async download(build: Build, gameId: string) {
    const status = this.getStatus(gameId);

    let downloadedBytes = 0;
    const start = performance.now();
    const totalBytes = status.modifiedFiles.reduce(
      (previousValue, currentValue) => previousValue + currentValue.compressedBytes,
      0,
    );

    const modifiedFilePaths = status.modifiedFiles.map(f => f.path);
    const files = build.files.map(f => (modifiedFilePaths.includes(f.path) ? 1 : 0));
    const { fs, request, unzipper } = this.electronService;

    return new Promise(async (resolve, reject) => {
      const accessToken = await this.identityService.getAccessToken();

      request
        .get({
          headers: { Authorization: `Bearer ${accessToken.value}` },
          qs: { query: JSON.stringify({ files: files.join('') }) },
          rejectUnauthorized: false,
          url: `${this.buildService.basePath}/${status.build._id}/files`,
        })
        .on('data', data => {
          downloadedBytes += data.length;
          status.progress = {
            current: downloadedBytes,
            speed: (downloadedBytes / (performance.now() - start)) * 1000,
            total: totalBytes,
          };
        })
        .pipe(unzipper.Parse())
        .on('close', resolve)
        .on('entry', entry => {
          if (entry.type !== 'File') {
            entry.autodrain();
            return;
          }

          const target = `${this.installPath}/${gameId}/${entry.path}`;
          const targetDirectory = target.substr(0, target.lastIndexOf('/'));
          if (!fs.existsSync(targetDirectory)) {
            fs.mkdirSync(targetDirectory, { recursive: true } as any);
          }

          entry.pipe(fs.createWriteStream(target));
        })
        .on('error', reject);
    });
  }

  private async getAuthorization(gameId: string) {
    const game = await this.gameService.findOne(gameId);
    const gameAuthorizations = await this.gameAuthorizationService.find({
      where: { gameId, userId: this.identityService.user._id },
    });

    let namespace: Namespace;
    try {
      namespace = await this.namespaceService.findOne(game.namespaceId);
    } catch {}
    const namespaceUser = namespace?.users.find(u => u._id === this.identityService.user._id);

    return { game, gameAuthorization: gameAuthorizations[0], namespaceUser };
  }

  private async getCachedFiles(gameId: string) {
    const { fs } = this.electronService;

    const isCached = fs.existsSync(`${this.installPath}/${gameId}.json`);
    if (!isCached) {
      return null;
    }

    const file = fs.readFileSync(`${this.installPath}/${gameId}.json`, 'utf8');
    return JSON.parse(file);
  }

  private async getLocalFiles(gameId: string) {
    const { crypto, fs, glob } = this.electronService;
    const status = this.getStatus(gameId);

    const files = glob.sync(`${this.installPath}/${gameId}/**/*`, { nodir: true });

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

    fs.writeFileSync(`${this.installPath}/${gameId}.json`, JSON.stringify(localFiles));

    return localFiles;
  }

  private getUpdatedFiles(gameId: string, localFiles: UpdateServiceLocalFile[]) {
    const status = this.getStatus(gameId);

    let updatedFiles = status.build.files;
    if (localFiles.length > 0) {
      const localFilePaths = localFiles.reduce((previous, current) => {
        previous[current.path] = current;
        return previous;
      }, {});

      updatedFiles = status.build.files.filter((rf, i) => {
        status.progress = { current: i, total: status.build.files.length };

        const localFile = localFilePaths[`${this.installPath}/${gameId}/${rf.path}`];
        return !localFile || localFile.md5 !== rf.md5;
      });
    }

    return updatedFiles;
  }

  private onGameChange(record: Game) {
    this.checkForUpdates(record._id);
  }

  private onGameAuthorizationChange(record: GameAuthorization) {
    if (record.userId !== this.identityService.user._id) {
      return;
    }

    this.checkForUpdates(record.gameId);
  }

  private subscribeToServices() {
    this.buildService.onUpdate.subscribe((record: Build) => {
      if (!record.gameId) {
        return;
      }

      this.checkForUpdates(record.gameId);
    });

    this.gameService.onCreate.subscribe((record: Game) => this.onGameChange(record));
    this.gameService.onDelete.subscribe((record: Game) => this.onGameChange(record));
    this.gameService.onUpdate.subscribe((record: Game) => this.onGameChange(record));
    this.gameAuthorizationService.onCreate.subscribe((record: GameAuthorization) =>
      this.onGameAuthorizationChange(record),
    );
    this.gameAuthorizationService.onDelete.subscribe((record: GameAuthorization) =>
      this.onGameAuthorizationChange(record),
    );
    this.gameAuthorizationService.onUpdate.subscribe((record: GameAuthorization) =>
      this.onGameAuthorizationChange(record),
    );
  }
}
