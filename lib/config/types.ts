import { FrontmatterConfig } from '../frontmatter-filter';

export type ExternalConfig = {
  files?: string[]
  language?: string
  plugins?: string[]
  dictionaries?: string[]
  ignore?: string[]
  quiet?: boolean
  reports?: string[]
  help?: boolean
  generateDictionary?: string
  noGitignore?: boolean
  noSuggestions?: boolean
  frontmatterKeys?: string[]
  config?: string;
}

export type InternalConfig = {
  files: string[],
    language: string,
    personalDictionaryPaths: string[],
    generateDictionaryPath: string | undefined,
    noGitignore: boolean,
    ignoreRegexes: RegExp[],
    suggestions: boolean
    plugins: (string | FrontmatterConfig)[],
    reports: string[],
    quiet: boolean,
}
