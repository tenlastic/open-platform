import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import { File, FileService, Game, Release, ReleaseService } from '@tenlastic/ng-http';
import { ChildProcess } from 'child_process';
import { Subject } from 'rxjs';
import { last, map, tap, retry } from 'rxjs/operators';

export enum UpdateServiceState {
  Checking,
  Downloading,
  Installing,
  NotAvailable,
  NotInstalled,
  NotUpdated,
  Ready,
}

export interface UpdateServiceProgress {
  current?: number;
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
    private identityService: IdentityService,
    private releaseService: ReleaseService,
  ) {
    this.subscribeToServices();
  }

  public async checkForUpdates(game: Game) {
    const status = this.getStatus(game);
    if (status.state >= 0) {
      return;
    }

    // Get the latest Release from the server.
    status.progress = null;
    status.state = UpdateServiceState.Checking;
    status.text = 'Retrieving latest release...';
    const releases = await this.releaseService.find({
      sort: '-publishedAt',
      where: {
        $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }],
        gameId: game._id,
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

        const localFile = localFilePaths[`${this.installPath}/${game.slug}/${rf.path}`];
        return !localFile || localFile.md5 !== rf.md5;
      });
    }

    if (updatedFiles.length > 0) {
      status.modifiedFiles = updatedFiles;
      status.progress = null;
      status.state = UpdateServiceState.NotUpdated;
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

  public play(game: Game) {
    const status = this.getStatus(game);
    const target = `${this.installPath}/${game.slug}/${status.release.entrypoint}.exe`;

    status.childProcess = this.electronService.childProcess.execFile(target, [
      `--accessToken ${this.identityService.accessToken}`,
      `--refreshToken ${this.identityService.refreshToken}`,
    ]);
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
    status.text = 'Downloading update...';
    const response = await this.download(game);

    status.progress = null;
    status.state = UpdateServiceState.Installing;
    status.text = 'Installing update...';
    await this.unzip(game, response);

    // Make sure download is complete.
    status.state = -1;
    await this.checkForUpdates(game);
    if (status.modifiedFiles.length > 0) {
      this.update(game);
    }
  }

  private async deleteRemovedFiles(
    game: Game,
    localFiles: { md5: string; path: string }[],
    remoteFiles: File[],
  ) {
    const { fs } = this.electronService;

    for (const localFile of localFiles) {
      const localPath = localFile.path.replace(`${this.installPath}/${game.slug}/`, '');
      const remotePaths = remoteFiles.map(rf => rf.path);

      if (!remotePaths.includes(localPath)) {
        await new Promise(resolve =>
          fs.unlink(`${this.installPath}/${game.slug}/${localPath}`, err => resolve()),
        );
      }
    }
  }

  private async download(game: Game) {
    const status = this.getStatus(game);
    const compressedBytes = status.modifiedFiles.reduce(
      (previousValue, currentValue) => previousValue + currentValue.compressedBytes,
      0,
    );

    const include = status.modifiedFiles.map(f => f.path);
    return this.fileService
      .download(status.release._id, this.platform, { include })
      .pipe(
        retry(3),
        map(event => this.getEventMessage(event, compressedBytes)),
        tap(message => {
          if (!message || !message.current || !message.total) {
            return;
          }

          status.progress = { current: message.current, total: message.total };
        }),
        last(),
      )
      .toPromise();
  }

  private getEventMessage(event: HttpEvent<any>, compressedBytes: number) {
    switch (event.type) {
      case HttpEventType.Sent:
        return { current: 0, total: compressedBytes };

      case HttpEventType.DownloadProgress:
        return { current: event.loaded, total: compressedBytes };

      case HttpEventType.Response:
        return event.body;
    }
  }

  private async getLocalFiles(game: Game) {
    const { crypto, fs, glob } = this.electronService;
    const status = this.getStatus(game);

    const files = glob.sync(`${this.installPath}/${game.slug}/**/*`, { nodir: true });

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
    this.releaseService.onUpdate.subscribe(record => {
      const game = this.status.get(record.gameId).game;
      const status = this.getStatus(game);

      if (!status.release || record._id !== status.release._id) {
        status.state = -1;
        this.checkForUpdates(game);
      }
    });
  }

  private async unzip(game: Game, response: any) {
    const status = this.getStatus(game);

    // Convert blob into buffer.
    const { unzipper } = this.electronService;
    const buffer = await new Promise<Buffer>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Buffer(reader.result as string));
      reader.readAsArrayBuffer(response);
    });

    // Extract zip contents to Game directory.
    const fs = this.electronService.fs;
    const root = await unzipper.Open.buffer(buffer);
    const files = root.files.filter(f => f.type === 'File');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      status.progress = { current: i, total: files.length };

      const target = `${this.installPath}/${game.slug}/${file.path}`;
      const targetDirectory = target.substr(0, target.lastIndexOf('/'));
      if (!fs.existsSync(targetDirectory)) {
        fs.mkdirSync(targetDirectory, { recursive: true } as any);
      }

      await new Promise((resolve, reject) => {
        file
          .stream()
          .pipe(fs.createWriteStream(target))
          .on('error', reject)
          .on('finish', resolve);
      });
    }
  }
}
