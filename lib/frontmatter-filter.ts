import yaml from 'js-yaml';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import map from 'lodash/map';
import pick from 'lodash/pick';
import toString from 'lodash/toString';
import toml from 'toml';
import visit from 'unist-util-visit';

import { printError } from './print-error';

export type FrontmatterConfig = { frontmatter: string[] }

function stringify(toStringify: unknown): string {
  if (isArray(toStringify)) {
    return map(toStringify, stringify).join('\n');
  }
  if (isObject(toStringify)) {
    return map(toStringify, (value, key) => `${key}\n${stringify(value)}`).join('\n');
  }
  return toString(toStringify);
}

export function frontmatterFilter(options: string[]): (tree: unknown) => void {
  return (tree: unknown) => {
    visit(tree, 'yaml', (node: { value: string, type: string }) => {
      let parsedFrontmatter;

      try {
        parsedFrontmatter = yaml.load(node.value);
      } catch (e) {
        printError(`Failed to parse YAML frontmatter, ignoring it. Error: ${e}`);
        parsedFrontmatter = {};
      }

      const filteredFrontmatter = pick(parsedFrontmatter, options || []);

      /* eslint-disable no-param-reassign */
      node.value = stringify(filteredFrontmatter);
      node.type = 'text';
      /* eslint-enable no-param-reassign */
    });

    visit(tree, 'toml', (node: { value: string, type: string }) => {
      let parsedFrontmatter;

      try {
        parsedFrontmatter = toml.parse(node.value);
      } catch (e) {
        printError(`Failed to parse TOML frontmatter, ignoring it. Error: ${e}`);
        parsedFrontmatter = {};
      }

      const filteredFrontmatter = pick(parsedFrontmatter, options || []);

      /* eslint-disable no-param-reassign */
      node.value = stringify(filteredFrontmatter);
      node.type = 'text';
      /* eslint-enable no-param-reassign */
    });
  };
}
