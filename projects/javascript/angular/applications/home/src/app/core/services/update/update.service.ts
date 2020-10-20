import { Injectable } from '@angular/core';
import {
  File,
  FileService,
  Game,
  GameInvitationService,
  GameServer,
  LoginService,
  Release,
  ReleaseService,
} from '@tenlastic/ng-http';
import { ChildProcess } from 'child_process';
import { Subject } from 'rxjs';

import { ElectronService, IdentityService } from '../../services';

export enum UpdateServiceState {
  Checking,
  Downloading,
  Installing,
  NotAvailable,
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
  childProcess?: ChildProcess;
  game?: Game;
  isInstalled?: boolean;
  modifiedFiles?: File[];
  progress?: UpdateServiceProgress;
  release?: Release;
  state?: UpdateServiceState;
  text?: string;
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  public OnChange = new Subject<Map<Game, UpdateServiceStatus>>();

  private get installPath() {
    return this.electronService.remote.app.getPath('home').replace(/\\/g, '/') + '/Tenlastic';
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
    private electronService: ElectronService,
    private fileService: FileService,
    private gameInvitationService: GameInvitationService,
    private identityService: IdentityService,
    private loginService: LoginService,
    private releaseService: ReleaseService,
  ) {
    this.subscribeToServices();

    this.loginService.onLogout.subscribe(() => this.clear());
  }

  public async checkForUpdates(game: Game) {
    const status = this.getStatus(game);
    if (
      status.state >= 0 &&
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
      where: {
        namespaceId: game.namespaceId,
        toUserId: this.identityService.user._id,
      },
    });
    if (invitations.length === 0) {
      status.state = UpdateServiceState.NotInvited;
      return;
    }

