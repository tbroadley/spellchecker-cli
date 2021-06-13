import { genJsonReport } from './report-types/json-report';
import { genJunitReport } from './report-types/junit-report';

export const generateReports = (reports: any, vfiles: any) => {
  reports.forEach((report: any) => {
    if (report.endsWith('.json')) {
      genJsonReport(report, vfiles);
    } else if (report.endsWith('junit.xml')) {
      genJunitReport(report, vfiles);
    }
  });
};
