import { expectJS2TS } from './util';

describe('Enum', () => {
  let samples;
  beforeEach(() => {
    samples = [
      { prop1: 'val1', __class__: 'Class1' },
      { prop1: 'val1', __class__: 'Class1' },
      { prop1: 'val2', __class__: 'Class1' },
      { prop1: 'val2', __class__: 'Class1' },
      { prop1: '777', __class__: 'Class1', prop2: 'prop2 value' },
    ];
  });

  test('when found 2 times unique items', () => {
    expectJS2TS(
      [
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val2', __class__: 'Class1' },
        { prop1: 'val2', __class__: 'Class1' },
        { prop1: 'val3', __class__: 'Class1' },
      ],
      'fooInterface',
      `
export type FooInterface = Class1;

export interface Class1 {
  prop1: 'val1' | 'val2' | 'val3';
  __class__: 'Class1';
}
`
    );
  });

  test('when found 1 times unique items', () => {
    expectJS2TS(
      [
        { prop1: 'val0', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val2', __class__: 'Class1' },
        { prop1: 'val3', __class__: 'Class1' },
      ],
      'fooInterface',
      `
export type FooInterface = Class1;

export interface Class1 {
  prop1: string;
  __class__: 'Class1';
}
`
    );
  });

  test('when found 3 times unique items and enumMinNumUniqueString = 4', () => {
    expectJS2TS(
      [
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
      ],
      'fooInterface',
      `
export type FooInterface = Class1;

export interface Class1 {
  prop1: string;
  __class__: 'Class1';
}
`,
      { enumMinNumUniqueString: 4 }
    );
  });

  test('when found 4 times unique items and enumMinNumUniqueString = 4', () => {
    expectJS2TS(
      [
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
      ],
      'fooInterface',
      `
export type FooInterface = Class1;

export interface Class1 {
  prop1: 'val1';
  __class__: 'Class1';
}
`,
      { enumMinNumUniqueString: 4 }
    );
  });

  describe('when options enumMaxInlineItems = 2', () => {
    const options = { enumMaxInlineItems: 2 };

    test('creates enums when total prop values length  > unique items by 2', () => {
      expectJS2TS(
        samples,
        'fooInterface',
        `
export type FooInterface = Class1;

export interface Class1 {
  prop1: Class1Prop1Enum;
  __class__: 'Class1';
  prop2?: string;
}

export enum Class1Prop1Enum {
  Val1 = 'val1',
  Val2 = 'val2',
  Value777 = '777'
}

`,
        options
      );
    });

    test('creates enum starts with "Item" if value starts from "."', () => {
      samples = [...samples, { prop1: '.abc', __class__: 'Class1' }];
      expectJS2TS(
        samples,
        'fooInterface',
        `
export type FooInterface = Class1;

export interface Class1 {
  prop1: Class1Prop1Enum;
  __class__: 'Class1';
  prop2?: string;
}

export enum Class1Prop1Enum {
  Val1 = 'val1',
  Val2 = 'val2',
  Value777 = '777',
  Item4Abc = '.abc'
}

`,
        options
      );
    });

    test('when 2 enums in object', () => {
      expectJS2TS(
        samples.map(it => ({ ...it, secondEnum: 'second_enum_' + it.prop1 })),
        'fooInterface',
        `
export type FooInterface = Class1;

export interface Class1 {
  prop1: Class1Prop1Enum;
  __class__: 'Class1';
  secondEnum: Class1SecondEnumEnum;
  prop2?: string;
}

export enum Class1Prop1Enum {
  Val1 = 'val1',
  Val2 = 'val2',
  Value777 = '777'
}

export enum Class1SecondEnumEnum {
  SecondEnumVal1 = 'second_enum_val1',
  SecondEnumVal2 = 'second_enum_val2',
  SecondEnum777 = 'second_enum_777'
}
`,
        options
      );
    });

    test('should not create enums when enum contains " "', () => {
      expectJS2TS(
        samples.map(it => ({ ...it, prop1: it.prop1 + ' foo' })),
        'fooInterface',
        `
export type FooInterface = Class1;

export interface Class1 {
  prop1: string;
  __class__: 'Class1';
  prop2?: string;
}
`,
        options
      );
    });

    test('should not create enums when enum contains " "', () => {
      expectJS2TS(
        [
          ...samples,
          { prop1: '', __class__: 'Class1' },
          { prop1: '01', __class__: 'Class1' },
        ],
        'fooInterface',
        `
export type FooInterface = Class1;

export interface Class1 {
  prop1: Class1Prop1Enum;
  __class__: 'Class1';
  prop2?: string;
}

export enum Class1Prop1Enum {
  Val1 = 'val1',
  Val2 = 'val2',
  Value777 = '777',
  Empty = '',
  Value01 = '01'
}
`,
        options
      );
    });
  });

  test('when prop are 3 uniq items', () => {
    expectJS2TS(
      [
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: 'val1', __class__: 'Class1' },
        { prop1: '2ndItem', __class__: 'Class1' },
        { prop1: '2ndItem3', __class__: 'Class1' },
      ],
      'fooInterface',
      `
export type FooInterface = Class1;

export interface Class1 {
  prop1: string;
  __class__: 'Class1';
}
`
    );
  });

  test('should forbid enum creation if property in "enumForbidProperties"', () => {
    expectJS2TS(
      samples,
      'fooInterface',
      `
export type FooInterface = Class1;

export interface Class1 {
  prop1: string;
  __class__: 'Class1';
  prop2?: string;
}
`,
      { enumForbidProperties: ['prop1'] }
    );
  });

  describe('whem option enumForceProperties is ["prop2"]', () => {
    const options = { enumForceProperties: ['prop2'] };

    test('creates enum list for prop1', () => {
      expectJS2TS(
        samples,
        'fooInterface',
        `
export type FooInterface = Class1;

export interface Class1 {
  prop1: 'val1' | 'val2' | '777';
  __class__: 'Class1';
  prop2?: 'prop2 value';
}
`,
        options
      );
    });

    test('creates enum list with new line for prop1 if there are 4 items', () => {
      expectJS2TS(
        [...samples, { prop1: 'val3', __class__: 'Class1' }],
        'fooInterface',
        `
export type FooInterface = Class1;

export interface Class1 {
  prop1: 'val1'
    | 'val2'
    | '777'
    | 'val3';
  __class__: 'Class1';
  prop2?: 'prop2 value';
}
`,
        options
      );
    });
  });
});
