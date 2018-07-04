import { readFile } from 'fs-extra';
import { assign, every } from 'lodash';
import * as remark from 'remark';
import * as gemoji from 'remark-gemoji-to-emoji';
import * as remarkRetext from 'remark-retext';
import * as retext from 'retext';
import * as indefiniteArticle from 'retext-indefinite-article';
import * as repeatedWords from 'retext-repeated-words';
import * as spell from 'retext-spell';
import * as syntaxMentions from 'retext-syntax-mentions';
import * as syntaxUrls from 'retext-syntax-urls';
import * as vfile from 'vfile';

import { isMarkdownFile } from './is-markdown-file';

function buildSpellchecker({
  dictionary,
  suggestions,
  plugins,
}) {
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

export class Spellchecker {
  private spellchecker: any;
  private markdownSpellchecker: any;
  private ignoreRegexes: RegExp[];
  private personalDictionary: string[];

  constructor({
    language,
    personalDictionary,
    ignoreRegexes,
    suggestions,
    plugins,
  }) {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const dictionary = require(`dictionary-${language.toLowerCase()}`);
    this.spellchecker = buildSpellchecker({ dictionary, suggestions, plugins });
    this.markdownSpellchecker = remark().use(gemoji).use(remarkRetext, this.spellchecker);
    this.ignoreRegexes = ignoreRegexes;
    this.personalDictionary = personalDictionary;
  }

  public async checkSpelling(filePath) {
    const spellcheckerForFileType = isMarkdownFile(filePath)
      ? this.markdownSpellchecker
      : this.spellchecker;

    const contents = await readFile(filePath);
    const file = vfile({
      contents,
      path: filePath,
    });
    const result = await spellcheckerForFileType.process(file);
    return assign({}, result, {
      messages: result.messages.filter(({ actual }) => {
        const doesNotMatch = (regex) => !regex.test(actual);
        return every(this.ignoreRegexes, doesNotMatch)
            && every(this.personalDictionary, doesNotMatch);
      }),
    });
  }
}
