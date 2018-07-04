const path = require('path');

export const isMarkdownFile =
    filePath => ['.md', '.markdown'].includes(path.extname(filePath).toLowerCase());
