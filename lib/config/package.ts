import { accessSync, readFileSync } from 'fs';

import appRootPath from 'app-root-path';

import { printError } from '../print-error';

import { ExternalConfig } from './types';

export function readFromPackage(): ExternalConfig {
  const path = appRootPath.resolve('package.json');
  try {
    accessSync(path);
  } catch {
    return {};
  }
  let config;
  try {
    config = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    if ((err as Error).name === 'SyntaxError') {
      printError('Unable to parse package.json');
    } else {
      printError(`Unable to parse package.json: ${(err as Error).message}`);
    }
    process.exit(1);
  }
  if ('spellchecker' in config) {
    return config.spellchecker;
  }
  return {};
}
