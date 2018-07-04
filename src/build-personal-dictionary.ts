import { readFile } from 'fs-extra';
import { concat } from 'lodash';
import { extname, join } from 'path';

function toDictionaryRegExp(entry) {
  return new RegExp(`^${entry}$`);
}

async function readPersonalDictionary(filePath) {
  if (extname(filePath).toLowerCase() === '.js') {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(join(process.cwd(), filePath)).map((entry) => {
      if (entry instanceof RegExp) {
        return entry;
      }
      return toDictionaryRegExp(entry);
    });
  }

  const fileContents = await readFile(filePath);
  return fileContents
    .toString()
    .trim()
    .replace(/\r/g, '')
    .split('\n')
    .map(toDictionaryRegExp);
}

export async function buildPersonalDictionary(dictionaryPaths) {
  const personalDictionaries = await Promise.all(dictionaryPaths.map(readPersonalDictionary));
  // @ts-ignore
  return concat(...personalDictionaries);
}
