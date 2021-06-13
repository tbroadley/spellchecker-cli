import fs from 'fs-extra';
import every from 'lodash/every';
import assign from 'lodash/assign';
import remark from 'remark';
import frontmatter from 'remark-frontmatter';
import gemoji from 'remark-gemoji-to-emoji';
import remarkRetext from 'remark-retext';
import retext from 'retext';
import indefiniteArticle from 'retext-indefinite-article';
import repeatedWords from 'retext-repeated-words';
import spell from 'retext-spell';
import syntaxMentions from 'retext-syntax-mentions';
import syntaxUrls from 'retext-syntax-urls';
import vfile from 'vfile';

import { isMarkdownFile } from './is-markdown-file';
import { frontmatterFilter } from './frontmatter-filter';

function buildSpellchecker({
  dictionary,
  suggestions,
  plugins,
}: any) {
  const spellchecker = retext();

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
}: any) {
  const markdownSpellchecker = remark().use(gemoji);

  const frontmatterOptions = plugins.filter(({ frontmatter: fm }: any) => fm);
  if (frontmatterOptions.length > 0) {
    markdownSpellchecker
      .use(frontmatter, ['yaml', 'toml'])
      .use(frontmatterFilter, frontmatterOptions[0].frontmatter);
  }

  return markdownSpellchecker.use(remarkRetext, spellchecker);
}

export class Spellchecker {
  private spellchecker: any;
  private markdownSpellchecker: any;
  private ignoreRegexes: any;
  private personalDictionary: any;

  constructor({
    language,
    personalDictionary,
    ignoreRegexes,
    suggestions,
    plugins,
  }: any) {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const dictionary = require(`dictionary-${language.toLowerCase()}`);
    this.spellchecker = buildSpellchecker({ dictionary, suggestions, plugins });
    this.markdownSpellchecker = buildMarkdownSpellchecker({
      plugins,
      spellchecker: this.spellchecker,
    });
    this.ignoreRegexes = ignoreRegexes;
    this.personalDictionary = personalDictionary;
  }

  async checkSpelling(filePath: any) {
    const spellcheckerForFileType = isMarkdownFile(filePath)
      ? this.markdownSpellchecker
      : this.spellchecker;

    const excludeBlockRe = /(<!--\s*spellchecker-disable\s*-->([\S\s]*?)<!--\s*spellchecker-enable\s*-->)/ig;

    const contents = (await fs.readFile(filePath)).toString();
    const contentsWithoutExcludes = contents.replace(excludeBlockRe, '');
    const contentsWithoutVariationSelectors = contentsWithoutExcludes.replace(/[\uFE0E\uFE0F]/g, '');

    const file = vfile({
      contents: contentsWithoutVariationSelectors,
      path: filePath,
    });
    const result = await spellcheckerForFileType.process(file);
    return assign({}, result, {
      messages: result.messages.filter(({ actual }: any) => {
        const doesNotMatch = (regex: any) => !regex.test(actual);
        return every(this.ignoreRegexes, doesNotMatch)
          && every(this.personalDictionary, doesNotMatch);
      }),
    });
  }
}
