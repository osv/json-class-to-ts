import { expectJS2TS } from './util';

describe('Arrray', () => {
  test('Empty Array', () => {
    expectJS2TS(
      [{ array: [] }],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: any[];
}
`
    );
  });

  test('Array of array of numbers', () => {
    expectJS2TS(
      [
        {
          array1: [
            [1, 2, 3],
            [3, 4, 6],
          ],
        },
      ],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array1: Array<number[]>;
}
`
    );
  });

  test('Array of array of similar objects', () => {
    expectJS2TS(
      [
        {
          array: [
            [{ foo: 2 }, { foo: 1 }],
            [{ bar: 1 }, { baz: 4 }],
          ],
        },
      ],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: Array<IFooInterfaceArray[]>;
}

export interface IFooInterfaceArray {
  foo?: number;
  bar?: number;
  baz?: number;
}
`
    );
  });

  test('Array of array of different types: primitive and object', () => {
    expectJS2TS(
      [
        {
          array: [null, [{ foo: 2 }, { foo: 1 }], [{ bar: 1 }, { baz: 4 }]],
        },
        {
          array: ['str', [{ foo: 2 }, { foo: 1 }], [{ bar: 1 }, { baz: 4 }]],
        },
        {
          array: ['str', [{ foo: 2 }, { foo: 1 }], [{ bar: 1 }, { baz: 4 }]],
        },
        {
          array: ['str', [{ foo: 2 }, { foo: 1 }], [{ bar: 1 }, { baz: 4 }]],
        },
      ],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: Array<null | IFooInterfaceArray[] | string>;
}

export interface IFooInterfaceArray {
  foo?: number;
  bar?: number;
  baz?: number;
}
`
    );
  });

  test('Array of different classes', () => {
    expectJS2TS(
      [
        {
          prop1: [{ __class__: 'B' }, { __class__: 'C' }],
          __class__: 'A',
        },
        {
          prop1: [{ __class__: 'D' }, { __class__: 'E' }],
          __class__: 'A',
        },
      ],
      'fooInterface',
      `
export type FooInterface = A;

export interface A {
  prop1: Array<B
      | C
      | D
      | E>;
  __class__: 'A';
}

export interface B {
  __class__: 'B';
}

export interface C {
  __class__: 'C';
}

export interface D {
  __class__: 'D';
}

export interface E {
  __class__: 'E';
}
`
    );
  });

  test('Array of array of 5 different interfaces', () => {
    expectJS2TS(
      [
        {
          array: [
            [
              { foo: 2, __class__: 'Class1' },
              { foo: 1, __class__: 'Class2' },
              { foo: 1, __class__: 'Class4' },
              { foo: 1, __class__: 'Class5' },
            ],
            [
              { bar: 1, __class__: 'Class3' },
              { baz: 4, __class__: 'Class1' },
            ],
          ],
        },
      ],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: Array<Array<Class1
      | Class2
      | Class4
      | Class5
      | Class3>>;
}

export interface Class1 {
  foo?: number;
  __class__: 'Class1';
  baz?: number;
}

export interface Class2 {
  foo: number;
  __class__: 'Class2';
}

export interface Class4 {
  foo: number;
  __class__: 'Class4';
}

export interface Class5 {
  foo: number;
  __class__: 'Class5';
}

export interface Class3 {
  bar: number;
  __class__: 'Class3';
}
`
    );
  });

  test('Array of array of 3 different types', () => {
    expectJS2TS(
      [
        {
          array: [
            [null, { foo: 2, __class__: 'Class1' }],
            [{ bar: 1, __class__: 'Class2' }],
          ],
        },
      ],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: Array<Array<null | Class1 | Class2>>;
}

export interface Class1 {
  foo: number;
  __class__: 'Class1';
}

export interface Class2 {
  bar: number;
  __class__: 'Class2';
}
`
    );
  });

  test('Array of number and array of object', () => {
    expectJS2TS(
      [
        {
          array: [1, [{ prop1: 1, __class__: 'Class1' }]],
        },
      ],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: Array<number | Class1[]>;
}

export interface Class1 {
  prop1: number;
  __class__: 'Class1';
}
`
    );
  });

  describe('Tuple', () => {
    test('Tuple of 2 items', () => {
      expectJS2TS(
        [
          {
            array: [1, [{ foo: 'txt2' }]],
          },
          {
            array: [2, [{ foo: 'txt1' }]],
          },
        ],
        'fooInterface',
        `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: [number, IFooInterfaceArray[]];
}

export interface IFooInterfaceArray {
  foo: string;
}
`
      );
    });

    test('Tuple of 2 same object', () => {
      expectJS2TS(
        [
          {
            array: [null, [{ foo: 2 }, { foo: 1 }], [{ bar: 1 }, { baz: 4 }]],
          },
          {
            array: [null, [{ foo: 2 }, { foo: 1 }], [{ bar: 1 }, { baz: 4 }]],
          },
          {
            array: [null, [{ foo: 2 }, { foo: 1 }], [{ bar: 1 }, { baz: 4 }]],
          },
        ],
        'fooInterface',
        `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: [null, IFooInterfaceArray[], IFooInterfaceArray[]];
}

export interface IFooInterfaceArray {
  foo?: number;
  bar?: number;
  baz?: number;
}
`
      );
    });

    test('Tuples of same pattern', () => {
      expectJS2TS(
        [
          {
            array: [
              1,
              [{ __class__: 'C1' }],
              [{ __class__: 'C2' }, { __class__: 'C2' }],
            ],
          },
          {
            array: [2, [{ __class__: 'C1' }], [{ __class__: 'C2' }]],
          },
          {
            array: [
              3,
              [{ __class__: 'C1' }, { __class__: 'C1' }],
              [{ __class__: 'C2' }],
            ],
          },
        ],
        'fooInterface',
        `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: [number, C1[], C2[]];
}

export interface C1 {
  __class__: 'C1';
}

export interface C2 {
  __class__: 'C2';
}
`
      );
    });
  });
});
