import path from 'path';

export const isMarkdownFile = (filePath: string): boolean => ['.md', '.markdown'].includes(path.extname(filePath).toLowerCase());
