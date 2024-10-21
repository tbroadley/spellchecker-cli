/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ExecException, exec } from 'child_process';
import { readFileSync, rmSync, writeFileSync } from 'fs';

import chai from 'chai';
import glob from 'globby';
import merge from 'lodash/merge.js';
import parallel from 'mocha.parallel';

import {
  addPlugins,
  defaultPlugins,
  removePlugins,
  supportedLanguages,
  supportedPlugins,
} from '../lib/config/command-line.js';

chai.should();

type CommandResult = {
  stdout: string;
  stderr: string;
} & Partial<ExecException>;

function runCommand(command: string): Promise<CommandResult> {
  return new Promise(resolve => {
    exec(command, {}, (error, stdout, stderr) => {
      if (error) {
        resolve(merge({}, error, { stdout, stderr }));
      }
      resolve({ stdout, stderr });
    });
  });
}

function runWithArguments(args: string) {
  return runCommand(`node build/index.js ${args}`);
}

const notSpell = (plugin: string) => plugin !== 'spell';

const nonSpellPlugins = supportedPlugins.filter(notSpell);
const nonSpellAddPlugins = addPlugins.filter(notSpell);
const nonSpellRemovePlugins = removePlugins.filter(notSpell);

const toSpaceAndHyphenSplitRegex = (word: string) =>
  word.replace(/ /g, '\\s*').replace(/-/g, '-\\s*');

