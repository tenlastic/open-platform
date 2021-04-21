import 'source-map-support/register';

import * as path from 'path';
import * as requestPromiseNative from 'request-promise-native';

import { getFileChanges } from './get-file-changes';
import { getLocalFiles } from './get-local-files';
import { getRemoteFiles } from './get-remote-files';
import { getZipStream } from './get-zip-stream';

const apiKey = process.env.API_KEY;
const directory = path.resolve(process.env.DIRECTORY);
const entrypoint = process.env.ENTRYPOINT;
const host = process.env.HOST || 'https://api.tenlastic.com';
const namespaceId = process.env.NAMESPACE_ID;
const platform = process.env.PLATFORM;

(async () => {
  try {
    const localFiles = await getLocalFiles(directory);
    console.log(`Found ${localFiles.length} local file(s).`);

    const remoteFiles = await getRemoteFiles(apiKey, host, platform);
    console.log(`Found ${remoteFiles.length} remote file(s).`);

    const { modified, unmodified } = getFileChanges(localFiles, remoteFiles);
    console.log(`Modified: ${modified.length}. Unmodified: ${unmodified.length}.`);

    console.log(`Zipping ${modified.length} local files...`);
    const zipStream = await getZipStream(directory, modified);
    console.log('Uploading zip to remote...');

    let { record } = await requestPromiseNative.post({
      formData: {
        build: JSON.stringify({
          entrypoint,
          name: new Date().toString(),
          namespaceId,
          platform,
        }),
        zip: zipStream,
      },
      headers: { 'X-Api-Key': apiKey },
      json: true,
      url: `${host}/builds`,
    });
    console.log(`Waiting for Build to finish...`);

    while (!record.status || record.status.phase !== 'Succeeded') {
      await new Promise(res => setTimeout(res, 5000));

      const response = await requestPromiseNative.get({
        headers: { 'X-Api-Key': apiKey },
        json: true,
        qs: { query: JSON.stringify({ where: { _id: record._id } }) },
        url: `${host}/builds`,
      });
      record = response.records[0];

      console.log(`Build status: ${record.status.phase}.`);
    }
  } catch (e) {
    if (e.name === 'StatusCodeError') {
      console.error(`StatusCodeError: ${e.statusCode} - ${e.response.body}.`);
    } else {
      console.error(e.message);
    }

    process.exit(1);
  }
})();
