"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = __importDefault(require("./api"));
var ava_1 = __importDefault(require("ava"));
var fs_1 = require("fs");
var path_1 = require("path");
var examplesDir = "examples";
var testOutputDir = ".test-output";
var formats = ["dot", "svg"];
fs_1.mkdirSync(testOutputDir, { recursive: true });
var dbmlFiles = fs_1.readdirSync(examplesDir)
    .filter(function (file) { return file.endsWith(".dbml"); })
    .filter(function (file) { return !file.startsWith("_"); })
    .map(function (dbmlFilename) { return [dbmlFilename, path_1.join(examplesDir, dbmlFilename)]; });
dbmlFiles.forEach(function (_a) {
    var dbmlFilename = _a[0], dbmlFile = _a[1];
    var input = fs_1.readFileSync(dbmlFile, "utf-8");
    var outputFile = function (format) {
        return path_1.join(testOutputDir, dbmlFilename + "." + format);
    };
    formats.forEach(function (format) {
        ava_1.default(dbmlFile + " can be converted to " + format, function (t) {
            var output = api_1.default(input, format);
            fs_1.writeFileSync(outputFile(format), output, "utf-8");
            t.pass();
        });
    });
    ava_1.default(dbmlFile + " dot output is consistent", function (t) {
        var expectedOutput = fs_1.readFileSync(dbmlFile + ".dot", "utf-8");
        var currentOutput = fs_1.readFileSync(outputFile("dot"), "utf-8");
        t.is(currentOutput, expectedOutput);
    });
});
