import path from 'path';

export const isMarkdownFile = (filePath: any) => {
  return ['.md', '.markdown'].includes(path.extname(filePath).toLowerCase());
};
