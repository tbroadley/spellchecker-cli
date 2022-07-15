import commandLineArgs from 'command-line-args';
import getCommandLineUsage from 'command-line-usage';
import camelCase from 'lodash/camelCase.js';
import mapKeys from 'lodash/mapKeys.js';

import { printError } from '../print-error.js';

import { ExternalConfig } from './types.js';

export const supportedLanguages = [
  'en-AU',
  'en-CA',
  'en-GB',
  'en-US',
  'en-ZA',
  'vi',
];

export const addPlugins = [
  'spell',
  'indefinite-article',
  'repeated-words',
];

export const removePlugins = [
  'syntax-mentions',
  'syntax-urls',
  'frontmatter',
];

export const supportedPlugins = addPlugins.concat(removePlugins);

export const defaultPlugins = [
  'spell',
  'indefinite-article',
  'repeated-words',
  'syntax-mentions',
  'syntax-urls',
];

const optionList = [
  {
    name: 'files',
    alias: 'f',
    typeLabel: '<file|glob> <file|glob>...',
    description: 'A list of files or globs to spellcheck.',
    multiple: true,
    defaultOption: true,
  },
  {
    name: 'language',
    alias: 'l',
    typeLabel: '<language>',
    description: `The language of the files. The default language is en-US. The following languages are supported: ${supportedLanguages.join(', ')}.`,
  },
  {
    name: 'dictionaries',
    alias: 'd',
    typeLabel: '<file> <file>...',
    description: 'Files to combine into a personal dictionary.',
    multiple: true,
  },
  {
    name: 'generate-dictionary',
    type: String,
    typeLabel: '<file>',
    description: 'Write a personal dictionary that contains all found misspellings. Optionally, provide a filepath for the dictionary. The default filepath is dictionary.txt.',
  },
  {
    name: 'no-gitignore',
    type: Boolean,
    description: "Don't respect ignore files (.gitignore, .ignore, etc.).",
  },
  {
    name: 'ignore',
    alias: 'i',
    typeLabel: '<regex> <regex>...',
    description: 'Spelling mistakes that match any of these regexes (after being wrapped with ^ and $) will be ignored.',
    multiple: true,
  },
  {
    name: 'plugins',
    alias: 'p',
    typeLabel: '<name> <name>...',
    description: `A list of retext plugins to use. The default is "${defaultPlugins.join(' ')}". The following plugins are supported: ${supportedPlugins.join(', ')}.`,
    multiple: true,
  },
  {
    name: 'no-suggestions',
    type: Boolean,
    description: 'Do not print suggested replacements for misspelled words. This option will improve Spellchecker\'s runtime when many errors are detected.',
  },
  {
    name: 'quiet',
    alias: 'q',
    type: Boolean,
    description: 'Do not output anything for files that contain no spelling mistakes.',
  },
  {
    name: 'frontmatter-keys',
    typeLabel: '<key> <key>...',
    description: 'A list of frontmatter keys whose values should be spellchecked. By default, no values are spellchecked. Only valid when the `frontmatter` plugin is used.',
    multiple: true,
  },
  {
    name: 'reports',
    typeLabel: '<file> <file>...',
    description: 'A list of report files to generate. The type of report is based on the extension of the file. (Supported: .junit.xml and .json)',
    multiple: true,
  },
  {
    name: 'config',
    typeLabel: '<path>',
    description: 'A path to a config file.',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this help screen.',
  },
];

const usage = getCommandLineUsage([
  {
    header: 'spellchecker',
    content: 'A command-line tool for spellchecking files.',
  },
  {
    header: 'Options',
    optionList,
  },
]);

export const getUsage = (): string => usage;

export const readArgs = (): ExternalConfig => {
  let args;

  try {
    args = commandLineArgs(optionList);
  } catch (error) {
    printError(error.toString());
    console.log(usage);
    process.exit(1);
  }

  return mapKeys(args, (_, key) => camelCase(key)) as ExternalConfig;
};
