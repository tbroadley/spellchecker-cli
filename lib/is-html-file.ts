import path from 'path';

export const isHtmlFile = (filePath: string): boolean =>
  ['.html'].includes(path.extname(filePath).toLowerCase());
