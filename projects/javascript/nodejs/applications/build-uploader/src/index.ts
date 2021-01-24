import 'source-map-support/register';

import * as path from 'path';
import * as requestPromiseNative from 'request-promise-native';

import { fetchCompletedTasks } from './fetch-completed-tasks';
import { getFileChanges } from './get-file-changes';
import { getLocalFiles } from './get-local-files';
import { getRemoteFiles } from './get-remote-files';
import { getZipStream } from './get-zip-stream';

const apiKey = process.env.API_KEY;
const buildId = process.env.BUILD_ID;
const directory = path.resolve(process.env.DIRECTORY);
const host = process.env.HOST || 'https://api.tenlastic.com';
const platform = process.env.PLATFORM;

(async () => {
  try {
    const localFiles = await getLocalFiles(directory);
    console.log(`Found ${localFiles.length} local file(s).`);

    const remoteFiles = await getRemoteFiles(apiKey, buildId, host, platform);
    console.log(`Found ${remoteFiles.length} remote file(s).`);

    const { modified, removed, unmodified } = getFileChanges(localFiles, remoteFiles);
    if (modified.length === 0 && removed.length === 0) {
      console.log('No changes to upload.');
      return;
    }

    console.log(
      `Modified: ${modified.length}. Removed: ${removed.length}. Unmodified: ${unmodified.length}.`,
    );

    console.log(`Zipping ${modified.length} local files...`);
    const zipStream = await getZipStream(directory, modified);
    console.log('Uploading zip to remote...');

    const { tasks } = await requestPromiseNative.post({
      formData: {
        'modified[]': modified,
        'removed[]': removed,
        'unmodified[]': unmodified,
        zip: zipStream,
      },
      headers: { 'X-Api-Key': apiKey },
      json: true,
      url: `${host}/builds/${buildId}/platforms/${platform}/files/upload`,
    });
    console.log(`Waiting for ${tasks.length} task(s) to finish...`);

    let completedTasks = [];
    while (completedTasks.length < tasks.length) {
      await new Promise(res => setTimeout(res, 5000));
      completedTasks = await fetchCompletedTasks(apiKey, buildId, host, tasks);
      console.log(`Completed tasks: ${completedTasks.length} / ${tasks.length}.`);
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
