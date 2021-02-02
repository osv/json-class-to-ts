import { JSToTSCompiler, Options } from './compiler';

export * from './compiler';

export function compile(
  samples: any,
  parentInterfaceName: string,
  options?: Partial<Options>
) {
  const compiler = new JSToTSCompiler(options);
  if (!parentInterfaceName || parentInterfaceName === '') {
    throw Error('parentInterfaceName should be defined');
  }
  return compiler.build(samples, parentInterfaceName);
}
