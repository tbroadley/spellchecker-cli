import difference from 'lodash/difference';
import merge from 'lodash/merge';

import {
  defaultPlugins, getUsage, readArgs, supportedPlugins, supportedLanguages,
} from './command-line';
import { readConfigFile } from './file';
import { InternalConfig } from './types';
import { printError } from '../print-error';
import { FrontmatterConfig } from '../frontmatter-filter';

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

  const updatedPlugins: (string | FrontmatterConfig)[] = plugins;
  const frontmatterPluginIndex = plugins.indexOf('frontmatter');
  if (frontmatterPluginIndex === -1 && frontmatterKeys.length > 0) {
    printError('The `--frontmatter-keys` option is invalid unless the `frontmatter` plugin is used.');
    console.log(usage);
    process.exit(1);
  } else if (frontmatterPluginIndex !== -1) {
    updatedPlugins[frontmatterPluginIndex] = { frontmatter: frontmatterKeys };
  }

  const ignoreRegexes = ignoreRegexStrings.map((regexString: string) => new RegExp(`^${regexString}$`));

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
