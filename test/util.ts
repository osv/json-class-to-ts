import { compile, Options } from '../src';

export function expectJS2TS(
  samples,
  interfaceName,
  expected,
  options?: Partial<Options>
) {
  options = { className: '__class__', ...options };

  const res = compile(samples, interfaceName, options);

  // console.log(`Res\n${res}`);
  expect(trim(res)).toBe(trim(expected));
  function trim(x) {
    return x.replace(/^[\n\s]+/, '').replace(/[\n\s]+$/, '');
  }
}
