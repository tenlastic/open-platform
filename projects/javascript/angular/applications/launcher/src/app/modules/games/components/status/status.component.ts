import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import { File, FileService, Game, Release, ReleaseService } from '@tenlastic/ng-http';
import { last, map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-status',
  styleUrls: ['./status.component.scss'],
  templateUrl: './status.component.html',
})
export class StatusComponent implements OnInit {
  @Input() public game: Game;

  public buttonIcon: string;
  public buttonText: string;
  public isButtonDisabled: boolean;
  public modifiedFiles: File[] = [];
  public progress: any = {};
  public statusText: string;

  private get platform() {
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
  private release: Release;

  constructor(
    private electronService: ElectronService,
    private fileService: FileService,
    private identityService: IdentityService,
    private releaseService: ReleaseService,
  ) {}

  public async ngOnInit() {
    await this.checkForUpdates();
  }

  public play() {
    const directory = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
    const target = `${directory}/${this.game.slug}/${this.release.entrypoint}.exe`;

    this.electronService.childProcess.execFileSync(target, [
      `--accessToken ${this.identityService.accessToken}`,
      `--refreshToken ${this.identityService.refreshToken}`,
    ]);
  }

  public async update() {
    if (this.modifiedFiles.length === 0) {
      return this.play();
    }

    this.setButton(null, 'Updating...', true);

    this.setStatus('Downloading update...');
    const response = await this.download();

    this.setStatus('Installing update...');
    await this.unzip(response);

    this.modifiedFiles = [];

    this.setButton('play_arrow', 'Play', false);
    this.setStatus(null);
  }

  private async checkForUpdates() {
    this.buttonText = 'Checking for updates...';
    this.isButtonDisabled = true;

    this.setStatus('Retrieving latest release...');
    const releases = await this.releaseService.find({
      sort: 'publishedAt',
      where: {
        $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }],
        gameId: this.game._id,
      },
    });

    if (releases.length === 0) {
      this.setButton(null, 'Not Available', true);
      this.setStatus();
      return;
    }

    this.setStatus('Retrieving release files...');
    this.release = releases[0];
    const remoteFiles = await this.fileService.find(this.release._id, this.platform, {
      limit: 10000,
    });
    if (remoteFiles.length === 0) {
      this.setButton(null, 'Not Available', true);
      this.setStatus();
      return;
    }

    this.setStatus('Checking local files...');
    const localFiles = await this.getLocalFiles();
    if (localFiles.length === 0) {
      this.modifiedFiles = remoteFiles;

      this.setButton('get_app', 'Install', false);
      this.setStatus();

      return;
    }

    this.setStatus('Deleting stale files...');
    await this.deleteRemovedFiles(remoteFiles, localFiles);

    const updatedFiles = remoteFiles.filter((rf, i) => {
      this.setStatus('Calculating updated files...', i, remoteFiles.length);

      const directory = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
      const localFile = localFiles.find(
        lf => lf.path === `${directory}/${this.game.slug}/${rf.path}`,
      );

      return !localFile || localFile.md5 !== rf.md5;
    });

    if (updatedFiles.length > 0) {
      this.modifiedFiles = updatedFiles;

      this.setButton('get_app', 'Update', false);
      this.setStatus();
    } else {
      this.modifiedFiles = [];

      this.setButton('play_arrow', 'Play', false);
      this.setStatus();
    }
  }

  private async deleteRemovedFiles(
    remoteFiles: File[],
    localFiles: { md5: string; path: string }[],
  ) {
    const { fs } = this.electronService;

    for (const localFile of localFiles) {
      const directory = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
      const localPath = localFile.path.replace(`${directory}/${this.game.slug}/`, '');
      const remotePaths = remoteFiles.map(rf => rf.path);

      if (!remotePaths.includes(localPath)) {
        await new Promise(resolve =>
          fs.unlink(`${directory}/${this.game.slug}/${localPath}`, err => resolve()),
        );
      }
    }
  }

  private async download() {
    const compressedBytes = this.modifiedFiles.reduce(
      (previousValue, currentValue) => previousValue + currentValue.compressedBytes,
      0,
    );

    return this.fileService
      .download(this.release._id, this.platform, {
        include: this.modifiedFiles.map(f => f.path),
      })
      .pipe(
        map(event => this.getEventMessage(event, compressedBytes)),
        tap(message => {
          if (!message || !message.current || !message.total) {
            return;
          }

          return this.setStatus('Downloading update...', message.current, message.total);
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

  private async getLocalFiles() {
    const { crypto, fs, glob } = this.electronService;

    const directory = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
    const files = glob.sync(`${directory}/${this.game.slug}/**/*`, { nodir: true });

    const localFiles: { md5: string; path: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      this.setStatus('Checking local files...', i, files.length);

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

  private setButton(icon: string, text: string, disabled: boolean) {
    this.buttonIcon = icon;
    this.buttonText = text;
    this.isButtonDisabled = disabled;
  }

  private setStatus(text: string = null, current: number = null, total: number = null) {
    this.statusText = text;
    this.progress = { current, total };
  }

  private async unzip(response: any) {
    // Convert blob into buffer.
    const { unzipper } = this.electronService;
    const buffer = await new Promise<Buffer>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Buffer(reader.result as string));
      reader.readAsArrayBuffer(response);
    });

    // Extract zip contents to Game directory.
    const fs = this.electronService.fs;
    const directory = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
    const root = await unzipper.Open.buffer(buffer);
    const files = root.files.filter(f => f.type === 'File');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      this.setStatus('Installing update...', i, files.length);

      const target = `${directory}/${this.game.slug}/${file.path}`;
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
