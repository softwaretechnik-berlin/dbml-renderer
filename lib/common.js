"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableName = void 0;
const tableName = (table) => {
    return table.schema ? `${table.schema}.${table.name}` : table.name;
};
exports.tableName = tableName;
