import path from 'path';

export const isMarkdownFile = (filePath: string): boolean =>
  ['.md', '.markdown', '.mdx'].includes(path.extname(filePath).toLowerCase());
