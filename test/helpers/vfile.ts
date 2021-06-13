import { VFile } from 'vfile-reporter';

export const fileWithNoMessages = { source: 'retext-spell', messages: [] };

export const buildVfile = (actuals: string[]): VFile => ({
  messages: actuals.map((actual: string) => ({
    source: 'retext-spell',
    ruleId: 'retext-spell',
    actual,
  })),
});
