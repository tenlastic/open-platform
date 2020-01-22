import { Component, Input, OnInit } from '@angular/core';
import { ElectronService } from '@tenlastic/ng-electron';
import { File, FileService, Game, Release, ReleaseService } from '@tenlastic/ng-http';
import SparkMd5 from 'spark-md5';

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
  public progressText: string;
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
    private releaseService: ReleaseService,
  ) {}

  public async ngOnInit() {
    await this.checkForUpdates();
  }

  public play() {
    const directory = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
    const target = `${directory}/${this.game.slug}/${this.release.entrypoint}.exe`;

    this.electronService.childProcess.execFileSync(target);
  }

  public async update() {
    if (this.modifiedFiles.length === 0) {
      return this.play();
    }

    this.buttonIcon = null;
    this.buttonText = 'Updating...';
    this.isButtonDisabled = true;
    this.statusText = 'Downloading updates...';

    const response = await this.fileService.download(this.release._id, this.platform, {
      include: this.modifiedFiles.map(f => f.path),
    });

    this.statusText = 'Installing updates...';

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
      this.progressText = `${i} / ${files.length} Files`;

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

    this.buttonIcon = 'play_arrow';
    this.buttonText = 'Play';
    this.isButtonDisabled = false;
    this.progressText = null;
    this.statusText = null;

    this.modifiedFiles = [];
  }

  private async checkForUpdates() {
    this.buttonText = 'Checking for updates...';
    this.isButtonDisabled = true;

    this.statusText = 'Retrieving latest release...';
    const releases = await this.releaseService.find({
      sort: 'publishedAt',
      where: {
        $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }],
        gameId: this.game._id,
      },
    });

    if (releases.length === 0) {
      this.buttonText = 'No Updates Available';
      this.isButtonDisabled = true;
      this.statusText = null;
      return;
    }

    this.statusText = 'Retrieving release files...';
    this.release = releases[0];
    const remoteFiles = await this.fileService.find(this.release._id, this.platform, {
      limit: 10000,
    });
    if (remoteFiles.length === 0) {
      this.buttonText = 'No Updates Available';
      this.isButtonDisabled = true;
      this.statusText = null;
      return;
    }

    this.statusText = 'Finding local files...';
    const localFiles = await this.getLocalFiles();
    if (localFiles.length === 0) {
      this.buttonIcon = 'get_app';
      this.buttonText = 'Install';
      this.isButtonDisabled = false;
      this.modifiedFiles = remoteFiles;

      return;
    }

    this.statusText = 'Calculating updated files...';
    const updatedFiles = remoteFiles.filter((rf, i) => {
      this.progressText = `Checking ${i} / ${remoteFiles.length} Files`;
      const directory = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
      const localFile = localFiles.find(
        lf => lf.path === `${directory}/${this.game.slug}/${rf.path}`,
      );

      return !localFile || localFile.md5 !== rf.md5;
    });

    if (updatedFiles.length > 0) {
      this.buttonIcon = 'get_app';
      this.buttonText = 'Update';
      this.isButtonDisabled = false;
      this.modifiedFiles = updatedFiles;
      this.statusText = null;
      this.progressText = null;
    } else {
      this.buttonIcon = 'play_arrow';
      this.buttonText = 'Play';
      this.isButtonDisabled = false;
      this.modifiedFiles = [];
      this.statusText = null;
      this.progressText = null;
    }
  }

  private getLocalFiles() {
    const { fs, glob } = this.electronService;

    const directory = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
    const files = glob.sync(`${directory}/${this.game.slug}/**/*`, { nodir: true });

    const promises = files.map(async path => {
      const file = await new Promise<Buffer>(resolve =>
        fs.readFile(path, (err, buffer) => resolve(buffer)),
      );

      const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
      const md5 = SparkMd5.ArrayBuffer.hash(arrayBuffer);

      return { md5, path };
    });

    return Promise.all(promises);
  }
}
