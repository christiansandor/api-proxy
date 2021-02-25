import 'reflect-metadata';
import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { router } from './router';
import * as https from 'https';
import { Server as SecureServer } from 'https';
import * as http from 'http';
import { Server } from 'http';
import { readFileSync } from 'fs';
import { Config, config$, initConfig } from './config';
import { getFullPath } from './utils';

const app = express();

app.set('trust proxy', 1);

app.use(morgan('tiny'));
app.use(helmet());
app.use(cors({
  optionsSuccessStatus: 200,
}));

app.use(router);

let server: Server;
let secureServer: SecureServer;
let snapshot: Config;

config$.subscribe(config => {
  const { port, securePort, secureCertificate, secureCertificateKey } = snapshot || {} as Config;

  if (!port || port !== config.port) {
    if (server) {
      console.log(`Closing server on http://localhost:${port}`);
      server.close();

      if (!config.port) {
        console.log(`Closing server on http://localhost:${port}`);
        server = null;
      }
    }

    if (config.port) {
      if (!server) {
        server = http.createServer(app);
      }

      server.listen(config.port, () => {
        if (port) {
          console.log(`Changing server port from http://localhost:${port} to http://localhost:${config.port}`);
        } else {
          console.log(`Listening on http://localhost:${config.port}`);
        }
      });
    }
  }

  if (!securePort || securePort !== config.securePort || secureCertificate !== config.secureCertificate || secureCertificateKey !== config.secureCertificateKey) {
    if (secureServer) {
      secureServer.close();

      if (!config.securePort) {
        console.log(`Closing server on https://localhost:${securePort}`);
        secureServer = null;
      }
    }

    if (config.securePort) {
      if (!config.secureCertificate || !config.secureCertificateKey) {
        throw new Error('Invalid secure server config: Missing config for certificate or key');
      }

      const cert = readFileSync(getFullPath(config.secureCertificate));
      const key = readFileSync(getFullPath(config.secureCertificateKey));

      if (!secureServer) {
        secureServer = https.createServer({ cert, key }, app);
      }

      secureServer.listen(config.securePort, () => {
        if (securePort) {
          console.log(`Changing server port from https://localhost:${securePort} to https://localhost:${config.securePort}`);
        } else {
          console.log(`Listening on https://localhost:${config.securePort}`);
        }
      });
    }
  }

  snapshot = config;
});

initConfig();

