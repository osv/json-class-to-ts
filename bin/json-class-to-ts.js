const compile = require('../dist/index').compile;
const DEFAULT_OPTIONS = require('../dist/index').DEFAULT_OPTIONS;

const optimist = require('optimist');

let command = optimist
  .usage(
    `Usage: json-class-to-ts

Build typescript interfaces from json

Examples:
  echo '{ "foo": 1}' | \\
json-class-to-ts.js -r bar --enableIsClassExports

  echo '{ "foo": 1, "@c": "Class1" }' | \\
json-class-to-ts.js -c @c -r bar --enableIsClassExports

  echo '{ "foo": 1, "bar": "some_value", "@c": "Class1" }' | \\
json-class-to-ts.js -c @c  --enumForceProperties foo,bar

  echo '[{"foo": "a"}, {"foo": "a"}]' | \\
bin/json-class-to-ts.js --enumMinNumUniqueString -2
`
  )
  .default('i', '-')
  .default('o', '-')
  .default('r', 'Api')
  .alias('i', 'file')
  .alias('o', 'out')
  .alias('h', 'help')
  .alias('r', 'root')
  .alias('c', 'className')
  .boolean('enableIsClassExports')
  .default('enumMaxInlineItems', DEFAULT_OPTIONS.enumMaxInlineItems)
  .default('enumMinNumUniqueString', DEFAULT_OPTIONS.enumMinNumUniqueString)
  .default('enumMaxNumUniqueString', DEFAULT_OPTIONS.enumMaxNumUniqueString)

  .describe('i', 'Input file. "-" - stdin')
  .describe('o', 'Output file name. "-" - stdout')
  .describe('c', 'Class name property')
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
  .describe('r', 'Root interface name');

const argv = command.argv;

if (argv.h) {
  command.showHelp();
  process.exit();
}

const inFile = argv.i;
const outFile = argv.o;
const rootInterface = argv.r;

let data = '';

if (inFile == '-') {
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
  const options = {};
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
  return options;
}
