import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';

export const toDictionary = (vfiles: any) => {
  const misspellings = flatMap(vfiles, (file) => {
    const retextSpellMessages = file.messages.filter((message: any) => {
      const { source, ruleId } = message;
      return source === 'retext-spell' && ruleId !== 'overflow';
    });
    return retextSpellMessages.map((m: any) => m.actual);
  });
  return uniq(misspellings).sort().map(s => `${s}\n`).join('');
};
