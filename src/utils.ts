import { join } from 'path';

const absolutePathReg = /^[\/~]/;
export function getFullPath(path: string) {
  return absolutePathReg.test(path) ? path : join(process.cwd(), path);
}
