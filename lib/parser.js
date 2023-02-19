"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const dbml_1 = require("./dbml");
const types_1 = require("./types");
const parse = (input) => {
    return types_1.Output.parse((0, dbml_1.parse)(input));
};
exports.parse = parse;
