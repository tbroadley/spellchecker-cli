import { readFileSync } from 'fs';

import { printError } from '../print-error';

import { ExternalConfig } from './types';

export function readFromPackage(): ExternalConfig {
  let config;
  try {
    config = JSON.parse(readFileSync('package.json') as unknown as string);
  } catch (err) {
    if ((err as Error).name === 'SyntaxError') {
      printError('Unable to parse package.json');
    } else {
      printError(`Unable to parse package.json. Error: ${(err as Error).message}`);
    }
  }
  if ('spellchecker' in config) {
    return config.spellchecker;
  }
  return {};
}
