import { JSToTSCompiler, Options } from './compiler';

export * from './compiler';

export function compile(
  samples: any,
  parentInterfaceName: string,
  options?: Partial<Options>
) {
  const compiler = new JSToTSCompiler(options);
  return compiler.build(samples, parentInterfaceName);
}
