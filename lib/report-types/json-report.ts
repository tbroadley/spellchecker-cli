import fs from 'fs';

import { VFile } from 'vfile-reporter';

export const genJsonReport = (path: string, vfiles: VFile[]): void => {
  const json = JSON.stringify(vfiles, null, 4);

  fs.writeFileSync(path, json);
  console.log(`Generated report: ${path}`);
};
