import { extname } from 'path';

export const isMarkdownFile = (filePath) => ['.md', '.markdown'].includes(extname(filePath).toLowerCase());
