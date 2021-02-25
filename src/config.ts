import * as yargs from 'yargs';
import { Subject } from 'rxjs';
import { IsEnum, IsMimeType, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { METHODS } from 'http';
import { lstatSync, readFileSync, watchFile } from 'fs';
import { transformAndValidateSync } from 'class-transformer-validator';
import { parse } from 'yaml';
import { getFullPath } from './utils';

interface ICmd {
  config: string;
  watch: boolean;
}

const cmd = yargs
  .usage('Usage: api-proxy [-c config path]')
  .alias('c', 'config')
  .describe('config', 'Configuration YAML or JSON file')
  .argv as unknown as ICmd;

export class ConfigRoute {
  @MinLength(1)
  readonly path: string;

  @IsEnum(METHODS)
  readonly method: string;

  @IsOptional()
  readonly body: any = null;

  @IsOptional()
  @IsString()
  readonly file: string = null;

  @IsOptional()
  @IsNumber()
  readonly statusCode: number = 200;

  @IsOptional()
  @IsNumber()
  readonly delay: number = 0;

  @IsOptional()
  @IsMimeType()
  readonly contentType: string;
}

export class Config {
  @IsOptional()
  @IsNumber()
  readonly port: number;

  @IsOptional()
  @IsNumber()
  readonly securePort: number;

  @IsOptional()
  @MinLength(1)
  readonly secureCertificate: string;

  @IsOptional()
  @MinLength(1)
  readonly secureCertificateKey: string;

  @Type(() => ConfigRoute)
  readonly routes: ConfigRoute[];
}

const configSubject$ = new Subject<Config>();

const refreshConfig = () => {
  const configPath = [cmd.config, 'api-proxy-config.yaml', 'api-proxy-config.yml'].filter(Boolean).find(path => {
    try {
      return !!lstatSync(getFullPath(path));
    } catch (err) {
      return false;
    }
  });

  if (!configPath) {
    throw new Error('No valid configuration provided.');
  }

  try {
    const content = readFileSync(getFullPath(configPath), 'utf8');
    const json = parse(content);
    const config = transformAndValidateSync(Config, json) as Config;

    configSubject$.next(config);
  } catch (err) {
    throw new Error('Cannot load invalid config.');
  }
};

export const config$ = configSubject$.asObservable();

export function initConfig() {
  refreshConfig();
  watchFile(cmd.config, () => {
    refreshConfig();
  });
}
