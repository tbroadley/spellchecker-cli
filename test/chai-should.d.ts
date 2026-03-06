/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { Assertion } from 'chai';

declare global {
  export namespace Chai {
    interface Assertion {
      should: Assertion;
    }
  }
}

declare module 'chai' {
  interface Should extends Assertion {}
}

// Augment all types with should property
declare global {
  interface Object {
    should: Assertion;
  }
  interface Array<T> {
    should: Assertion;
  }
  interface String {
    should: Assertion;
  }
  interface Number {
    should: Assertion;
  }
  interface Boolean {
    should: Assertion;
  }
}

export {};
