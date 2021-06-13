import fs from 'fs-extra';
import concat from 'lodash/concat';
import path from 'path';

function toDictionaryRegExp(entry: any) {
  return new RegExp(`^${entry}$`);
}

async function readPersonalDictionary(filePath: any) {
  if (path.extname(filePath).toLowerCase() === '.js') {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(path.join(process.cwd(), filePath)).map((entry: any) => {
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

export const buildPersonalDictionary = async (dictionaryPaths: any) => {
  const personalDictionaries = await Promise.all(dictionaryPaths.map(readPersonalDictionary));
  return concat(...personalDictionaries);
};
