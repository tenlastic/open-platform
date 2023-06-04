import { BuildModel, IBuild } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { Chance } from 'chance';
import * as FormData from 'form-data';
import * as JSZip from 'jszip';

import dependencies from '../dependencies';

const chance = new Chance();

export async function createBuild(dockerfile: string, namespaceId: string) {
  // Generate a zip stream from the Dockerfile.
  const zip = new JSZip().file('Dockerfile', dockerfile);
  const buffer = await zip.generateAsync({
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
    type: 'nodebuffer',
  });

  // Create the Build.
  let build = await dependencies.buildService.create(namespaceId, () => {
    const formData = new FormData();
    formData.append(
      'record',
      JSON.stringify({
        entrypoint: 'Dockerfile',
        name: chance.hash({ length: 32 }),
        platform: IBuild.Platform.Server64,
      } as BuildModel),
    );
    formData.append('zip', buffer, { contentType: 'application/zip', filename: 'example.zip' });
    return formData;
  });

  // Wait for the Build to finish successfully.
  await wait(5 * 1000, 2 * 60 * 1000, async () => {
    build = await dependencies.buildService.findOne(namespaceId, build._id);
    return build.status.phase === 'Succeeded';
  });

  return build;
}

export async function createNamespace(name: string) {
  // Create the Namespace.
  let namespace = await dependencies.namespaceService.create({
    limits: {
      bandwidth: 1 * 1000 * 1000 * 1000,
      cpu: 1,
      memory: 1 * 1000 * 1000 * 1000,
      storage: 10 * 1000 * 1000 * 1000,
    },
    name,
  });

  // Wait for the Namespace to run successfully.
  await wait(5 * 1000, 60 * 1000, async () => {
    namespace = await dependencies.namespaceService.findOne(namespace._id);
    return namespace.status.phase === 'Running';
  });

  return namespace;
}

export async function deleteNamespace(name: string) {
  if (!name) {
    return;
  }

  const namespaces = await dependencies.namespaceService.find({ where: { name } });
  if (namespaces.length === 0) {
    return;
  }

  return dependencies.namespaceService.delete(namespaces[0]._id);
}

export async function deleteUser(username: string) {
  if (!username) {
    return;
  }

  const users = await dependencies.userService.find({ where: { username } });
  if (users.length === 0) {
    return;
  }

  return dependencies.userService.delete(users[0]._id);
}
