#!/usr/bin/env node

import * as fs from 'fs-extra';
import glob from 'globby';
import reporter, { VFileMessage } from 'vfile-reporter';

import { buildPersonalDictionary } from './lib/build-personal-dictionary';
import { parseConfig } from './lib/config';
import { hasMessages } from './lib/has-messages';
import { printError } from './lib/print-error';
import { generateReports } from './lib/report-generator';
import { Spellchecker } from './lib/spellchecker';
import { toDictionary } from './lib/to-dictionary';

(async () => {
  const {
    files,
    language,
    personalDictionaryPaths,
    generateDictionaryPath,
    noGitignore,
    ignoreRegexes,
    suggestions,
    plugins,
    reports,
    quiet,
  } = parseConfig();

  const personalDictionary = await buildPersonalDictionary(personalDictionaryPaths);
  const spellchecker = new Spellchecker({
    language,
    personalDictionary,
    ignoreRegexes,
    suggestions,
    plugins,
  });

  if (personalDictionaryPaths.length > 0) {
    files.push(...personalDictionaryPaths.map((filePath: string) => `!${filePath}`));
  }

  const filesFromGlobs = await glob(files, { gitignore: !noGitignore });

  if (!quiet) {
    console.log(`Spellchecking ${filesFromGlobs.length} file${filesFromGlobs.length === 1 ? '' : 's'}...`);
  }

  const checkSpelling = (filePath: string) => spellchecker.checkSpelling(filePath);
  const vfiles = await Promise.all(filesFromGlobs.map(checkSpelling));

  const results = reporter(vfiles, { quiet });
  if (results.length > 0) {
    if (!quiet) {
      console.log();
    }
    console.log(results);
  }

  if (reports.length > 0) {
    generateReports(reports, vfiles);
  }

  if (hasMessages(vfiles)) {
    if (generateDictionaryPath !== undefined && hasMessages(vfiles, (message: VFileMessage) => message.source === 'retext-spell')) {
      const path = generateDictionaryPath || 'dictionary.txt';
      await fs.writeFile(path, toDictionary(vfiles));
      console.log(`Personal dictionary written to ${path}.`);
    }

    process.exit(1);
  }
})().catch((error) => {
  printError(error);
  process.exit(1);
});
