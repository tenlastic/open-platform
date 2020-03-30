import * as fs from 'fs';
import { OptionsWithUrl } from 'request-promise-native';

export interface Configuration {
  ca?: Buffer;
  cert?: Buffer;
  certPath?: string;
  registryUrl?: string;
  key?: Buffer;
  url?: string;
}

export interface InputOptions {
  certPath?: string;
  registryUrl?: string;
  url: string;
}

export let configuration: Configuration = {};

export function init(options: InputOptions) {
  configuration.certPath = options.certPath;
  configuration.registryUrl = options.registryUrl;
  configuration.url = options.url;

  if (configuration.certPath) {
    configuration.ca = fs.readFileSync(`${configuration.certPath}/ca.pem`);
    configuration.cert = fs.readFileSync(`${configuration.certPath}/cert.pem`);
    configuration.key = fs.readFileSync(`${configuration.certPath}/key.pem`);
  }
}

export function getConfiguration() {
  return configuration;
}

export function getDefaultRequestOptions() {
  const options: Partial<OptionsWithUrl> = {};

  if (configuration.certPath) {
    options.ca = configuration.ca;
    options.cert = configuration.cert;
    options.key = configuration.key;
    options.rejectUnauthorized = false;
  }

  if (configuration.registryUrl) {
    const url = new URL(configuration.registryUrl);
    const credentials = JSON.stringify({
      password: url.password,
      serveraddress: url.host,
      username: url.username,
    });

    const xRegistryAuth = Buffer.from(credentials).toString('base64');
    options.headers = { 'X-Registry-Auth': xRegistryAuth };
  }

  return options;
}
