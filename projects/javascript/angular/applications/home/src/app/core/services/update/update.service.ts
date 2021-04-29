import { Injectable } from '@angular/core';
import {
  Build,
  BuildService,
  Game,
  GameInvitationService,
  GameServer,
  IBuild,
  LoginService,
} from '@tenlastic/ng-http';
import { ChildProcess } from 'child_process';
import { Subject } from 'rxjs';

import { ElectronService } from '../../services/electron/electron.service';
import { IdentityService } from '../../services/identity/identity.service';

export enum UpdateServiceState {
  Checking,
  Downloading,
  Installing,
  NotAvailable,
  NotChecked,
  NotInstalled,
  NotInvited,
  NotUpdated,
  Ready,
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
    private gameInvitationService: GameInvitationService,
    private identityService: IdentityService,
    private loginService: LoginService,
  ) {
    this.subscribeToServices();

    this.loginService.onLogout.subscribe(() => this.status.clear());
  }

  public async checkForUpdates(gameId: string) {
    const status = this.getStatus(gameId);
    if (
      status.state !== UpdateServiceState.NotChecked &&
      status.state !== UpdateServiceState.NotInvited &&
      status.state !== UpdateServiceState.NotAvailable
    ) {
      return;
    }

    status.progress = null;
    status.state = UpdateServiceState.Checking;

    // Check if the user has been invited.
    status.text = 'Checking access permission...';
    const invitations = await this.gameInvitationService.find({
      where: { gameId, userId: this.identityService.user._id },
    });
    if (invitations.length === 0) {
      status.state = UpdateServiceState.NotInvited;
      return;
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
    const localFiles = await this.getLocalFiles(gameId);
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
      await this.checkForUpdates(gameId);
    } else {
      status.modifiedFiles = [];
      status.progress = null;
      status.state = UpdateServiceState.Ready;
    }
  }

  public getStatus(gameId: string) {
    if (!this.status.has(gameId)) {
      this.status.set(gameId, { state: UpdateServiceState.NotChecked });
    }

    return this.status.get(gameId);
  }

  public play(gameId: string, options: UpdateServicePlayOptions = {}) {
    const status = this.getStatus(gameId);
    if (status.childProcess) {
      return;
    }

    const env = {
      ...process.env,
      ACCESS_TOKEN: this.identityService.accessToken,
      GAME_SERVER_JSON: JSON.stringify(options.gameServer),
      GROUP_ID: options.groupId,
      REFRESH_TOKEN: this.identityService.refreshToken,
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

    return new Promise((resolve, reject) => {
      request
        .get({
          headers: { Authorization: `Bearer ${this.identityService.accessToken}` },
          qs: { query: JSON.stringify({ files: files.join('') }) },
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

    return localFiles;
  }

  private subscribeToServices() {
    this.buildService.onUpdate.subscribe(record => {
      if (!record.gameId) {
        return;
      }

      const status = this.getStatus(record.gameId);

      if (!status.build || record._id !== status.build._id) {
        status.state = UpdateServiceState.NotChecked;
        this.checkForUpdates(record.gameId);
      }
    });

    this.gameInvitationService.onCreate.subscribe(record => {
      const status = this.getStatus(record.gameId);

      if (!status.build) {
        status.state = UpdateServiceState.NotChecked;
        this.checkForUpdates(record.gameId);
      }
    });
  }
}
