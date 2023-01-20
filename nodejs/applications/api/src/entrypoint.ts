import 'source-map-support/register';
import '@tenlastic/logging';

import * as minio from '@tenlastic/minio';
import * as mongoose from '@tenlastic/mongoose';
import { URL } from 'url';

import mailgun from './mailgun';
import * as nats from './nats';
import * as webServer from './web-server';

const mailgunDomain = process.env.MAILGUN_DOMAIN;
const mailgunSecret = process.env.MAILGUN_SECRET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = 'api';
const natsConnectionString = process.env.NATS_CONNECTION_STRING;

(async () => {
  try {
    // Mailgun.
    mailgun.setup({ domain: mailgunDomain, secret: mailgunSecret });

    // Minio.
    const minioConnectionUrl = new URL(minioConnectionString);
    minio.connect({
      accessKey: minioConnectionUrl.username,
      endPoint: minioConnectionUrl.hostname,
      port: Number(minioConnectionUrl.port || '443'),
      secretKey: minioConnectionUrl.password,
      useSSL: minioConnectionUrl.protocol === 'https:',
    });

    // MongoDB.
    await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    // NATS.
    await nats.setup({ connectionString: natsConnectionString, database: mongoDatabaseName });

    // Web Server.
    webServer.setup();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
