import { VFile } from 'vfile-reporter';

import { genJsonReport } from './report-types/json-report';
import { genJunitReport } from './report-types/junit-report';

export const generateReports = (reports: string[], vfiles: VFile[]): void => {
  reports.forEach((report: string) => {
    if (report.endsWith('.json')) {
      genJsonReport(report, vfiles);
    } else if (report.endsWith('junit.xml')) {
      genJunitReport(report, vfiles);
    }
  });
};
