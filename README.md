[![npm version](https://img.shields.io/npm/v/@softwaretechnik/dbml-renderer)](https://www.npmjs.com/package/@softwaretechnik/dbml-renderer)

`dbml-renderer` renders [dbml](https://www.dbml.org/home/) files to svg images.
It provides a command line interface, so that you can easily use it in your
documentation toolchain.

## Command Line Usage

```bash
npm install -g @softwaretechnik/dbml-renderer
```

It can then be used to render dbml files like so:

```bash
dbml-renderer -i example.dbml -o output.svg
```

## Testing

The tests can be run with `npm test`. They use the examples available in the
`examples` directory. Each `.dbml` file is used as input to render each of the
available output formats.

The output of a test run is placed in `.test-output`. In case the renderer has
been modified, the test output can be visually inspected and, confirmed the
output is good, the expectations can be updated by copying them with the
following command:

```bash
cp .test-output/* examples/
```
