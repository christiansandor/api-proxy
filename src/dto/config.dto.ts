import { IsBoolean, IsEnum, IsMimeType, IsNumber, IsOptional, IsString, IsUppercase, IsUrl, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { METHODS } from 'http';

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
  @IsMimeType()
  readonly contentType: string;

  @IsOptional()
  @IsNumber()
  readonly delay: number = 0;

  @IsOptional()
  @IsBoolean()
  readonly useRegex = false;

  @IsUrl()
  @IsOptional()
  readonly proxyUrl: string;

  @IsBoolean()
  @IsOptional()
  readonly proxyPassQuery: boolean = false;

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
