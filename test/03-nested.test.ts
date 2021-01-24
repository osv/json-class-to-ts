import { expectJS2TS } from './util';

describe('Nested', () => {
  test('interfaces', () => {
    expectJS2TS(
      [
        {
          prop1Nested: {
            prop2Nested: {},
          },
        },
      ],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  prop1Nested: IFooInterfaceProp1Nested;
}

export interface IFooInterfaceProp1Nested {
  prop2Nested: IFooInterfaceProp1NestedProp2Nested;
}

export interface IFooInterfaceProp1NestedProp2Nested {
}
`
    );
  });

  test('array of 1 interface', () => {
    expectJS2TS(
      [{ array: [{ prop1: 1 }] }],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: IFooInterfaceArray[];
}

export interface IFooInterfaceArray {
  prop1: number;
}
`
    );
  });

  test('array of 2 interfaces', () => {
    expectJS2TS(
      [{ array: [{ prop1: 1 }, { __class__: 'ClassName' }] }],
      'fooInterface',
      `
export type FooInterface = IFooInterface;

export interface IFooInterface {
  array: Array<IFooInterfaceArray | ClassName>;
}

export interface IFooInterfaceArray {
  prop1: number;
}

export interface ClassName {
  __class__: 'ClassName';
}
`
    );
  });
});
