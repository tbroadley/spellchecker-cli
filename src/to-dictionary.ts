import { flatMap, uniq } from 'lodash';

export const toDictionary = (vfiles) => {
  const misspellings = flatMap(vfiles, (file) => {
    const retextSpellMessages = file.messages.filter((message) => {
      const { source, ruleId } = message;
      return source === 'retext-spell' && ruleId !== 'overflow';
    });
    return retextSpellMessages.map((m) => m.actual);
  });
  return uniq(misspellings).sort().map((s) => `${s}\n`).join('');
};
