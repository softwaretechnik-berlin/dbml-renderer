#!/bin/bash

cd "$(dirname "$0")"

npm run generate-parser
npm run build

npm version patch

npm publish
