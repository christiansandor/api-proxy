import * as yargs from 'yargs';
import { Subject } from 'rxjs';
import { IsBoolean, IsEnum, IsMimeType, IsNumber, IsOptional, IsString, IsUppercase, MinLength } from 'class-validator';
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
    default: true,
    describe: 'Keep the config updated on file change, defaults to true',
  })
  .argv as unknown as ICmd;

export class ConfigRoute {
  @MinLength(1)
  readonly path: string;

  @IsEnum(METHODS)
  @IsUppercase()
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

  @IsOptional()
  @IsBoolean()
  readonly useRegex = false;

  private _regex: RegExp;

  get regex(): RegExp {
    if (this._regex) {
      return this._regex;
    }

    this._regex = new RegExp(this.path.split('?')[0].replace(/\/$/, ''));
    return this.regex;
  }
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
  const p = [cmd.config, 'api-proxy-config.yaml', 'api-proxy-config.yml'].filter(Boolean).find(path => {
    try {
      return !!lstatSync(getFullPath(path));
    } catch (err) {
      return false;
    }
  });

  if (!p) {
    throw new Error('No valid configuration provided.');
  }

  configPath = getFullPath(p);
  refreshConfig();

  if (cmd.watch) {
    watchFile(configPath, () => {
      refreshConfig();
    });
  }
}
