import path from 'path';

import fs from 'fs-extra';
import concat from 'lodash/concat.js';

const JS_EXTENSIONS = ['.js', '.mjs', '.cjs'];

function toDictionaryRegExp(entry: string) {
  return new RegExp(`^${entry}$`);
}

async function readPersonalDictionary(filePath: string) {
  if (JS_EXTENSIONS.includes(path.extname(filePath).toLowerCase())) {
    const dictionaryEntries = (
      await import(`file://${path.join(process.cwd(), filePath)}`)
    ).default as (string | RegExp)[];
    return dictionaryEntries.map((entry: string | RegExp) => {
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

export const buildPersonalDictionary = async (
  dictionaryPaths: string[]
): Promise<RegExp[]> => {
  if (dictionaryPaths.length === 0) return [];

  const personalDictionaries = await Promise.all(
    dictionaryPaths.map(readPersonalDictionary)
  );
  return concat(personalDictionaries[0], ...personalDictionaries.slice(1));
};
