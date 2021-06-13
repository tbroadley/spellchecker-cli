import difference from 'lodash/difference';
import merge from 'lodash/merge';

import { readConfigFile } from './config-file';
import { printError } from './print-error';
import {
  defaultPlugins, getUsage, readArgs, supportedPlugins, supportedLanguages,
} from './command-line';

export type ExternalConfig = {
  files?: string[]
  language?: string
  plugins?: string[]
  dictionaries?: string[]
  quiet?: boolean
  reports?: string[]
  help?: boolean
  generateDictionary?: boolean
  noGitignore?: boolean
  noSuggestions?: boolean
  frontmatterKeys?: string[]
  config?: string;
}

export type InternalConfig = {
  files: string[],
    language: string,
    personalDictionaryPaths: string[],
    generateDictionary: boolean,
    noGitignore: boolean,
    ignoreRegexes: RegExp[],
    suggestions: boolean
    plugins: (string | { [key: string]: any })[],
    reports: string[],
    quiet: boolean,
}

const defaultValues = {
  language: 'en-US',
  dictionaries: [],
  noGitignore: false,
  ignore: [],
  plugins: defaultPlugins,
  frontmatterKeys: [],
  reports: [],
};

export const parseConfig = (): InternalConfig => {
  const args = readArgs();
  const configFile = readConfigFile(args.config);
  const parsedArgs = merge({}, defaultValues, configFile, args);

  const {
    files,
    language,
    plugins,
    dictionaries: personalDictionaryPaths,
    ignore: ignoreRegexStrings,
    quiet,
    reports,
    help,
    generateDictionary,
    noGitignore,
    noSuggestions,
    frontmatterKeys,
  } = parsedArgs;

  const usage = getUsage();

  if (help) {
    console.log(usage);
    process.exit(0);
  }

  if (!files || files.length === 0) {
    printError('A list of files is required.');
    console.log(usage);
    process.exit(1);
  }

  if (!supportedLanguages.includes(language)) {
    printError(`The language "${language}" is not supported.`);
    console.log(usage);
    process.exit(1);
  }

  const unsupportedPlugins = difference(plugins, supportedPlugins);
  if (unsupportedPlugins.length > 0) {
    printError(`The following retext plugins are not supported: ${unsupportedPlugins.join(', ')}.`);
    console.log(usage);
    process.exit(1);
  }

  const updatedPlugins: (string | { [key: string]: any })[] = plugins;
  const frontmatterPluginIndex = plugins.indexOf('frontmatter');
  if (frontmatterPluginIndex === -1 && frontmatterKeys.length > 0) {
    printError('The `--frontmatter-keys` option is invalid unless the `frontmatter` plugin is used.');
    console.log(usage);
    process.exit(1);
  } else if (frontmatterPluginIndex !== -1) {
    updatedPlugins[frontmatterPluginIndex] = { frontmatter: frontmatterKeys };
  }

  const ignoreRegexes = ignoreRegexStrings.map((regexString: any) => new RegExp(`^${regexString}$`));

  return {
    files,
    language,
    personalDictionaryPaths,
    generateDictionary: !!generateDictionary,
    noGitignore,
    ignoreRegexes,
    suggestions: !noSuggestions,
    plugins: updatedPlugins,
    reports,
    quiet: !!quiet,
  };
};
