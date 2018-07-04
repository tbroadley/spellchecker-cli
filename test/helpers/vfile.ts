export const fileWithNoMessages = { source: 'retext-spell', messages: [] };

export function buildVfile(actuals) {
  return ({
    messages: actuals.map((actual) => ({
      actual,
      ruleId: 'retext-spell',
      source: 'retext-spell',
    })),
  });
}
