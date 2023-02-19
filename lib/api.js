"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const checker_1 = require("./checker");
const parser_1 = require("./parser");
const renderer_1 = require("./renderer");
const run = (input, format) => {
    return (0, renderer_1.render)((0, checker_1.check)((0, parser_1.parse)(input)), format);
};
exports.run = run;
