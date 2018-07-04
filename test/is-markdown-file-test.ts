import { isMarkdownFile } from '../src/is-markdown-file';

describe('isMarkdownFile', () => {
  it('returns true for a file with the extension `.md`', () => {
    isMarkdownFile('test.md').should.equal(true);
  });

  it('returns true for a file with the extension `.markdown`', () => {
    isMarkdownFile('test.markdown').should.equal(true);
  });

  it('returns true for a file with the extension `.MD`', () => {
    isMarkdownFile('test.MD').should.equal(true);
  });

  it('returns false for a file with a non-Markdown extension', () => {
    isMarkdownFile('test.txt').should.equal(false);
  });
});
