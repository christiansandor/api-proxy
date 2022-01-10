import { join } from 'path';

const absolutePathReg = /^[\/~]/;
export function getFullPath(path: string) {
  return absolutePathReg.test(path) ? path : join(process.cwd(), path);
}

export function resolveObjectPath(path: string, obj: any): any {
  const [key, ...rest] = path.split('.');
  if (!(key in obj)) {
    return void 0;
  }

  const value = obj[key];
  if (!rest.length) {
    return value;
  }

  if (!value) {
    return void 0;
  }

  return resolveObjectPath(rest.join('.'), value);
}

export function resolveVariables(text: string, variables: object = {}) {
  return text.replace(/\$[a-z0-9.\[\]]+/gi, full => {
    const path = full.slice(1);
    const value = resolveObjectPath(path, variables);

    if (value === null || value === void 0) {
      return '';
    }

    return value;
  });
}
