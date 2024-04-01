"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullName = void 0;
const fullName = (table) => {
    return table.schema ? `${table.schema}.${table.name}` : table.name;
};
exports.fullName = fullName;
