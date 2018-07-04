#!/usr/bin/env node

import { writeFile } from 'fs-extra';
import * as glob from 'globby';
import * as report from 'vfile-reporter';

import { buildPersonalDictionary } from './build-personal-dictionary';
import { parseArgs } from './command-line';
import { hasMessages } from './has-messages';
import { printError } from './print-error';
import { Spellchecker } from './spellchecker';
import { toDictionary } from './to-dictionary';

(async () => {
  const {
    files,
    language,
    personalDictionaryPaths,
    generateDictionary,
    ignoreRegexes,
    suggestions,
    plugins,
    quiet,
  } = parseArgs();

  const personalDictionary = await buildPersonalDictionary(personalDictionaryPaths);
  const spellchecker = new Spellchecker({
    ignoreRegexes,
    language,
    personalDictionary,
    plugins,
    suggestions,
  });

  if (personalDictionaryPaths.length > 0) {
    files.push(...personalDictionaryPaths.map((filePath) => `!${filePath}`));
  }

  const filesFromGlobs = await glob(files, { gitignore: true });

  console.log();
  console.log(`Spellchecking ${filesFromGlobs.length} file${filesFromGlobs.length === 1 ? '' : 's'}...`);
  const checkSpelling = (filePath) => spellchecker.checkSpelling(filePath);
  const vfiles = await Promise.all(filesFromGlobs.map(checkSpelling));

  console.log();
  console.log(report(vfiles, { quiet }));

  if (hasMessages(vfiles)) {
    if (generateDictionary && hasMessages(vfiles, (message) => message.source === 'retext-spell')) {
      await writeFile('dictionary.txt', toDictionary(vfiles));
      console.log('Personal dictionary written to dictionary.txt.');
    }

    process.exit(1);
  }
})().catch((error) => {
  printError(error);
  process.exit(1);
});
