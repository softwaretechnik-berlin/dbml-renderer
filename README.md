[![npm version](https://badge.fury.io/js/%40softwaretechnik%2Fdbml-renderer.svg)](https://www.npmjs.com/package/@softwaretechnik/dbml-renderer)

`dbml-renderer` renders [dbml](https://www.dbml.org/home/) files to
svg images. It provides a command line interface, so that you can easily
use it in your documentation toolchain. 

## Command line usage

```bash
npm install -g @softwaretechnik/dbml-renderer
```

It can then be used to render dbml files like so:

```bash
dbml-renderer -i example.dbml -o output.svg
```

