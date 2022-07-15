import { accessSync, readFileSync } from 'fs';
import { extname } from 'path';

import appRootPath from 'app-root-path';
import yaml from 'js-yaml';
import { jsonc } from 'jsonc';

import { printError } from '../print-error.js';

import { ExternalConfig } from './types.js';

const tryLoad = (filePath: string): ExternalConfig => {
  let result: ExternalConfig;

  try {
    const fileContents = readFileSync(filePath, 'utf8');
    const extension = extname(filePath).slice(1);
    if (extension === 'yaml' || extension === 'yml') {
      result = yaml.load(fileContents) as ExternalConfig;
    } else {
      // extension is "json" or "jsonc"
      result = jsonc.parse(fileContents);
    }
  } catch (e) {
    printError(`Failed to read config file at ${filePath}. Error: ${e}`);
    process.exit(1);
  }

  return result;
};

export const readConfigFile = (filePathFromArgs: string|undefined): ExternalConfig => {
  if (filePathFromArgs) {
    return tryLoad(filePathFromArgs);
  }

  const filePath = [
    '/.spellcheckerrc.yaml',
    '/.spellcheckerrc.yml',
    './spellcheckerrc.json',
    './spellcheckerrc.jsonc',
  ]
    .map(path => appRootPath.resolve(path))
    .find((path) => {
      try {
        accessSync(path);
      } catch (e) {
        return false;
      }

      return true;
    });

  return filePath ? tryLoad(filePath) : {};
};
