![CI](https://github.com/osv/json-class-to-ts/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/osv/json-class-to-ts/branch/master/graph/badge.svg?token=XFADRQDQSG)](https://codecov.io/gh/osv/json-class-to-ts)

# NAME

`json-class-to-ts` - jet another library for converting json to typescript with json class support

# SYNOPSIS

Command line cli:

```bash
# help
json-class-to-ts -h
# convert example
  echo '{ "foo": 1, "@c": "Class1" }' | \
json-class-to-ts --className @c -r bar --enableIsClassExports
```

Library:

```js
import {compile} from 'json-class-to-ts';

compile([{ "foo": 1, "@c": "Class1" }], 'bar', {className: '@c', enableIsClassExports: true})
//
// export type Bar = Class1;
//
// export function isClass1(x: any): x is Class1 {return x && x['@c'] == 'Class1'}
//
// export interface Class1 {
//   foo: number;
//   "@c": 'Class1';
// }
```

# DESCRIPTION

There are a lot of tools for converting json to typescript, like quicktype.
However these tools does not support class property in json.
In case if your json file have property with class name you can build more accurate types.
This library allow you to build type definition with interface name from class property.

To build more accurate types you need to collect many samples in json array.

Options like `enumForceProperties` and `enumForbidProperties` allow you
to force or forbid enum creation for specified properties of interface.
For example, to force enum creation for `bar` property you need to use next values in
enumForceProperties: `['Foo.bar', '.bar', 'bar']` for next interface:

```ts
interface Foo {
  bar: string;
}
```

Enums will be created automaticly if there is more than `enumMinNumUniqueString` and less `enumMaxNumUniqueString` than unique ascii strings. 

Turn on `enableIsClassExports` flag if you need export function for testing interface with class property.

Options can be set via config file and have higher priority than command line options

# Build, test, development this library

Development mode:

```
npm start # or yarn start
```

Testing in development mode:

```
yarn test-watch
```

