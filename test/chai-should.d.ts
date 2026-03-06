declare global {
  export namespace Chai {
    interface Assertion {
      should: Assertion;
    }
  }
}

declare module 'chai' {
  interface Should extends Chai.Assertion {}
}

// Augment all types with should property
declare global {
  interface Object {
    should: Chai.Assertion;
  }
  interface Array<T> {
    should: Chai.Assertion;
  }
  interface String {
    should: Chai.Assertion;
  }
  interface Number {
    should: Chai.Assertion;
  }
  interface Boolean {
    should: Chai.Assertion;
  }
}

export {};
