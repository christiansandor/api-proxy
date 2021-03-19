import * as yargs from 'yargs';
import { Subject } from 'rxjs';
import { lstatSync, readFileSync, watchFile } from 'fs';
import { transformAndValidateSync } from 'class-transformer-validator';
import { parse } from 'yaml';
import { getFullPath } from './utils';
import { Config } from './dto/config.dto';
import { logSystemMessage } from './log';

interface ICmd {
  config: string;
  watch: boolean;
}

const cmd = yargs
  .usage('Usage: api-proxy [-c config path] [-w]')
  .option('config', {
    type: 'string',
    alias: 'c',
    default: '',
    describe: 'Configuration YAML or JSON file, defaults to api-proxy-config.yaml|yml',
  })
  .option('watch', {
    type: 'boolean',
    alias: 'w',
    default: false,
    describe: 'Keep the config updated on file change, defaults to false',
  })
  .version()
  .argv as unknown as ICmd;

const configSubject$ = new Subject<Config>();
let configPath: string;

const refreshConfig = () => {
  try {
    const content = readFileSync(configPath, 'utf8');
    const json = parse(content);
    const config = transformAndValidateSync(Config, json) as Config;

    configSubject$.next(config);
  } catch (err) {
    throw new Error('Cannot load invalid config.');
  }
};

export const config$ = configSubject$.asObservable();

export function initConfig() {
  const initialConfigPath = [cmd.config, 'api-proxy-config.yaml', 'api-proxy-config.yml'].filter(Boolean).find(path => {
    try {
      return !!lstatSync(getFullPath(path));
    } catch (err) {
      return false;
    }
  });

  if (!initialConfigPath) {
    logSystemMessage('No valid configuration provided. Use -c or --config to specify a configuration file, or use api-proxy in a folder where an api-proxy-config.yaml is present.');
    process.exit(1);
    return;
  }

  configPath = getFullPath(initialConfigPath);
  refreshConfig();

  logSystemMessage('Using config "%s"', initialConfigPath);

  if (cmd.watch) {
    logSystemMessage('Watching for configuration changes');
    watchFile(configPath, () => {
      refreshConfig();
    });
  }
}
