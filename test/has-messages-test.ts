import chai from 'chai';
import { VFileMessage } from 'vfile-reporter';

import { hasMessages } from '../lib/has-messages.js';

import { buildVfile, fileWithNoMessages } from './helpers/vfile.js';

chai.should();

describe('hasMessages', () => {
  it('returns false when passed an empty array', () => {
    hasMessages([]).should.equal(false);
  });

  it('returns false when passed an array of files with no messages', () => {
    hasMessages([
      fileWithNoMessages,
      fileWithNoMessages,
      fileWithNoMessages,
    ]).should.equal(false);
  });

  it('returns true when passed an array containing one file with a message', () => {
    hasMessages([
      fileWithNoMessages,
      buildVfile(['a']),
    ]).should.equal(true);
  });

  it('filters messages using the given function', () => {
    hasMessages([
      buildVfile(['a', 'b', 'c']),
    ], (message: VFileMessage) => message.source === 'asdf').should.equal(false);
  });
});
