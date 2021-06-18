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
      process.exit(1);
    }
    return {};
  }
  if ('spellchecker' in config) {
    return config.spellchecker;
  }
  return {};
}
