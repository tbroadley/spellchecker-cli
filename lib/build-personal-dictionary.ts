import path from 'path';

import fs from 'fs-extra';
import concat from 'lodash/concat';

function toDictionaryRegExp(entry: string) {
  return new RegExp(`^${entry}$`);
}

async function readPersonalDictionary(filePath: string) {
  if (path.extname(filePath).toLowerCase() === '.js') {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(path.join(process.cwd(), filePath)).map((entry: string | RegExp) => {
      if (entry instanceof RegExp) {
        return entry;
      }
      return toDictionaryRegExp(entry);
    });
  }

  const fileContents = await fs.readFile(filePath);
  return fileContents
    .toString()
    .trim()
    .replace(/\r/g, '')
    .split('\n')
    .map(toDictionaryRegExp);
}

export const buildPersonalDictionary = async (dictionaryPaths: string[]): Promise<RegExp[]> => {
  if (dictionaryPaths.length === 0) return [];

  const personalDictionaries = await Promise.all(dictionaryPaths.map(readPersonalDictionary));
  return concat(personalDictionaries[0], ...personalDictionaries.slice(1));
};
