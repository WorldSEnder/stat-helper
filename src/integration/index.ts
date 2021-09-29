import type * as GITHUB from './github';
import type * as LOCAL from './local';
export interface Integration {
    debug(message: string): void;
    info(message: string): void;
    error(message: string): void;
    setFailed(message: string): void;
    exportVariable(env: string, value: string): void;
    readonly tempDir: string;
}

let integration: Integration;
if (process.env["CI"] == "true" && process.env["GITHUB_WORKFLOW"]) {
    const github: typeof GITHUB = require("./github");
    integration = github.integration;
} else {
    const local: typeof LOCAL = require("./local");
    integration = local.integration;
}

const {
    debug,
    info,
    error,
    setFailed,
    exportVariable,
    tempDir,
} = integration;
export { debug, info, error, setFailed, exportVariable, tempDir, };
