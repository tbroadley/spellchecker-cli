import dictionaryEn from 'dictionary-en';
import dictionaryEnAu from 'dictionary-en-au';
import dictionaryEnCa from 'dictionary-en-ca';
import dictionaryEnGb from 'dictionary-en-gb';
import dictionaryEnZa from 'dictionary-en-za';
import dictionaryVi from 'dictionary-vi';
import fs from 'fs-extra';
import assign from 'lodash/assign.js';
import every from 'lodash/every.js';
import { remark } from 'remark';
import frontmatter from 'remark-frontmatter';
import remarkRetext from 'remark-retext';
import { rehype } from 'rehype';
import rehypeRetext from 'rehype-retext';
import { retext } from 'retext';
import emoji from 'retext-emoji';
import indefiniteArticle from 'retext-indefinite-article';
import repeatedWords from 'retext-repeated-words';
import spell from 'retext-spell';
import syntaxMentions from 'retext-syntax-mentions';
import syntaxUrls from 'retext-syntax-urls';
import vfile from 'vfile';
import { VFile, VFileMessage } from 'vfile-reporter';

import { FrontmatterConfig, frontmatterFilter } from './frontmatter-filter.js';
import { isMarkdownFile } from './is-markdown-file.js';
import { isHtmlFile } from './is-html-file.js';

function buildSpellchecker({
  dictionary,
  suggestions,
  plugins,
}: {
  dictionary: (callback: dictionaryEn.Callback) => void;
  suggestions: boolean;
  plugins: (string | FrontmatterConfig)[];
}) {
  const spellchecker = retext().use(emoji);

  if (plugins.includes('indefinite-article')) {
    spellchecker.use(indefiniteArticle);
  }

  if (plugins.includes('repeated-words')) {
    spellchecker.use(repeatedWords);
  }

  if (plugins.includes('syntax-mentions')) {
    spellchecker.use(syntaxMentions);
  }

  if (plugins.includes('syntax-urls')) {
    spellchecker.use(syntaxUrls);
  }

  if (plugins.includes('spell')) {
    spellchecker.use(spell, {
      dictionary,
      max: suggestions ? Infinity : -1,
    });
  }

  return spellchecker;
}

function buildMarkdownSpellchecker({
  plugins,
  spellchecker,
}: {
  plugins: (string | FrontmatterConfig)[];
  spellchecker: unknown;
}) {
  const markdownSpellchecker = remark();

  const frontmatterOptions = plugins.filter(
    (plugin: string | FrontmatterConfig) => typeof plugin !== 'string'
  ) as FrontmatterConfig[];
  if (frontmatterOptions.length > 0) {
    markdownSpellchecker
      .use(frontmatter, ['yaml', 'toml'])
      .use(frontmatterFilter, frontmatterOptions[0].frontmatter);
  }

  return markdownSpellchecker.use(remarkRetext, spellchecker);
}

function buildHtmlSpellchecker(spellchecker: unknown) {
  return rehype().use(rehypeRetext, spellchecker as any /* TODO */);
}

function getDictionary(language: string) {
  switch (language) {
    case 'en-AU':
      return dictionaryEnAu;
    case 'en-CA':
      return dictionaryEnCa;
    case 'en-GB':
      return dictionaryEnGb;
    case 'en-US':
      return dictionaryEn;
    case 'en-ZA':
      return dictionaryEnZa;
    case 'vi':
      return dictionaryVi;
    default:
      throw new Error(`Unknown language ${language}`);
  }
}

export class Spellchecker {
  private spellchecker: { process(file: VFile): Promise<VFile> };

  private markdownSpellchecker: { process(file: VFile): Promise<VFile> };
  private htmlSpellchecker: { process(file: VFile): Promise<VFile> };

  private ignoreRegexes: RegExp[];

  private personalDictionary: RegExp[];

  constructor({
    language,
    personalDictionary,
    ignoreRegexes,
    suggestions,
    plugins,
  }: {
    language: string;
    personalDictionary: RegExp[];
    ignoreRegexes: RegExp[];
    suggestions: boolean;
    plugins: (string | FrontmatterConfig)[];
  }) {
    const dictionary = getDictionary(language);
    this.spellchecker = buildSpellchecker({ dictionary, suggestions, plugins });
    this.markdownSpellchecker = buildMarkdownSpellchecker({
      plugins,
      spellchecker: this.spellchecker,
    });
    this.htmlSpellchecker = buildHtmlSpellchecker(this.spellchecker);
    this.ignoreRegexes = ignoreRegexes;
    this.personalDictionary = personalDictionary;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async checkSpelling(filePath: string) {
    const spellcheckerForFileType = isMarkdownFile(filePath)
      ? this.markdownSpellchecker
      : isHtmlFile(filePath)
      ? this.htmlSpellchecker
      : this.spellchecker;

    const excludeBlockRe =
      /(<!--\s*spellchecker-disable\s*-->([\S\s]*?)<!--\s*spellchecker-enable\s*-->)/gi;

    const contents = (await fs.readFile(filePath)).toString();
    const contentsWithoutExcludes = contents.replace(excludeBlockRe, '');
    const contentsWithoutVariationSelectors = contentsWithoutExcludes.replace(
      /[\uFE0E\uFE0F]/g,
      ''
    );

    const file = vfile({
      contents: contentsWithoutVariationSelectors,
      path: filePath,
    });
    const result = await spellcheckerForFileType.process(file);
    return assign({}, result, {
      messages: result.messages.filter(({ actual }: VFileMessage) => {
        const doesNotMatch = (regex: RegExp) => !regex.test(actual);
        return (
          every(this.ignoreRegexes, doesNotMatch) &&
          every(this.personalDictionary, doesNotMatch)
        );
      }),
    });
  }
}
