"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const dbml_1 = require("./dbml");
const types_1 = require("./types");
const zod_1 = require("zod");
const parse = (input) => {
    try {
        return types_1.Output.parse((0, dbml_1.parse)(input));
    }
    catch (e) {
        throw new SyntaxError(e);
    }
};
exports.parse = parse;
class SyntaxError extends Error {
    constructor(peggyErr) {
        if (peggyErr instanceof zod_1.ZodError) {
            console.debug(peggyErr);
            super("Zod Error");
        }
        else {
            super(`Could not parse input at line ${peggyErr.location.start.line}:${peggyErr.location.start.column}. ${peggyErr.message}`);
        }
        this.name = "SyntaxError";
    }
}
