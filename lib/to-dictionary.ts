import flatMap from 'lodash/flatMap.js';
import uniq from 'lodash/uniq.js';
import { VFile, VFileMessage } from 'vfile-reporter';

export const toDictionary = (vfiles: VFile[]): string => {
  const misspellings = flatMap(vfiles, file => {
    const retextSpellMessages = file.messages.filter(
      (message: VFileMessage) => {
        const { source, ruleId } = message;
        return source === 'retext-spell' && ruleId !== 'overflow';
      }
    );
    return retextSpellMessages.map((m: VFileMessage) => m.actual);
  });
  return uniq(misspellings)
    .sort()
    .map(s => `${s}\n`)
    .join('');
};
