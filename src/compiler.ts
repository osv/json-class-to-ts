import { forEachObjIndexed, uniq, keys, has, flatten } from 'ramda';

const isArray = Array.isArray;

type Dictionary<T> = Record<string, T | undefined>;

function isObject(object: any): object is Dictionary<any> & object {
  return typeof object === 'object' && object !== null && !isArray(object);
}

class CInterface {
  isClass: boolean = false;
  classNameStr: string | undefined;
  properties: Dictionary<CInterfaceProperty> = {};
  isInitiated: boolean = false;
  constructor(public name: string) {}

  addProperty(name: string, type: string[] | string) {
    const property = (this.properties[name] =
      this.properties[name] || new CInterfaceProperty(name));
    property.types.push(type);
    return property;
  }
}

class CInterfaceProperty {
  isOptional: boolean = false;
  types: any[] = []; // if more than render as enum
  constructor(public name: string) {}
}

const PRIMITIVES = ['null', 'undefined', 'string', 'number', 'boolean'];

const ROOT_INTERFACE_NAME = '$root$';
const ROOT_PROPERTY = 'root';

export const DEFAULT_OPTIONS = Object.freeze<Options>({
  enableIsClassExports: false,
  enumMinNumUniqueString: 3,
  enumMaxNumUniqueString: 40,
  enumMaxInlineItems: 6,
  enumForceProperties: [],
  enumForbidProperties: [],
});

export interface Options {
  className?: string;
  enableIsClassExports: boolean; // e.g `export function isFoo(x): x is Foo`
  enumMaxInlineItems: number; // max inline enum items, e.g 1 | 2 | 3 | 4
  enumMinNumUniqueString: number;
  enumMaxNumUniqueString: number;
  enumForceProperties: string[];
  enumForbidProperties: string[];
}

export class JSToTSCompiler {
  interfaces: Dictionary<CInterface> = {};
  enums: Dictionary<Array<{ name: string; list: string[] }>> = {}; // enums
  rootName: string = '';
  options: Options = { ...DEFAULT_OPTIONS };

  constructor(options?: Partial<Options>) {
    this.options = Object.assign(this.options, options);
  }

  getRootInterfaceName() {
    return this.rootName;
  }

  getInterfacesAndMethods() {
    const res: string[] = [];
    Object.entries(this.interfaces).forEach(([interfaceName, interf]) => {
      if (interfaceName === ROOT_INTERFACE_NAME) {
        return;
      }
      keys(interf?.properties).forEach(propertyName =>
        res.push(`${interfaceName}.${propertyName}`)
      );
    });
    return res;
  }

  getInterface(name: string): CInterface {
    this.interfaces[name] = this.interfaces[name] || new CInterface(name);
    return this.interfaces[name]!;
  }

  build(data: any, parentInterfaceName: string) {
    data = isArray(data) ? data : [data];
    this.enums = {};
    this.interfaces = {};
    parentInterfaceName = this.camelize(parentInterfaceName);
    this.rootName = parentInterfaceName;
    const interf = this.getInterface(ROOT_INTERFACE_NAME);
    const rootTypes = this.buildRecursive(data, 'I' + parentInterfaceName);
    rootTypes.forEach(it => interf.addProperty(ROOT_PROPERTY, it));

    this.optimizeTypes();
    return this.render();
  }

  private getStrEnumIfAllTypesAreStrOrArrayOfStr(
    types: any[],
    propertyName: string,
    interfaceName: string
  ): string[] | null {
    const isArrayOfStrOrStr = !types.some(
      it => isArray(types[0]) !== isArray(it)
    );
    if (!isArrayOfStrOrStr) {
      return null;
    }
    types = flatten(types);
    const stringTypes = types.filter(it => it && it[0] === "'");
    const isAllTypesAreStrings = stringTypes.length === types.length;
    if (!isAllTypesAreStrings) return null;
    const uniqStrings = uniq(types);
    const numStringTypes = stringTypes.length;
    const numUniqStrings = uniqStrings.length;

    const interfaceWithPropertyName = interfaceName + '.' + propertyName;
    if (
      (this.options.className && propertyName === this.options.className) ||
      this.options.enumForceProperties.some(it =>
        interfaceWithPropertyName.endsWith(it)
      ) ||
      (!this.options.enumForbidProperties.some(it =>
        interfaceWithPropertyName.endsWith(it)
      ) &&
        numStringTypes - numUniqStrings >=
          this.options.enumMinNumUniqueString - 1 &&
        numUniqStrings <= this.options.enumMaxNumUniqueString &&
        !types.some(it => /[^a-zA-Z_.0-9-'']/.test(it)))
    ) {
      return uniqStrings;
    }
    return null;
  }

