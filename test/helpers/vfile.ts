export const fileWithNoMessages = { source: 'retext-spell', messages: [] };

export const buildVfile = (actuals: any) => ({
  messages: actuals.map((actual: any) => ({
    source: 'retext-spell',
    ruleId: 'retext-spell',
    actual,
  })),
});
