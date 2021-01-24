import { expectJS2TS } from './util';

test('when simple array', () => {
  expectJS2TS(
    [1, 2, 3],
    'fooInterface',
    `
export type FooInterface = number;
`
  );
});

test('when array of number or string or null', () => {
  expectJS2TS(
    [1, 'foo', null],
    'fooInterface',
    `
export type FooInterface = number | string | null;
`
  );
});

test('when sample has 1 object', () => {
  expectJS2TS(
    [{ prop1: 1 }],
    'fooInterface',
    `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  prop1: number;
}
`
  );
});

test('primitives', () => {
  expectJS2TS(
    [
      {
        nullProp: null,
        undefinedProp: undefined,
        stringProp: 'str',
        numberProp: 123,
        boolProp: false,
      },
    ],
    'fooInterface',
    `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  nullProp: null;
  undefinedProp: undefined;
  stringProp: string;
  numberProp: number;
  boolProp: boolean;
}
`
  );
});

test('when sample has optional property', () => {
  expectJS2TS(
    [
      { prop1: 1, prop3: 5 },
      { prop2: 3, prop3: 5 },
      { prop2: 4, prop3: 5 },
    ],
    'fooInterface',
    `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  prop1?: number;
  prop3: number;
  prop2?: number;
}
`
  );
});

test('when sample has props starts non latin chars', () => {
  expectJS2TS(
    [{ '@a': 1 }, { '!b': 2 }, { '345': 3 }, { '^z': 5 }],
    'fooInterface',
    `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  345?: number;
  "@a"?: number;
  "!b"?: number;
  "^z"?: number;
}
`
  );
});

test('when sample has Object with __class__', () => {
  expectJS2TS(
    [
      { prop1: 1, prop3: 5, __class__: 'Class1' },
      { prop1: 3, __class__: 'Class1' },
    ],
    'fooInterface',
    `
export type FooInterface = Class1;

export interface Class1 {
  prop1: number;
  prop3?: number;
  __class__: 'Class1';
}
`
  );
});

describe('when sample has Object with different classes', () => {
  test('generates FooInterface = Class1 | Class2 if 2 classes', () => {
    expectJS2TS(
      [
        { prop1: 1, prop3: 5, __class__: 'Class1' },
        { prop1: 3, __class__: 'Class2' },
      ],
      'fooInterface',
      `
export type FooInterface = Class1 | Class2;

export interface Class1 {
  prop1: number;
  prop3: number;
  __class__: 'Class1';
}

export interface Class2 {
  prop1: number;
  __class__: 'Class2';
}
`
    );
  });

  test('generates FooInterface = Class1 | Class2 if more than 3 classes', () => {
    expectJS2TS(
      [
        { prop1: 1, prop3: 5, __class__: 'Class1' },
        { prop1: 3, __class__: 'Class2' },
        { __class__: 'Class3' },
        { __class__: 'Class4' },
      ],
      'fooInterface',
      `
export type FooInterface = Class1 | Class2 | Class3 | Class4;

export interface Class1 {
  prop1: number;
  prop3: number;
  __class__: 'Class1';
}

export interface Class2 {
  prop1: number;
  __class__: 'Class2';
}

export interface Class3 {
  __class__: 'Class3';
}

export interface Class4 {
  __class__: 'Class4';
}
`
    );
  });
});

test('when sample has Object where property is Array or null', () => {
  expectJS2TS(
    [
      { prop1: [1, 2, 3, 4], __class__: 'Class1' },
      { prop1: null, __class__: 'Class1' },
    ],
    'fooInterface',
    `
export type FooInterface = Class1;

export interface Class1 {
  prop1: number[] | null;
  __class__: 'Class1';
}
`
  );
});

describe('enableIsClassExports option', () => {
  test('exports "is" function if __class__ defined in sample', () => {
    expectJS2TS(
      [{ prop1: 1, __class__: 'Class1' }],
      'fooInterface',
      `
export type FooInterface = Class1;

export function isClass1(x: any): x is Class1 {return x && x['__class__'] == 'Class1'}

export interface Class1 {
  prop1: number;
  __class__: 'Class1';
}
`,
      { enableIsClassExports: true }
    );
  });

  test('should not export "is" function if __class__ is not defined in sample', () => {
    expectJS2TS(
      [{ prop1: 1 }],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  prop1: number;
}
`,
      { enableIsClassExports: true }
    );
  });
});