  // ["'foo'", "'bar'", Foo] -> ["string", "string", "Foo"]
  private removeStringEnums(types: any[]): any[] {
    return types.map(it => {
      if (isArray(it)) {
        return it.map(it2 => (it2[0] === "'" ? 'string' : it2));
      } else {
        return it[0] === "'" ? 'string' : it;
      }
    });
  }

  // Convert types to typescript and respect array
  private recusiveTypeToTS(data: any | any[]) {
    if (isArray(data)) {
      // try convert Array<number[] | string[]> to Array<Array<number | string>>
      const isNextLvlArraysOfNotArrays =
        data.length &&
        data.every(it => {
          return isArray(it);
        });
      if (isNextLvlArraysOfNotArrays) {
        data = flatten(data);
        const types = this.recusiveTypeToTS(data);
        return `Array<${types}>`;
      }
      // otherwise, recursively process array and convert to Foo[] or Array<Foo | Bar>
      const types = data.map(it => this.recusiveTypeToTS(it));
      const arrayTypes = uniq(types);
      const isAllSame = arrayTypes.length === 1;
      if (isAllSame) {
        if (arrayTypes[0].endsWith(']')) {
          return `Array<${arrayTypes[0]}>`;
        } else {
          return arrayTypes[0] + '[]';
        }
      }
      if (!arrayTypes.length) return 'any[]';
      return `Array<${arrayTypes.join(
        arrayTypes.length > 3 ? '\n      | ' : ' | '
      )}>`;
    } else {
      return this.camelizeType(data);
    }
  }

  // Try to make ts typle ("[number, FooBar]") or null of failed
  private tryTuple(data: any[]): [string] | null {
    if (
      data.length < 2 ||
      !isArray(data[0]) ||
      data[0].length < 1 ||
      data[0].length > 3
    ) {
      return null;
    }

    const isSame =
      data.length > 1 &&
      isArray(data[0]) &&
      data[0].length > 1 &&
      data
        .slice(1)
        .every(
          it => this.recusiveTypeToTS(it) === this.recusiveTypeToTS(data[0])
        );

    if (isSame) {
      const types = data[0].map(it => this.recusiveTypeToTS(it));
      return [`[${types.join(', ')}]`];
    } else {
      return null;
    }
  }

  // Transform Array<A | B> | Array<C | D> into Array<A | B | C | D>
  flattenArrayIfAllAreArrays(data: any[]) {
    if (data.every(isArray)) {
      data = [uniq(([] as any[]).concat(...data))]; // flatten 1 lvl
    }
    return data;
  }

  // Make enum, tuple array, etc
  private optimizeTypes() {
    forEachObjIndexed((interf, interfaceName) => {
      forEachObjIndexed((property, propertyName) => {
        // Try make enums
        const enumItems = this.getStrEnumIfAllTypesAreStrOrArrayOfStr(
          property!.types,
          propertyName,
          interfaceName
        );
        if (enumItems) {
          let enumTypeName = enumItems;
          if (
            enumItems.length > this.options.enumMaxInlineItems ||
            isArray(property!.types[0])
          ) {
            // Create enum type
            const enumName = interfaceName + '.' + propertyName + '.Enum';
            enumTypeName = [enumName];
            this.enums[interfaceName] = this.enums[interfaceName] || [];
            this.enums[interfaceName]!.push({
              name: enumName,
              list: enumItems,
            });
          }
          property!.types = isArray(property!.types[0])
            ? [enumTypeName]
            : enumTypeName;
        } else {
          property!.types = this.removeStringEnums(property!.types);
        }

        const tuple = this.tryTuple(property!.types);
        if (tuple) {
          property!.types = tuple;
        } else {
          property!.types = this.flattenArrayIfAllAreArrays(property!.types);
          property!.types = property!.types.map(t => {
            return this.recusiveTypeToTS(t);
          });
        }
        const types = uniq(property!.types);
        property!.types = types;
      }, interf!.properties);
    }, this.interfaces);

    // Camelize interface names
    const newInterfaces: Dictionary<CInterface> = {};
    keys(this.interfaces).forEach(interfaceName => {
      const newInterfaceName = this.camelizeType(interfaceName);
      newInterfaces[newInterfaceName] = this.interfaces[interfaceName];
      delete this.interfaces[interfaceName];
      newInterfaces[newInterfaceName]!.name = newInterfaceName;
    });
    this.interfaces = newInterfaces;

    // Camelize enum names
    const newEnums = {};
    keys(this.enums).forEach(interfaceName => {
      const newInterfaceName = this.camelizeType(interfaceName);
      this.enums[interfaceName] = this.enums[interfaceName]!.map(it => ({
        ...it,
        name: this.camelize(it.name),
      }));
      newEnums[newInterfaceName] = this.enums[interfaceName];
    });
    this.enums = newEnums;
  }

