import assign from 'lodash/assign.js';
import difference from 'lodash/difference.js';

import { FrontmatterConfig } from '../frontmatter-filter.js';
import { printError } from '../print-error.js';

import {
  defaultPlugins, getUsage, readArgs, supportedLanguages, supportedPlugins,
} from './command-line.js';
import { readConfigFile } from './file.js';
import { InternalConfig } from './types.js';

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
  const parsedArgs = assign({}, defaultValues, configFile, args);

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
    generateDictionaryPath: generateDictionary,
    noGitignore,
    ignoreRegexes,
    suggestions: !noSuggestions,
    plugins: updatedPlugins,
    reports,
    quiet: !!quiet,
  };
};
