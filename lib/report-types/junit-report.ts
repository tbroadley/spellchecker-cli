import builder from 'junit-report-builder';

export const genJunitReport = (path: any, vfiles: any) => {
  const suite = builder.testSuite().name('spellchecker');

  vfiles.forEach((file: any) => {
    file.messages.forEach((error: any) => {
      const testCase = suite.testCase()
        .className(error.ruleId)
        .name(error.name);
      testCase.failure(error.message, error.ruleId);
    });
  });

  builder.writeTo(path);
  console.log(`Generated report: ${path}`);
};
