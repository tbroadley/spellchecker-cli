import * as path from 'path';

export const isMarkdownFile =
    (filePath) => ['.md', '.markdown'].includes(path.extname(filePath).toLowerCase());