parallel(
  'Spellchecker CLI',
  function testSpellcheckerCLI(this: {
    timeout(n: number): void;
    slow(n: number): void;
  }) {
    this.timeout(5 * 60 * 1000);
    this.slow(5 * 60 * 1000);

    it('prints the command-line usage when the argument `-h` is passed', async () => {
      const result = await runWithArguments('-h');
      result.should.not.have.property('code');
      result.stdout.should.include(
        'A command-line tool for spellchecking files.'
      );
    });

    it('prints the command-line usage when the argument `--help` is passed', async () => {
      const result = await runWithArguments('--help');
      result.should.not.have.property('code');
      result.stdout.should.include(
        'A command-line tool for spellchecking files.'
      );
    });

    it('prints the default language in the command-line usage', async () => {
      const { stdout } = await runWithArguments('--help');
      const defaultLanguageRegex = new RegExp(
        toSpaceAndHyphenSplitRegex('The default language is en-US.')
      );
      stdout.should.match(defaultLanguageRegex);
    });

    it('lists all supported languages in the command-line usage', async () => {
      const { stdout } = await runWithArguments('-h');
      const languageRegex = new RegExp(
        supportedLanguages.map(toSpaceAndHyphenSplitRegex).join(',\\s*')
      );
      stdout.should.match(languageRegex);
    });

    it('prints the default plugin list in the command-line usage', async () => {
      const { stdout } = await runWithArguments('--help');
      const defaultPluginsRegex = new RegExp(
        toSpaceAndHyphenSplitRegex(
          `The default is "${defaultPlugins.join(' ')}".`
        )
      );
      stdout.should.match(defaultPluginsRegex);
    });

    it('lists all supported plugins in the command-line usage', async () => {
      const { stdout } = await runWithArguments('-h');
      const pluginRegex = new RegExp(
        supportedPlugins.map(toSpaceAndHyphenSplitRegex).join(',\\s*')
      );
      stdout.should.match(pluginRegex);
    });

    it('exits with an error when an empty config file is specified', async () => {
      const { code, stderr } = await runWithArguments(
        '--config test/fixtures/config/empty.yml'
      );
      code!.should.equal(1);
      stderr.should.include('A list of files is required.');
    });

    it('exits with an error when an empty list of files is provided', async () => {
      const { code, stderr } = await runWithArguments('--files');
      code!.should.equal(1);
      stderr.should.include('A list of files is required.');
    });

    it('exits with an error when passed an unknown argument', async () => {
      const { code, stderr } = await runWithArguments('--test');
      code!.should.equal(1);
      stderr.should.include('UNKNOWN_OPTION: Unknown option: --test');
    });

    it('exits with an error when passed an unknown language', async () => {
      const { code, stderr } = await runWithArguments(
        '--files a b c --language test'
      );
      code!.should.equal(1);
      stderr.should.include('The language "test" is not supported.');
    });

    it('exits with an error when run on a file with a spelling mistake', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/incorrect.txt'
      );
      code!.should.equal(1);
      stdout.should.include('`Thisisnotaword` is misspelt');
    });

    it('exits with no error when run on a file with no spelling mistakes', async () => {
      const result = await runWithArguments(
        '--files test/fixtures/correct.txt'
      );
      result.should.not.have.property('code');
    });

    it('exits with an error when run with a dictionary that does not contain the words in the given file', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/en-CA.txt'
      );
      code!.should.equal(1);
      ['Colour', 'honour', 'behaviour'].forEach(word => {
        stdout.should.include(`\`${word}\` is misspelt`);
      });
    });

    it('exits with no error when run with a dictionary that contains the words in the given file', async () => {
      const result = await runWithArguments(
        '-f test/fixtures/en-CA.txt -l en-CA'
      );
      result.should.not.have.property('code');
    });

    it('handles Markdown syntax', async () => {
      const { code, stdout } = await runWithArguments(
        '--files test/fixtures/markdown.md'
      );
      code!.should.equal(1);
      ['Spellig', 'paragrap', 'containin', 'mistaks', 'Bullts', 'Moar'].forEach(
        word => {
          stdout.should.include(`\`${word}\` is misspelt`);
        }
      );
    });

    it('handles MDX syntax', async () => {
      const { code, stdout } = await runWithArguments(
        '--files test/fixtures/markdown.mdx'
      );
      code!.should.equal(1);
      ['Spellig', 'paragrap', 'containin', 'mistaks', 'Bullts', 'Moar'].forEach(
        word => {
          stdout.should.include(`\`${word}\` is misspelt`);
        }
      );
    });

    it('handles HTML', async () => {
      const { code, stdout } = await runWithArguments(
        '--files test/fixtures/html.html'
      );
      code!.should.equal(1);
      ['Spellig', 'mistaks', 'contans'].forEach(word => {
        stdout.should.include(`\`${word}\` is misspelt`);
      });
    });

    it('ignores spelling mistakes in code blocks', async () => {
      const result = await runWithArguments('-f test/fixtures/code-blocks.md');
      result.should.not.have.property('code');
    });

    it('ignores Gemoji', async () => {
      const result = await runWithArguments('-f test/fixtures/gemoji.md');
      result.should.not.have.property('code');
    });

    it('ignores HTML tables', async () => {
      const result = await runWithArguments('--files test/fixtures/table.md');
      result.should.not.have.property('code');
    });

    it('ignores words in the provided dictionary file', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect.txt --dictionaries test/fixtures/dictionaries/one.txt'
      );
      result.should.not.have.property('code');
    });

    it('does not spellcheck the provided dictionary file', async () => {
      const { stdout } = await runWithArguments(
        '-f test/fixtures/*.txt -d test/fixtures/dictionaries/one.txt'
      );
      stdout.should.not.contain('test/fixtures/dictionaries/one.txt');
    });

    it('spellchecks all files in a glob', async () => {
      // `--no-suggestions` to reduce chance of timeout, but also increase timeout for this one test
      this.timeout(7500);
      const { stdout } = await runWithArguments(
        'test/fixtures/* --no-suggestions'
      );
      const fileNames = await glob('*', { cwd: 'test/fixtures' });
      fileNames.forEach(fileName => {
        stdout.should.contain(`test/fixtures/${fileName}`);
      });
    });

    it('runs in quiet mode when the argument `-q` is passed', async () => {
      const { stdout } = await runWithArguments(
        '--files test/fixtures/correct.txt -q'
      );
      stdout.should.equal('');
    });

    it('runs in quiet mode when the argument `--quiet` is passed', async () => {
      const { stdout } = await runWithArguments(
        '--files test/fixtures/correct.txt --quiet'
      );
      stdout.should.equal('');
    });

    it('prints errors in quiet mode', async () => {
      const { code, stdout } = await runWithArguments(
        '--files test/fixtures/incorrect.txt --quiet'
      );
      code!.should.equal(1);
      stdout.should.include('`Thisisnotaword` is misspelt');
    });

    it('prints the number of files to be spellchecked when passed one file', async () => {
      const { stdout } = await runWithArguments(
        '--files test/fixtures/correct.txt'
      );
      stdout.should.include('Spellchecking 1 file...');
    });

    it('prints the number of files to be spellchecked when passed a glob', async () => {
      const globExpression = 'test/fixtures/*.md';
      const { stdout } = await runWithArguments(`--files ${globExpression}`);
      const fileCount = (await glob(globExpression)).length;
      stdout.should.include(
        `Spellchecking ${fileCount} file${fileCount === 1 ? '' : 's'}...`
      );
    });

    it('exits with no error when passed an empty list of plugins', async () => {
      const result = await runWithArguments('--files a b c --plugins');
      result.should.not.have.property('code');
      result.stdout.should.equal('Spellchecking 0 files...\n');
    });

    it('exits with an error when passed unknown plugins', async () => {
      const { code, stderr } = await runWithArguments(
        '--files a b c --plugins d e f'
      );
      code!.should.equal(1);
      stderr.should.include(
        'The following retext plugins are not supported: d, e, f.'
      );
    });

    it('applies all default plugins by default', async () => {
      const { code, stdout } = await runWithArguments(
        `--files test/fixtures/{{${nonSpellPlugins.join(
          ','
        )}}.md,incorrect.txt}`
      );

      code!.should.equal(1);

      stdout.should.include('retext-spell');
      stdout.should.not.include('test/fixtures/incorrect.txt: no issues found');

      nonSpellAddPlugins.forEach(plugin => {
        stdout.should.include(`retext-${plugin}`);
      });

      nonSpellRemovePlugins.forEach(plugin => {
        stdout.should.include(`test/fixtures/${plugin}.md: no issues found`);
      });
    });

    it('applies all the specified plugins', async () => {
      const { code, stdout } = await runWithArguments(
        `--files test/fixtures/{${nonSpellPlugins.join(
          ','
        )}}.md --plugins ${nonSpellPlugins.join(' ')}`
      );
      code!.should.equal(1);
      nonSpellAddPlugins.forEach(plugin => {
        stdout.should.include(`retext-${plugin}`);
      });
      nonSpellRemovePlugins.forEach(plugin => {
        stdout.should.include(`test/fixtures/${plugin}.md: no issues found`);
      });
    });

    it("doesn't apply plugins that aren't specified on the command line", async () => {
      const result = await runWithArguments(
        '--files test/fixtures/repeated-words.md --plugins spell'
      );
      result.should.not.have.property('code');
    });

    it("doesn't apply plugins that aren't specified in a config file", async () => {
      const result = await runWithArguments(
        '--files test/fixtures/repeated-words.md --config test/fixtures/config/spell-only.yml'
      );
      result.should.not.have.property('code');
    });

    it('applies retext-indefinite-article when it is specified', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/indefinite-article.md -p indefinite-article'
      );
      code!.should.equal(1);
      stdout.should.include('Use `an` before `8-year`, not `a`');
      stdout.should.include('Use `an` before `hour`, not `a`');
      stdout.should.include('Use `a` before `European`, not `an`');
    });

    it('applies retext-repeated-words when it is specified', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/repeated-words.md -p repeated-words'
      );
      code!.should.equal(1);
      stdout.should.include('Expected `it` once, not twice');
      stdout.should.include('Expected `to` once, not twice');
      stdout.should.include('Expected `the` once, not twice');
    });

    it('applies retext-syntax-mentions when it is specified', async () => {
      const result = await runWithArguments(
        'test/fixtures/syntax-mentions.md -p syntax-mentions'
      );
      result.should.not.have.property('code');
    });

    it('applies retext-syntax-urls when it is specified', async () => {
      const result = await runWithArguments(
        'test/fixtures/syntax-urls.md -p syntax-urls'
      );
      result.should.not.have.property('code');
    });

    it('ignores the frontmatter if no keys are given', async () => {
      const result = await runWithArguments(
        'test/fixtures/frontmatter-incorrect.md -p spell frontmatter'
      );
      result.should.not.have.property('code');
    });

    it('ignores the frontmatter if no keys are given (toml)', async () => {
      const result = await runWithArguments(
        'test/fixtures/frontmatter-incorrect-toml.md -p spell frontmatter'
      );
      result.should.not.have.property('code');
    });

    it('checks only the given keys in the frontmatter (1)', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/frontmatter-incorrect.md -p spell frontmatter --frontmatter-keys contributors'
      );
      code!.should.equal(1);
      stdout.should.include('`tbroadley` is misspelt');
      stdout.should.not.include('`documnet` is misspelt');
    });

    it('checks only the given keys in the frontmatter (2)', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/frontmatter-incorrect.md -p spell frontmatter --frontmatter-keys title'
      );
      code!.should.equal(1);
      stdout.should.include('`documnet` is misspelt');
      stdout.should.not.include('`tbroadley` is misspelt');
    });

    it('checks only the given keys in the frontmatter (3)', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/frontmatter-incorrect.md -p spell frontmatter --frontmatter-keys title contributors'
      );
      code!.should.equal(1);
      stdout.should.include('`documnet` is misspelt');
      stdout.should.include('`tbroadley` is misspelt');
    });

    it('checks only the given keys in the frontmatter (toml) (1)', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/frontmatter-incorrect-toml.md -p spell frontmatter --frontmatter-keys contributors'
      );
      code!.should.equal(1);
      stdout.should.include('`tbroadley` is misspelt');
      stdout.should.not.include('`documnet` is misspelt');
    });

    it('checks only the given keys in the frontmatter (toml) (2)', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/frontmatter-incorrect-toml.md -p spell frontmatter --frontmatter-keys title'
      );
      code!.should.equal(1);
      stdout.should.include('`documnet` is misspelt');
      stdout.should.not.include('`tbroadley` is misspelt');
    });

    it('checks only the given keys in the frontmatter (toml) (3)', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/frontmatter-incorrect-toml.md -p spell frontmatter --frontmatter-keys title contributors'
      );
      code!.should.equal(1);
      stdout.should.include('`documnet` is misspelt');
      stdout.should.include('`tbroadley` is misspelt');
    });

    it('does not generate a personal dictionary if no spelling mistakes are found', async () => {
      const { stdout } = await runWithArguments(
        'test/fixtures/repeated-words.md --plugins spell repeated-words --generate-dictionary'
      );
      stdout.should.not.include(
        'Personal dictionary written to dictionary.txt.'
      );
    });

    it('does not generate a personal dictionary if the argument is not passed', async () => {
      const { stdout } = await runWithArguments(
        'test/fixtures/incorrect.txt --plugins spell'
      );
      stdout.should.not.include(
        'Personal dictionary written to dictionary.txt.'
      );
    });

    it('supports multiple dictionaries', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect-2.txt --dictionaries test/fixtures/dictionaries/one.txt test/fixtures/dictionaries/two.txt'
      );
      result.should.not.have.property('code');
    });

    it('supports CommonJS programmatic dictionaries', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect.txt --dictionaries test/fixtures/dictionaries/programmatic.cjs'
      );
      result.should.not.have.property('code');
    });

    it('supports ES module programmatic dictionaries', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect.txt --dictionaries test/fixtures/dictionaries/programmatic.js'
      );
      result.should.not.have.property('code');
    });

    it('loads programmatic dictionaries relative to the current working directory', async () => {
      const result = await runCommand(
        'cd test && node ../build/index.js fixtures/incorrect.txt --dictionaries fixtures/dictionaries/programmatic.cjs'
      );
      result.should.not.have.property('code');
    });

    it('supports specifying both non-programmatic and programmatic dictionaries', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect-2.txt --dictionaries test/fixtures/dictionaries/programmatic.cjs test/fixtures/dictionaries/two.txt'
      );
      result.should.not.have.property('code');
    });

    it('treats dictionary entries as regexes', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect.txt --dictionaries test/fixtures/dictionaries/regex.txt'
      );
      result.should.not.have.property('code');
    });

    it('treats dictionary entries as if they were wrapped in ^ and $', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/incorrect.txt --dictionaries test/fixtures/dictionaries/regex-no-match.txt'
      );
      code!.should.equal(1);
      stdout.should.include('`Thisisnotaword` is misspelt');
      stdout.should.include('`preprocessed` is misspelt');
    });

    it('supports programmatic dictionaries that pass mixed regexes and strings', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect.txt --dictionaries test/fixtures/dictionaries/regex.cjs'
      );
      result.should.not.have.property('code');
    });

    it('supports programmatic dictionaries that contain case-insensitive regexes', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect-case-insensitive.txt --dictionaries test/fixtures/dictionaries/regex.cjs'
      );
      result.should.not.have.property('code');
    });

    it('ignores spelling mistakes that match the given regexes', async () => {
      const result = await runWithArguments(
        'test/fixtures/incorrect.txt --ignore "Thisisnot.*" "(pre)?processed"'
      );
      result.should.not.have.property('code');
    });

    it('does not ignore spelling mistakes that do not match any of the given regexes', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/incorrect.txt --ignore "Thisisnot" "processed"'
      );
      code!.should.equal(1);
      stdout.should.include('`Thisisnotaword` is misspelt');
      stdout.should.include('`preprocessed` is misspelt');
    });

    it('does not limit number of reported misspelling errors', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/gibberish-50-lines.txt'
      );
      code!.should.equal(1);
      stdout.should.include('50 warnings');
      stdout.should.not.include('Too many misspellings');
    });

    it('does not show overflow error for ignored patterns', async () => {
      const result = await runWithArguments(
        'test/fixtures/gibberish-50-lines.txt --ignore "nm[0-9]+a"'
      );
      result.should.not.have.property('code');
      result.stdout.should.not.include('Too many misspellings');
      result.stdout.should.include('no issues found');
    });

    it('enables suggestions by default', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/incorrect.txt'
      );
      code!.should.equal(1);
      stdout.should.include(
        '`preprocessed` is misspelt; did you mean `reprocessed`?'
      );
    });

    it('allows suggestions to be disabled', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/incorrect.txt --no-suggestions'
      );
      code!.should.equal(1);
      stdout.should.include('`preprocessed` is misspelt');
      stdout.should.not.include(
        '`preprocessed` is misspelt; did you mean `reprocessed`?'
      );
    });

    it('does not flag Unicode emoji variation selectors as spelling errors', async () => {
      const result = await runWithArguments('test/fixtures/emoji.txt');
      result.should.not.have.property('code');
    });

    it('ignores spelling mistakes inside exclude comment blocks', async () => {
      const result = await runWithArguments('test/fixtures/exclude-blocks.md');
      result.should.not.have.property('code');
    });

    it('catch spelling mistakes inside incomplete exclude comment blocks', async () => {
      const { code, stdout } = await runWithArguments(
        'test/fixtures/exclude-blocks-incorrect.md'
      );
      code!.should.equal(1);
      stdout.should.include('`iinside` is misspelt');
    });

    it('ignores spelling mistakes inside single-line exclude comments', async () => {
      const result = await runWithArguments(
        'test/fixtures/exclude-blocks-singleline.md'
      );
      result.should.not.have.property('code');
    });

    it('ignores spelling mistakes inside exclude comment blocks with special formatting', async () => {
      const result = await runWithArguments(
        'test/fixtures/exclude-blocks-formatting.md'
      );
      result.should.not.have.property('code');
    });

    it('can read options from a YAML config file', async () => {
      const result = await runWithArguments(
        '--config test/fixtures/config/basic.yml'
      );
      result.should.not.have.property('code');
    });

    it('can read options from a JSON config file', async () => {
      const result = await runWithArguments(
        '--config test/fixtures/config/basic.json'
      );
      result.should.not.have.property('code');
    });

    it('can read options from a JSONC config file', async () => {
      const result = await runWithArguments(
        '--config test/fixtures/config/basic.jsonc'
      );
      result.should.not.have.property('code');
    });
  }
);

