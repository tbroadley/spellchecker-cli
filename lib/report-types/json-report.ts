import fs from 'fs';

export const genJsonReport = (path: any, vfiles: any) => {
  const json = JSON.stringify(vfiles, null, 4);

  fs.writeFileSync(path, json);
  console.log(`Generated report: ${path}`);
};
