import { JSToTSCompiler } from '../src/compiler';

describe('getInterfacesAndMethods()', () => {
  test('should return concat list of interface name and property names', () => {
    const c = new JSToTSCompiler({ className: '__class__' });
    const samples = [
      {
        __class__: 'Class1',
        prop1: 1,
        prop2: 2,
        prop3: {
          __class__: 'SubClass',
          prop1: 3,
        },
      },
    ];
    c.build(samples, 'Foo');
    expect(c.getInterfacesAndMethods()).toEqual([
      'Class1.__class__',
      'Class1.prop1',
      'Class1.prop2',
      'Class1.prop3',
      'SubClass.__class__',
      'SubClass.prop1',
    ]);
  });
});