describe('Spellchecker CLI (not parallel)', () => {
  it('exits with an error when no arguments are provided', async () => {
    // Remove .spellcheckerrc.yml so that Spellchecker CLI doesn't use it in this test.
    const config = readFileSync('.spellcheckerrc.yml', { encoding: 'utf8' });
    rmSync('.spellcheckerrc.yml');

    try {
      const { code, stderr } = await runWithArguments('');
      code!.should.equal(1);
      stderr.should.include('A list of files is required.');
    } finally {
      writeFileSync('.spellcheckerrc.yml', config);
    }
  });

  it('generates a personal dictionary if spelling mistakes are found and argument is passed', async () => {
    const dictionary = readFileSync('dictionary.txt', { encoding: 'utf8' });

    try {
      const { stdout } = await runWithArguments(
        'test/fixtures/incorrect.txt --plugins spell --generate-dictionary'
      );
      stdout.should.include('Personal dictionary written to dictionary.txt.');
      readFileSync('dictionary.txt', 'utf8').should.equal(
        'Thisisnotaword\npreprocessed\n'
      );
    } finally {
      writeFileSync('dictionary.txt', dictionary);
    }
  });

  it('writes personal dictionary to given path', async () => {
    try {
      const { stdout } = await runWithArguments(
        'test/fixtures/incorrect.txt --plugins spell --generate-dictionary test/dictionary.txt'
      );
      stdout.should.include(
        'Personal dictionary written to test/dictionary.txt.'
      );
      readFileSync('test/dictionary.txt', 'utf8').should.equal(
        'Thisisnotaword\npreprocessed\n'
      );
    } finally {
      rmSync('test/dictionary.txt');
    }
  });

  it('exits with an error when run on a file that is included in the .gitignore and the --no-gitignore flag is passed', async () => {
    try {
      const createFileResult = await runCommand(
        'echo "This file contians a misspelled word." > test/fixtures/gitignored-file.txt'
      );
      createFileResult.should.not.have.property('code');

      const { code, stdout } = await runWithArguments(
        '--no-gitignore --files test/fixtures/gitignored-file.txt'
      );
      code!.should.equal(1);
      stdout.should.include('`contians` is misspelt');
    } finally {
      rmSync('test/fixtures/gitignored-file.txt');
    }
  });

  it('exits with no error when run on a file that is included in the .gitignore', async () => {
    try {
      const createFileResult = await runCommand(
        'echo "This file contians a misspelled word." > test/fixtures/gitignored-file.txt'
      );
      createFileResult.should.not.have.property('code');

      const result = await runWithArguments(
        '--files test/fixtures/gitignored-file.txt'
      );
      result.should.not.have.property('code');
    } finally {
      rmSync('test/fixtures/gitignored-file.txt');
    }
  });
});
