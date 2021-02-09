const fs = require('fs');
const compile = require('../dist/index').compile;
const DEFAULT_OPTIONS = require('../dist/index').DEFAULT_OPTIONS;

const optimist = require('optimist');

let command = optimist
  .usage(
    `Usage: json-class-to-ts

Build typescript interfaces from json

Examples:
  echo '{ "foo": 1}' | \\
json-class-to-ts -r bar --enableIsClassExports

  echo '{ "foo": 1, "@c": "Class1" }' | \\
json-class-to-ts --className @c -r bar --enableIsClassExports

  echo '{ "foo": 1, "bar": "some_value", "@c": "Class1" }' | \\
json-class-to-ts --className @c  --enumForceProperties foo,bar

  echo '[{"foo": "a"}, {"foo": "a"}]' | \\
bin/json-class-to-ts --enumMinNumUniqueString -2

Examaple of config file (see -c param):
${JSON.stringify({ ...DEFAULT_OPTIONS, className: '@c' }, null, 2)}
`
  )
  .default('i', '-')
  .default('o', '-')
  .default('r', 'Api')
  .alias('i', 'file')
  .alias('o', 'out')
  .alias('h', 'help')
  .alias('r', 'root')
  .alias('c', 'config')
  .boolean('enableIsClassExports')
  .default('enumMaxInlineItems', DEFAULT_OPTIONS.enumMaxInlineItems)
  .default('enumMinNumUniqueString', DEFAULT_OPTIONS.enumMinNumUniqueString)
  .default('enumMaxNumUniqueString', DEFAULT_OPTIONS.enumMaxNumUniqueString)
  .describe('i', 'Input file. "-" - stdin')
  .describe('o', 'Output file name. "-" - stdout')
  .describe('className', 'Class name property')
  .describe('enableIsClassExports', 'Add export functions for class check')
  .describe('enumMaxInlineItems', 'Max inline enums (1 | 2 | 3)')
  .describe(
    'enumMinNumUniqueString',
    'Creates enum for property if num of unique items is greater'
  )
  .describe(
    'enumMaxNumUniqueString',
    'Disable creating enum for property if num of unique  items is greater'
  )
  .describe(
    'enumForceProperties',
    'List of properties where enum will be created and ignored enumMinNumUniqueString, enumMaxNumUniqueString'
  )
  .describe(
    'enumForbidProperties',
    'List of properties with disabled enum creation even if satisfied with enumMinNumUniqueString, enumMaxNumUniqueString'
  )
  .describe('r', 'Root interface name')
  .describe('c', 'Define options via JSON config file.\n');

const argv = command.argv;

if (argv.h) {
  helpAndDie();
}

const inFile = argv.i;
const outFile = argv.o;
const rootInterface = argv.r;
const configFile = argv.c;
let data = '';

if (inFile == '-') {
  if (process.stdin.isTTY) {
    helpAndDie();
  }
  let input = process.stdin;
  input.resume();
  input.setEncoding('utf8');
  input.on('data', (chunk) => (data += chunk));
  input.on('end', () => {
    processData(data);
  });
} else {
  processData(fs.readFileSync(inFile, 'utf8'));
}

function processData(text) {
  const json = JSON.parse(text);
  const formatted = compile(json, rootInterface, getOptions());
  if (outFile == '-') {
    console.log(formatted);
  } else {
    fs.writeFileSync(outFile, formatted, 'utf8');
  }
}

function getOptions() {
  let options = {};
  [
    'className',
    'enableIsClassExports',
    'enumMaxInlineItems',
    'enumMinNumUniqueString',
    'enumMaxNumUniqueString',
  ].forEach((p) => {
    if (!argv[p]) return;
    options[p] = argv[p];
  });

  ['enumForceProperties', 'enumForbidProperties'].forEach((p) => {
    if (!argv[p]) return;
    options[p] = ('' + argv[p]).split(',');
  });

  if (configFile) {
    const optionsFromFile = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    options = { ...options, ...optionsFromFile };
  }
  return options;
}

function helpAndDie() {
  command.showHelp();
  process.exit();
}
