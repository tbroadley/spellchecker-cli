import chai from 'chai';

import { isHtmlFile } from '../lib/is-html-file.js';

chai.should();

describe('isHtmlFile', () => {
  it('returns true for a file with the extension `.html`', () => {
    isHtmlFile('test.html').should.equal(true);
  });

  it('returns true for a file with the extension `.HTML`', () => {
    isHtmlFile('test.HTML').should.equal(true);
  });

  it('returns false for a file with a non-HTML extension', () => {
    isHtmlFile('test.txt').should.equal(false);
  });

  it('returns false for a file with no extension', () => {
    isHtmlFile('test').should.equal(false);
  });
});
