import yaml from 'js-yaml';
import toml from 'toml';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import map from 'lodash/map';
import pick from 'lodash/pick';
import toString from 'lodash/toString';
import visit from 'unist-util-visit';

import { printError } from './print-error';

function stringify(toStringify: any): any {
  if (isArray(toStringify)) {
    return map(toStringify, stringify).join('\n');
  }
  if (isObject(toStringify)) {
    return map(toStringify, (value, key) => `${key}\n${stringify(value)}`).join('\n');
  }
  return toString(toStringify);
}

function attacher(options: any) {
  return (tree: any) => {
    visit(tree, 'yaml', (node: any) => {
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
    visit(tree, 'toml', (node: any) => {
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

export const frontmatterFilter = attacher;
