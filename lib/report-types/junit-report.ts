import builder from 'junit-report-builder';
import { VFile, VFileMessage } from 'vfile-reporter';

export const genJunitReport = (path: string, vfiles: VFile[]): void => {
  const suite = builder.testSuite().name('spellchecker');

  vfiles.forEach((file) => {
    file.messages.forEach((error: VFileMessage) => {
      const testCase = suite.testCase()
        .className(error.ruleId)
        .name(error.name);
      testCase.failure(error.message, error.ruleId);
    });
  });

  builder.writeTo(path);
  console.log(`Generated report: ${path}`);
};
