#!/bin/bash

set -uex

cd "$(dirname "$0")"

npm run generate-parser
npm run build

npm version patch
git push
npm publish