    // Get the latest Release from the server.
    status.text = 'Retrieving latest release...';
    const releases = await this.releaseService.find({
      sort: '-publishedAt',
      where: {
        $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }],
        namespaceId: game.namespaceId,
      },
    });
    if (releases.length === 0) {
      status.state = UpdateServiceState.NotAvailable;
      return;
    }

    // Find Files associated with latest Release.
    status.progress = null;
    status.text = 'Retrieving release files...';
    status.release = releases[0];
    const remoteFiles = await this.fileService.find(status.release._id, this.platform, {
      limit: 10000,
    });
    if (remoteFiles.length === 0) {
      status.state = UpdateServiceState.NotAvailable;
      return;
    }

    // Calculate local file checksums.
    status.progress = null;
    status.text = 'Checking local files...';
    const localFiles = await this.getLocalFiles(game);
    if (localFiles.length === 0) {
      status.modifiedFiles = remoteFiles;
      status.state = UpdateServiceState.NotInstalled;
      return;
    }

    // Delete files no longer listed in the Release.
    status.isInstalled = true;
    status.progress = null;
    status.text = 'Deleting stale files...';
    await this.deleteRemovedFiles(game, localFiles, remoteFiles);

    // Calculate which files either don't exist locally or have a different checksum.
    status.progress = null;
    status.text = 'Calculating updated files...';
    let updatedFiles = remoteFiles;
    if (localFiles.length > 0) {
      const localFilePaths = localFiles.reduce((previous, current) => {
        previous[current.path] = current;
        return previous;
      }, {});

      updatedFiles = remoteFiles.filter((rf, i) => {
        status.progress = { current: i, total: remoteFiles.length };

        const localFile = localFilePaths[`${this.installPath}/${game._id}/${rf.path}`];
        return !localFile || localFile.md5 !== rf.md5;
      });
    }

    if (updatedFiles.length > 0) {
      status.modifiedFiles = updatedFiles;
      status.progress = null;
      status.state = UpdateServiceState.NotUpdated;

      this.update(status.game);
    } else {
      status.modifiedFiles = [];
      status.progress = null;
      status.state = UpdateServiceState.Ready;
    }
  }

  public getStatus(game: Game) {
    if (!this.status.has(game._id)) {
      this.status.set(game._id, { game });
      this.checkForUpdates(game);
    }

    return this.status.get(game._id);
  }

  public play(game: Game, options: UpdateServicePlayOptions = {}) {
    const status = this.getStatus(game);
    if (status.childProcess) {
      return;
    }

    const target = `${this.installPath}/${game._id}/${status.release.entrypoint}.exe`;

    const env = {
      ...process.env,
      ACCESS_TOKEN: this.identityService.accessToken,
      GAME_SERVER_ID: options.gameServer._id,
      GAME_SERVER_JSON: JSON.stringify(options.gameServer),
      GROUP_ID: options.groupId,
      REFRESH_TOKEN: this.identityService.refreshToken,
    };

    status.childProcess = this.electronService.childProcess.execFile(target, null, { env });
    status.childProcess.on('close', () => (status.childProcess = null));
  }

  public stop(game: Game) {
    const status = this.getStatus(game);
    if (!status.childProcess) {
      return;
    }

    status.childProcess.kill();
  }

  public async update(game: Game) {
    const status = this.getStatus(game);

    status.progress = null;
    status.state = UpdateServiceState.Downloading;
    status.text = 'Downloading and installing update...';

    try {
      await this.download(game);
    } catch (e) {
      console.error(e);
    }

    // Make sure download is complete.
    status.state = -1;
    await this.checkForUpdates(game);
    if (status.modifiedFiles.length > 0) {
      this.update(game);
    }
  }

  private clear() {
    this.status = new Map();
  }

  private async deleteRemovedFiles(
    game: Game,
    localFiles: { md5: string; path: string }[],
    remoteFiles: File[],
  ) {
    const { fs } = this.electronService;

    for (const localFile of localFiles) {
      const localPath = localFile.path.replace(`${this.installPath}/${game._id}/`, '');
      const remotePaths = remoteFiles.map(rf => rf.path);

      if (!remotePaths.includes(localPath)) {
        await new Promise(resolve =>
          fs.unlink(`${this.installPath}/${game._id}/${localPath}`, err => resolve()),
        );
      }
    }
  }

  private async download(game: Game) {
    const status = this.getStatus(game);

    let downloadedBytes = 0;
    const start = performance.now();
    const totalBytes = status.modifiedFiles.reduce(
      (previousValue, currentValue) => previousValue + currentValue.compressedBytes,
      0,
    );

    const include = status.modifiedFiles.map(f => f.path);
    const { fs, request, unzipper } = this.electronService;

    return new Promise((resolve, reject) => {
      request
        .post({
          body: { include },
          headers: { Authorization: `Bearer ${this.identityService.accessToken}` },
          json: true,
          url: `${this.fileService.basePath}/${status.release._id}/platforms/${this.platform}/files/download`,
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

          const target = `${this.installPath}/${game._id}/${entry.path}`;
          const targetDirectory = target.substr(0, target.lastIndexOf('/'));
          if (!fs.existsSync(targetDirectory)) {
            fs.mkdirSync(targetDirectory, { recursive: true } as any);
          }

          entry.pipe(fs.createWriteStream(target));
        })
        .on('error', reject);
    });
  }

  private async getLocalFiles(game: Game) {
    const { crypto, fs, glob } = this.electronService;
    const status = this.getStatus(game);

    const files = glob.sync(`${this.installPath}/${game._id}/**/*`, { nodir: true });

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
    this.gameInvitationService.onCreate.subscribe(record => {
      const game = this.status.get(record.gameId).game;
      const status = this.getStatus(game);

      if (!status.release) {
        status.state = -1;
        this.checkForUpdates(game);
      }
    });

    this.releaseService.onUpdate.subscribe(record => {
      const game = this.status.get(record.gameId).game;
      const status = this.getStatus(game);

      if (!status.release || record._id !== status.release._id) {
        status.state = -1;
        this.checkForUpdates(game);
      }
    });
  }
}
