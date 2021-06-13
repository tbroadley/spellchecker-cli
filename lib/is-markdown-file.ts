import path from 'path';

export const isMarkdownFile = (filePath: any) => ['.md', '.markdown'].includes(path.extname(filePath).toLowerCase());
