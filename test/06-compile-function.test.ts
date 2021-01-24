import { compile } from '../';

test('when simple array', () => {
  expect(compile([1, 2, 3], 'fooInterface')).toBe(
    `export type FooInterface = number;


`
  );
});
