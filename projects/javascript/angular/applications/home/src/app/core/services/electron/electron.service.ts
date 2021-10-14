import { Injectable } from '@angular/core';
import * as childProcess from 'child_process';
import * as crypto from 'crypto';
import { ipcRenderer, webFrame, remote } from 'electron';
import * as fs from 'fs';
import * as glob from 'glob';
import * as os from 'os';
import * as path from 'path';
import * as request from 'request';
import * as unzipper from 'unzipper';

export enum UpdateStatus {
  Downloading,
  Downloaded,
  NotAvailable,
}

@Injectable({ providedIn: 'root' })
export class ElectronService {
  public childProcess: typeof childProcess;
  public crypto: typeof crypto;
  public fs: typeof fs;
  public glob: typeof glob;
  public ipcRenderer: typeof ipcRenderer;
  public os: typeof os;
  public path: typeof path;
  public remote: typeof remote;
  public request: typeof request;
  public unzipper: typeof unzipper;
  public updateStatus = UpdateStatus.NotAvailable;
  public webFrame: typeof webFrame;

  public get isElectron(): boolean {
    return navigator.userAgent.includes('Electron');
  }

  constructor() {
    if (!this.isElectron) {
      return;
    }

    const { require } = window as any;

    this.childProcess = require('child_process');
    this.crypto = require('crypto');
    this.fs = require('fs');
    this.glob = require('glob');
    this.ipcRenderer = require('electron').ipcRenderer;
    this.os = require('os');
    this.path = require('path');
    this.remote = require('electron').remote;
    this.request = require('request');
    this.unzipper = require('unzipper');
    this.webFrame = require('electron').webFrame;

    this.checkForUpdates();
    this.inspectElementHandler();
  }

  private checkForUpdates() {
    this.ipcRenderer.on('message', (event, text) => {
      if (text.includes('Update available')) {
        this.updateStatus = UpdateStatus.Downloading;
      }

      if (text.includes('Update downloaded')) {
        this.updateStatus = UpdateStatus.Downloaded;
      }
    });
  }

  private inspectElementHandler() {
    const { Menu, MenuItem } = this.remote;

    let rightClickPosition = null;

    const menu = new Menu();
    const menuItem = new MenuItem({
      label: 'Inspect Element',
      click: () => {
        const w = this.remote.getCurrentWebContents() as any;
        w.inspectElement(rightClickPosition.x, rightClickPosition.y);
      },
    });
    menu.append(menuItem);

    window.addEventListener(
      'contextmenu',
      e => {
        e.preventDefault();
        rightClickPosition = { x: e.x, y: e.y };
        menu.popup();
      },
      false,
    );
  }
}
