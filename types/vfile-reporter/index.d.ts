declare module 'vfile-reporter' {
  export type VFile = import('vfile').VFile
  export type VFileMessage = import('vfile-message').VFileMessage
  export type Statistics = import('vfile-statistics').Statistics
  export type Options = {
    color?: boolean
    silent?: boolean
    quiet?: boolean
    verbose?: boolean
    defaultName?: string
  }
  export type _Row = {
    place: string
    label: string
    reason: string
    ruleId: string
    source: string
  }
  export type _FileRow = {
    type: 'file'
    file: VFile
    stats: Statistics
  }
  export type _Sizes = {
    [x: string]: number
  }
  export type _Info = {
    rows: Array<_FileRow | _Row>
    stats: Statistics
    sizes: _Sizes
  }

  /**
   * Report a file’s messages.
   *
   * @param {Error|VFile|Array.<VFile>} [files]
   * @param {Options} [options]
   * @returns {string}
   */
  export default function reporter(
    files?: Error | VFile | Array<VFile>,
    options?: Options
  ): string;
}

declare module 'junit-report-builder';
declare module 'remark-gemoji-to-emoji';
declare module 'remark-retext';
declare module 'retext';
declare module 'retext-indefinite-article';
declare module 'retext-repeated-words';
declare module 'retext-spell';
declare module 'retext-syntax-mentions';
declare module 'retext-syntax-urls';
declare module 'unist-util-visit';
declare module 'vfile';