  private buildRecursive(data: any, parentInterfaceName: string) {
    const className = this.options.className;
    if (isArray(data)) {
      return data.map(it => this.buildRecursive(it, parentInterfaceName));
    } else if (isObject(data)) {
      let interfaceName =
        className && data[className] ? data[className] : parentInterfaceName;
      const interf = this.getInterface(interfaceName);
      interf.isClass = !!className && !!data[className];
      interf.classNameStr = className ? data[className] : undefined;
      // Traverse all know properties of interface and make optional if not met again
      if (interf.isInitiated) {
        forEachObjIndexed(propertyOfInterface => {
          if (!propertyOfInterface) return;
          if (!has(propertyOfInterface.name, data)) {
            propertyOfInterface.isOptional = true;
          }
        }, interf.properties);
      }

      forEachObjIndexed((value, key) => {
        const typeName = this.buildRecursive(value, interfaceName + '.' + key);
        const isOptional = !interf.properties[key];
        const propertyOfInterface = interf.addProperty(key, typeName);

        if (interf.isInitiated && isOptional) {
          propertyOfInterface.isOptional = true;
        }
      }, data);
      interf.isInitiated = true;
      return interfaceName;
    } else {
      if (data === null) return 'null';
      if (typeof data === 'string')
        return "'" + this.escapeSingleQuote(data) + "'"; // add as string constants to make enums
      return typeof data;
    }
  }

  private render() {
    let r = '';
    const className = this.options.className;
    for (const interfaceName in this.interfaces) {
      const interf = this.interfaces[interfaceName]!;
      if (this.options.enableIsClassExports && interf.isClass) {
        r += `export function is${interfaceName}(x: any): x is ${interfaceName} {return x && x['${className}'] == '${this.escapeSingleQuote(
          interf.classNameStr
        )}'}\n\n`;
      }
      if (interfaceName === ROOT_INTERFACE_NAME) {
        r += `export type ${this.rootName} = ${interf.properties[
          ROOT_PROPERTY
        ]!.types.join(' | ')};\n\n`;
      } else {
        r += `export interface ${interfaceName} {${this.renderProperties(
          interf
        )}\n}\n`;
        r += this.renderEnumsForInterface(interfaceName);
        r += '\n';
      }
    }
    r += '\n';
    return r;
  }

  private renderEnumsForInterface(interfaceName: string) {
    return this.enums[interfaceName]
      ? this.enums[interfaceName]!.map(
          it => `
export enum ${it.name} {
  ${it.list
    .map((it2, index) => this.normalizeEnumName(it2, index) + ' = ' + it2)
    .join(',\n  ')}
}
`
        ).join('') + '\n'
      : '';
  }

  // Convert inner string literal to appropriate enum name
  private normalizeEnumName(text: string, index: number) {
    text = text.replace(/'/g, '');

    if (text === '') return 'Empty';

    text = text.replace(/[^a-zA-Z0-9_.-]/g, '');

    if (/^\d+$/.test(text)) {
      return 'Value' + text;
    }

    if (/^[^a-zA-Z]/.test(text[0])) {
      text = 'Item' + (index + 1) + text;
    }

    return this.camelize(text);
  }

  private renderProperties(interf: CInterface): string {
    let r = '';
    for (const propertyName in interf.properties) {
      const property = interf.properties[propertyName]!;
      const types = property.types.join(
        property.types.length > 3 ? '\n    | ' : ' | '
      );
      const propertyNameEscaped = propertyName.match(/^[^$a-z0-9A-Z_]/)
        ? `"${propertyName}"`
        : propertyName;
      r += `\n  ${propertyNameEscaped}${
        property.isOptional ? '?' : ''
      }: ${types};`;
    }
    return r;
  }

  private camelizeType(name) {
    if (!name || name[0] === "'") return name;
    return PRIMITIVES.includes(name) ? name : this.camelize(name);
  }

  private camelize(str) {
    return (' ' + str + ' ')
      .replace(/[^$a-zA-ZÀ-ÖØ-öø-ÿ0-9]+(.)/g, function(_, chr) {
        return chr.toUpperCase();
      })
      .trim();
  }

  private escapeSingleQuote(data: any): string {
    return ('' + data).replace("'", "\\'");
  }
}
