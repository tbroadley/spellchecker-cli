import { extname } from 'path';
import appRootPath from 'app-root-path';
import { accessSync, readFileSync } from 'fs';
import yaml from 'js-yaml';
import { jsonc } from 'jsonc';

import { printError } from './print-error';

const tryLoad = (filePath: any) => {
  let result;

  try {
    const fileContents = readFileSync(filePath, 'utf8');
    const extension = extname(filePath).slice(1);
    if (extension === 'yaml' || extension === 'yml') {
      result = yaml.load(fileContents);
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

export const readConfigFile = (filePathFromArgs: any) => {
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
