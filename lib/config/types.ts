export type ExternalConfig = {
  files?: string[]
  language?: string
  plugins?: string[]
  dictionaries?: string[]
  ignore?: string[]
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
    plugins: (string | { frontmatter: string[] })[],
    reports: string[],
    quiet: boolean,
}
