"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = __importDefault(require("./api"));
var ava_1 = __importDefault(require("ava"));
var fs_1 = require("fs");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var examplesDir = "examples";
var testOutputDir = ".test-output";
var formats = ["dot", "svg"];
(0, fs_1.mkdirSync)(testOutputDir, { recursive: true });
var dbmlFiles = (0, fs_1.readdirSync)(examplesDir)
    .filter(function (file) { return file.endsWith(".dbml"); })
    .filter(function (file) { return !file.startsWith("_"); })
    .map(function (dbmlFilename) { return [dbmlFilename, (0, path_1.join)(examplesDir, dbmlFilename)]; });
dbmlFiles.forEach(function (_a) {
    var dbmlFilename = _a[0], dbmlFile = _a[1];
    var input = (0, fs_1.readFileSync)(dbmlFile, "utf-8");
    var outputFile = function (format) {
        return (0, path_1.join)(testOutputDir, "".concat(dbmlFilename, ".").concat(format));
    };
    formats.forEach(function (format) {
        (0, ava_1.default)("".concat(dbmlFile, " can be converted to ").concat(format), function (t) {
            var output = (0, api_1.default)(input, format);
            (0, fs_1.writeFileSync)(outputFile(format), output, "utf-8");
            t.pass();
        });
    });
    (0, ava_1.default)("".concat(dbmlFile, " dot output is consistent"), function (t) { return __awaiter(void 0, void 0, void 0, function () {
        var expectedOutput, currentOutput, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    expectedOutput = (0, promises_1.readFile)("".concat(dbmlFile, ".dot"), "utf-8");
                    currentOutput = (0, promises_1.readFile)(outputFile("dot"), "utf-8");
                    return [4 /*yield*/, t.notThrowsAsync(expectedOutput)];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, t.notThrowsAsync(currentOutput)];
                case 2:
                    _d.sent();
                    _b = (_a = t).deepEqual;
                    return [4 /*yield*/, currentOutput];
                case 3:
                    _c = [_d.sent()];
                    return [4 /*yield*/, expectedOutput];
                case 4:
                    _b.apply(_a, _c.concat([_d.sent()]));
                    return [2 /*return*/];
            }
        });
    }); });
});
var comparisonPage = "\n  <style>\n    table {\n      width: 100%;\n    }\n    table, th, td {\n      border: 1px solid black;\n      border-collapse: collapse;\n    }\n    img {\n      width: 100%;\n      height: auto;\n    }\n  </style>\n" +
    dbmlFiles
        .map(function (_a) {
        var dbmlFilename = _a[0], dbmlFile = _a[1];
        return "<div>\n    <h2>".concat(dbmlFilename, "</h2>\n    <table>\n      <tr>\n        <th>Expected</th>\n        <th>Current</th>\n      </tr>\n      <tr>\n        <td><img src=\"").concat(dbmlFile, ".svg\" /></td>\n        <td><img src=\"").concat((0, path_1.join)(testOutputDir, dbmlFilename), ".svg\" /></td>\n      </tr>\n    </table>\n  </div>\n  ");
    })
        .join("\n");
(0, fs_1.writeFileSync)(".compare-test-output.html", comparisonPage, "utf-8");
