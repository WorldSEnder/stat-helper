/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 644:
/***/ ((module) => {

module.exports = JSON.parse('{"ENV_SOCKET_PATH":"STAT_HELPER_SOCKET","ENV_LOG_DEBUG":"STAT_HELPER_LOG_DEBUG"}');

/***/ }),

/***/ 242:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.main = void 0;
const child_process_1 = __nccwpck_require__(129);
const path_1 = __importDefault(__nccwpck_require__(622));
const fs_1 = __nccwpck_require__(747);
const util_1 = __nccwpck_require__(669);
const core = __importStar(__nccwpck_require__(519));
const constants_json_1 = __nccwpck_require__(644);
async function main() {
    var _a;
    core.debug(`stat-helper setup starting`);
    const err = await fs_1.promises.open(path_1.default.join(core.locations.tempDir, 'stat-helper-err.log'), 'a');
    const out = await fs_1.promises.open(path_1.default.join(core.locations.tempDir, 'stat-helper-out.log'), 'a');
    const daemonPath = core.locations.daemon;
    core.debug(`Launching daemon ${daemonPath}.`);
    const daemonProc = (0, child_process_1.fork)(daemonPath, [], {
        detached: true,
        stdio: ['ignore', out.fd, err.fd, 'ipc'],
        env: { ...process.env, [constants_json_1.ENV_LOG_DEBUG]: "true" },
    });
    const serverSocketPath = await (0, util_1.promisify)(f => {
        daemonProc.on('error', e => f(e, "<error>"));
        daemonProc.on('message', m => f(undefined, m));
    })();
    core.debug(`Daemon on ${serverSocketPath} launched successfully`);
    daemonProc.disconnect();
    (_a = daemonProc.channel) === null || _a === void 0 ? void 0 : _a.unref();
    core.exportVariable(constants_json_1.ENV_SOCKET_PATH, serverSocketPath);
    daemonProc.unref();
    await err.close();
    await out.close();
    core.locations.registerCli();
    core.debug(`stat-helper setup executed`);
}
exports.main = main;
if (require.main === require.cache[eval('__filename')]) {
    main().catch(e => {
        core.setFailed(e.message);
        throw e;
    });
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 645:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.integration = void 0;
const core = __importStar(__nccwpck_require__(186));
const path_1 = __importDefault(__nccwpck_require__(622));
exports.integration = {
    debug: core.debug,
    info: core.info,
    error: core.error,
    setFailed: core.setFailed,
    exportVariable: core.exportVariable,
    locations: {
        daemon: path_1.default.join(__dirname, "../daemon/index.js"),
        get tempDir() {
            const tmpDir = process.env['RUNNER_TEMP'];
            if (!tmpDir) {
                throw new Error(`expected RUNNER_TEMP to be defined`);
            }
            return tmpDir;
        },
        registerCli() {
            core.addPath(path_1.default.join(__dirname, ".."));
        },
    },
};
//# sourceMappingURL=github.js.map

/***/ }),

/***/ 519:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.locations = exports.exportVariable = exports.setFailed = exports.error = exports.info = exports.debug = void 0;
let integration;
if (process.env["CI"] == "true" && process.env["GITHUB_WORKFLOW"]) {
    const github = __nccwpck_require__(645);
    integration = github.integration;
}
else {
    const local = __nccwpck_require__(854);
    integration = local.integration;
}
const { debug, info, error, setFailed, exportVariable, locations, } = integration;
exports.debug = debug;
exports.info = info;
exports.error = error;
exports.setFailed = setFailed;
exports.exportVariable = exportVariable;
exports.locations = locations;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 854:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.integration = void 0;
const xdg_1 = __importDefault(__nccwpck_require__(147));
const constants_json_1 = __nccwpck_require__(644);
const path_1 = __importDefault(__nccwpck_require__(622));
const useDebugLog = ["1", "yes", "YES", "OK", "true", "TRUE"].indexOf(process.env[constants_json_1.ENV_LOG_DEBUG] || "") > 0;
const debugLog = useDebugLog
    ? (m) => console.info(m)
    : (_) => { };
exports.integration = {
    debug: debugLog,
    info: console.info,
    error: console.error,
    setFailed: err => {
        process.exitCode = 1;
        console.error(err);
    },
    exportVariable: (env, value) => console.info(`export ${env}=${value}`),
    locations: {
        daemon: path_1.default.join(__dirname, "../daemon.js"),
        get tempDir() {
            return (0, xdg_1.default)().runtime;
        },
        registerCli() { },
    },
};
//# sourceMappingURL=local.js.map

/***/ }),

/***/ 351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issue = exports.issueCommand = void 0;
const os = __importStar(__nccwpck_require__(87));
const utils_1 = __nccwpck_require__(278);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 186:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.notice = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
const command_1 = __nccwpck_require__(351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(278);
const os = __importStar(__nccwpck_require__(87));
const path = __importStar(__nccwpck_require__(622));
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    if (options && options.trimWhitespace === false) {
        return val;
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
function getMultilineInput(name, options) {
    const inputs = getInput(name, options)
        .split('\n')
        .filter(x => x !== '');
    return inputs;
}
exports.getMultilineInput = getMultilineInput;
/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   boolean
 */
function getBooleanInput(name, options) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    const val = getInput(name, options);
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}
exports.getBooleanInput = getBooleanInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    process.stdout.write(os.EOL);
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function error(message, properties = {}) {
    command_1.issueCommand('error', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds a warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function warning(message, properties = {}) {
    command_1.issueCommand('warning', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Adds a notice issue
 * @param message notice issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function notice(message, properties = {}) {
    command_1.issueCommand('notice', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.notice = notice;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 717:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


// For internal use, subject to change.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issueCommand = void 0;
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__nccwpck_require__(747));
const os = __importStar(__nccwpck_require__(87));
const utils_1 = __nccwpck_require__(278);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 278:
/***/ ((__unused_webpack_module, exports) => {


// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toCommandProperties = exports.toCommandValue = void 0;
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
/**
 *
 * @param annotationProperties
 * @returns The command properties to send with the actual annotation command
 * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
 */
function toCommandProperties(annotationProperties) {
    if (!Object.keys(annotationProperties).length) {
        return {};
    }
    return {
        title: annotationProperties.title,
        line: annotationProperties.startLine,
        endLine: annotationProperties.endLine,
        col: annotationProperties.startColumn,
        endColumn: annotationProperties.endColumn
    };
}
exports.toCommandProperties = toCommandProperties;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 147:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



const isWindows = process.platform === 'win32';
const os = __nccwpck_require__(87);
const path = __nccwpck_require__(622);
const join = path.join;
const expand = __nccwpck_require__(117);
const { homedir, load, resolve, split } = __nccwpck_require__(699);

/**
 * Get the XDG Base Directory paths for Linux, or equivalent paths for Windows or MaxOS.
 * @name xdg
 * @param {Object} `options`
 * @return {Object} Returns an object of paths for the current platform.
 * @api public
 */

const xdg = (options = {}) => {
  const platform = options.platform || (isWindows ? 'win32' : 'linux');
  const fn = xdg[platform];

  if (typeof fn !== 'function') {
    throw new Error(`Platform "${platform}" is not supported`);
  }

  return fn(options);
};

/**
 * Get XDG equivalent paths for MacOS. Used by the main export when `process.platform`
 * is `darwin`. Aliased as `xdg.macos()`.
 *
 * ```js
 * const dirs = xdg.darwin();
 * // or
 * const dirs = xdg.macos();
 * ```
 * @param {Object} `options`
 * @return {Object} Returns an object of paths.
 * @api public
 */

xdg.darwin = (options = {}) => {
  const env = options.env || process.env;
  const subdir = options.subdir || '';
  const resolve = options.resolve || xdg.resolve;

  const lib = () => join(home, 'Library');
  const app = () => join(lib(), 'Application Support');
  const caches = () => join(lib(), 'Caches');

  const temp = options.tempdir || os.tmpdir();
  const home = options.homedir || homedir('darwin');
  const data = resolve(env.XDG_DATA_HOME || app(), subdir);
  const config = resolve(env.XDG_CONFIG_HOME || app(), subdir);
  const cch = resolve(env.XDG_CACHE_HOME || caches(), subdir);
  const etc = '/etc/xdg';

  const dirs = {
    cache: cch,
    config,
    config_dirs: [config, ...split(env.XDG_CONFIG_DIRS || etc)],
    data,
    data_dirs: [data, ...split(env.XDG_DATA_DIRS || '/usr/local/share/:/usr/share/')],
    runtime: resolve(env.XDG_RUNTIME_DIR || temp, subdir),
    logs: join(cch, 'logs')
  };

  if (options.expanded === true) {
    return expand(dirs, options);
  }

  return dirs;
};

/**
 * Get XDG equivalent paths for Linux. Used by the main export when `process.platform`
 * is `linux`.
 *
 * ```js
 * const dirs = xdg.linux();
 * ```
 * @return {Object} Returns an object of paths.
 * @return {Object} Returns an object of paths.
 * @api public
 */

xdg.linux = (options = {}) => {
  const env = options.env || process.env;
  const subdir = options.subdir || '';
  const resolve = options.resolve || xdg.resolve;

  const cache = () => join(home, '.cache');
  const config = () => join(home, '.config');
  const share = () => join(home, '.local', 'share');

  const temp = options.tempdir || os.tmpdir();
  const home = options.homedir || homedir('linux');
  const data = resolve(env.XDG_DATA_HOME || share(), subdir);
  const cfg = resolve(env.XDG_CONFIG_HOME || config(), subdir);
  const cch = resolve(env.XDG_CACHE_HOME || cache(), subdir);
  const etc = '/etc/xdg';

  const dirs = {
    cache: cch,
    config: cfg,
    config_dirs: [cfg, ...split(env.XDG_CONFIG_DIRS || etc)],
    data,
    data_dirs: [data, ...split(env.XDG_DATA_DIRS || '/usr/local/share/:/usr/share/')],
    runtime: resolve(env.XDG_RUNTIME_DIR || temp, subdir),
    logs: join(cch, 'logs')
  };

  if (options.expanded === true) {
    return expand(dirs, options);
  }

  return dirs;
};

/**
 * Get XDG equivalent paths for MacOS. Used by the main export when `process.platform`
 * is `win32`. Aliased as `xdg.windows()`.
 *
 * ```js
 * const dirs = xdg.win32();
 * // or
 * const dirs = xdg.windows();
 * ```
 * @param {Object} `options`
 * @return {Object} Returns an object of paths.
 * @api public
 */

xdg.win32 = (options = {}) => {
  const env = options.env || process.env;
  const temp = options.tempdir || os.tmpdir();
  const home = options.homedir || homedir('win32');
  const subdir = options.subdir || '';
  const resolve = options.resolve || xdg.resolve;

  const {
    APPDATA = join(home, 'AppData', 'Roaming'),
    LOCALAPPDATA = join(home, 'AppData', 'Local'),

    // XDG Base Dir variables
    XDG_CACHE_HOME,
    XDG_CONFIG_DIRS,
    XDG_DATA_DIRS,
    XDG_RUNTIME_DIR
  } = env;

  const local = options.roaming === true ? APPDATA : LOCALAPPDATA;
  const data = resolve(env.XDG_DATA_HOME || local, subdir, 'Data');
  const appdata = env.XDG_CONFIG_HOME || APPDATA;
  const cache = resolve(XDG_CACHE_HOME || local, subdir, 'Cache');
  const config = resolve(appdata, subdir, 'Config');

  const dirs = {
    cache,
    config,
    config_dirs: [config, ...split(XDG_CONFIG_DIRS)],
    data,
    data_dirs: [data, ...split(XDG_DATA_DIRS)],
    runtime: resolve(XDG_RUNTIME_DIR || temp, subdir),
    logs: join(cache, 'logs')
  };

  if (options.expanded === true) {
    return expand(dirs, options);
  }

  return dirs;
};

/**
 * Convenience methods
 */

xdg.load = load;
xdg.resolve = resolve;
xdg.windows = xdg.win32;
xdg.macos = xdg.darwin;

/**
 * Expose "user dirs"
 */

xdg.userdirs = __nccwpck_require__(262);

/**
 * Expose "xdg"
 */

module.exports = xdg;


/***/ }),

/***/ 117:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



const os = __nccwpck_require__(87);
const fs = __nccwpck_require__(747);
const path = __nccwpck_require__(622);
const write = __nccwpck_require__(531);
const userdirs = __nccwpck_require__(262);
const { dir, homedir, read, resolve } = __nccwpck_require__(699);

const readfile = obj => (pathname, find = false) => {
  return read((obj.find && find) ? obj.find(pathname) : path.join(obj.home, pathname));
};

const writefile = dir => (pathname, ...args) => {
  return write(path.join(dir, pathname), ...args);
};

const find = dirs => (pathname, ...args) => {
  return dirs.map(dir => path.join(dir, pathname)).find(fp => fs.existsSync(fp));
};

const expand = (paths, options = {}) => {
  const cachedir = dir('cache', options);
  const configdir = dir('config', options);
  const datadir = dir('data', options);
  const runtimedir = dir('runtime', options);

  const dirs = {
    cwd: options.cwd ? path.resolve(options.cwd) : process.cwd(),
    home: dir('home', options) || homedir(options.platform || process.platform),
    temp: dir('temp', options) || os.tmpdir(),
    cache: {
      home: cachedir || paths.cache,
      logs: resolve(cachedir || paths.cache, 'logs')
    },
    config: {
      home: configdir || paths.config,
      dirs: [...new Set([configdir || paths.config, ...paths.config_dirs])]
    },
    data: {
      home: datadir || paths.data,
      dirs: [...new Set([datadir || paths.data, ...paths.data_dirs])]
    },
    runtime: {
      home: runtimedir || paths.runtime
    },
    userdirs: userdirs.expand(options)
  };

  for (const key of Object.keys(dirs)) {
    const data = dirs[key];

    if (data && typeof data !== 'string' && Array.isArray(data.dirs)) {
      data.find = find(data.dirs);
    }

    if (data && typeof data !== 'string' && data.home) {
      data.read = readfile(data);
      data.write = writefile(data.home);
    }
  }

  return dirs;
};

module.exports = expand;


/***/ }),

/***/ 262:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



const isWindows = process.platform === 'win32';
const path = __nccwpck_require__(622);
const utils = __nccwpck_require__(699);
const { homedir, load } = utils;

/**
 * Get the XDG User Directories for Linux, or equivalents for Windows or MaxOS.
 *
 * @name .userdirs()
 * @param {Object} `options`
 * @return {Object} Returns an object of directory paths.
 * @api public
 */

const userdirs = (options = {}) => {
  const platform = options.platform || (isWindows ? 'win32' : 'linux');
  const fn = userdirs[platform];

  if (typeof fn !== 'function') {
    throw new Error(`Platform "${platform}" is not supported`);
  }

  return fn(options);
};

/**
 * Returns an object to with paths to `user-dirs.*` files, as well as functions to
 * load each file.
 *
 * @name .userdirs.expand()
 * @param {Object} `options`
 * @param {Object} `paths` Optionally pass the paths from the `userdirs()` function to avoid creating them again.
 * @return {Object} Returns an object with a `paths` object, and `config`, `defaults`, `dirs`, and `create` functions for actually loading the user-dir files.
 * @api public
 */

userdirs.expand = (options = {}, paths = userdirs(options)) => {
  const home = userdirs.home(options);
  const resolve = filepath => path.join(home, filepath);

  const data = {
    paths,
    config: opts => userdirs.load(paths.conf, { ...options, ...opts }),
    defaults: opts => userdirs.load(paths.defaults, { ...options, ...opts }, resolve),
    dirs: opts => userdirs.load(paths.dirs, { ...options, ...opts }, resolve),
    create: opts => {
      const config = data.config(opts);

      if (config.enabled !== false) {
        return Object.assign(data.defaults(opts), data.dirs(opts));
      }

      return {};
    }
  };

  return data;
};

/**
 * Loads and parses the contents of `user-dirs.conf`, if one exists in user home.
 *
 * ```js
 * const config = userdirs.conf();
 * console.log(config);
 * //=> { enabled: true, filename_encoding: 'UTF-8' }
 * ```
 * @name .userdirs.conf()
 * @param {Object} `options`
 * @return {Object} Returns configur
 * @api public
 */

userdirs.conf = options => {
  const dirs = userdirs({ ...options, load: false });
  return userdirs.load(dirs.conf, options);
};

/**
 * Loads and parses the contents of `user-dirs.defaults`, if one exists in user home.
 *
 * ```js
 * const defaults = userdirs.defaults();
 * console.log(defaults);
 * ```
 * // Example results:
 * // {
 * //   XDG_DESKTOP_DIR: '/Users/jonschlinkert/Desktop',
 * //   XDG_DOWNLOAD_DIR: '/Users/jonschlinkert/Downloads',
 * //   XDG_TEMPLATES_DIR: '/Users/jonschlinkert/Templates',
 * //   XDG_PUBLICSHARE_DIR: '/Users/jonschlinkert/Public',
 * //   XDG_DOCUMENTS_DIR: '/Users/jonschlinkert/Documents',
 * //   XDG_MUSIC_DIR: '/Users/jonschlinkert/Music',
 * //   XDG_PICTURES_DIR: '/Users/jonschlinkert/Pictures',
 * //   XDG_VIDEOS_DIR: '/Users/jonschlinkert/Videos'
 * // }
 * @name .userdirs.defaults()
 * @param {Object} `options`
 * @return {Object} Returns an object of paths.
 * @api public
 */

userdirs.defaults = (options = {}) => {
  const home = userdirs.home(options);
  const dirs = userdirs({ ...options, load: false });
  const resolve = filepath => path.join(home, filepath);
  return userdirs.load(dirs.defaults, options, resolve);
};

/**
 * Loads and parses the contents of `user-dirs.dirs`, if one exists in user home.
 *
 * ```js
 * const dirs = userdirs.dirs();
 * console.log(dirs);
 * // Example results:
 * // {
 * //   XDG_MUSIC_DIR: '/Users/jonschlinkert/Documents/Music',
 * //   XDG_PICTURES_DIR: '/Users/jonschlinkert/Documents/Pictures',
 * //   XDG_TEMPLATES_DIR: '/Users/jonschlinkert/Documents/Templates',
 * //   XDG_VIDEOS_DIR: '/Users/jonschlinkert/Documents/Videos'
 * // }
 * ```
 * @name .userdirs.dirs()
 * @param {Object} `options`
 * @return {Object} Returns an object of paths.
 * @api public
 */

userdirs.dirs = (options = {}) => {
  const home = userdirs.home(options);
  const dirs = userdirs({ ...options, load: false });
  const resolve = filepath => path.join(home, filepath);
  return userdirs.load(dirs.dirs, options, resolve);
};

/**
 * Get the actual XDG User Directories to use for MacOS. Gets the `user-dirs.conf`,
 * `user-dirs.defaults`, and the `user-dirs.dirs` files and, if not disabled in
 * `user-dirs.conf`, merges the values in defaults and dirs to create the paths to use.
 *
 * ```js
 * const dirs = userdirs.create();
 * console.log(dirs);
 * // Example results:
 * // {
 * //   XDG_DESKTOP_DIR: '/Users/jonschlinkert/Desktop',
 * //   XDG_DOWNLOAD_DIR: '/Users/jonschlinkert/Downloads',
 * //   XDG_TEMPLATES_DIR: '/Users/jonschlinkert/Documents/Templates',
 * //   XDG_PUBLICSHARE_DIR: '/Users/jonschlinkert/Public',
 * //   XDG_DOCUMENTS_DIR: '/Users/jonschlinkert/Documents',
 * //   XDG_MUSIC_DIR: '/Users/jonschlinkert/Documents/Music',
 * //   XDG_PICTURES_DIR: '/Users/jonschlinkert/Documents/Pictures',
 * //   XDG_VIDEOS_DIR: '/Users/jonschlinkert/Documents/Videos'
 * // }
 * ```
 * @name .userdirs.create()
 * @param {Object} `options`
 * @return {Object} Returns an object of paths.
 * @api public
 */

userdirs.create = (...args) => userdirs.expand(...args).create();

/**
 * Get the XDG User Directories for MacOS. This method is used by the main function
 * when `process.platform` is `darwin`. Exposed as a method so you can call it directly
 * if necessary. Also aliased as `userdirs.macos()`.
 *
 * ```js
 * const { dirs, conf, defaults } = userdirs.darwin(); // or userdirs.macos();
 * ```
 * @name .userdirs.darwin()
 * @param {Object} `options`
 * @return {Object} Returns an object of paths.
 * @api public
 */

userdirs.darwin = (options = {}) => {
  const env = options.env || process.env;

  const etc = '/etc/xdg';
  const home = options.homedir || homedir('darwin');
  const lib = path.join(home, 'Library');
  const app = env.XDG_CONFIG_HOME || path.join(lib, 'Application Support');

  return {
    conf: env.XDG_USER_DIRS_CONF || path.join(etc, 'user-dirs.conf'),
    defaults: env.XDG_USER_DIRS_DEFAULTS || path.join(etc, 'user-dirs.defaults'),
    dirs: env.XDG_USER_DIRS || path.join(app, 'user-dirs.dirs')
  };
};

/**
 * Gets the XDG User Directories for Linux. Used by the main export when
 * `process.platform` is `linux`.
 *
 * ```js
 * const { dirs, conf, defaults } = userdirs.linux();
 * ```
 * @name .userdirs.linux()
 * @return {Object} Returns an object of paths.
 * @return {Object} Returns an object of paths.
 * @api public
 */

userdirs.linux = (options = {}) => {
  const env = options.env || process.env;
  const home = options.homedir || homedir('linux');
  const config = env.XDG_CONFIG_HOME || path.join(home, '.config');
  const etc = '/etc/xdg';

  return {
    conf: env.XDG_USER_DIRS_CONF || path.join(etc, 'user-dirs.conf'),
    defaults: env.XDG_USER_DIRS_DEFAULTS || path.join(etc, 'user-dirs.defaults'),
    dirs: env.XDG_USER_DIRS || path.join(config, 'user-dirs.dirs')
  };
};

/**
 * Gets the XDG User Directories for MacOS. Used by the `userdirs()` function when
 * `process.platform` is `win32`. Also aliased as `userdirs.windows()`.
 *
 * ```js
 * const { dirs, conf, defaults } = userdirs.win32(); // or userdirs.windows();
 * ```
 * @name .userdirs.win32()
 * @param {Object} `options`
 * @return {Object} Returns an object of paths.
 * @api public
 */

userdirs.win32 = (options = {}) => {
  const env = options.env || process.env;
  const home = options.homedir || homedir('win32');

  const { APPDATA = path.join(home, 'AppData', 'Roaming') } = env;
  const appdata = env.XDG_CONFIG_HOME || APPDATA;

  return {
    conf: env.XDG_USER_DIRS_CONF || path.join(home, 'user-dirs.conf'),
    defaults: env.XDG_USER_DIRS_DEFAULTS || path.join(home, 'user-dirs.defaults'),
    dirs: env.XDG_USER_DIRS || path.join(appdata, 'user-dirs.dirs')
  };
};

/**
 * Convenience methods
 */

userdirs.home = (options = {}) => {
  const platform = options.platform || (isWindows ? 'win32' : 'linux');
  return options.homedir || homedir(platform);
};
userdirs.load = load;
userdirs.windows = userdirs.win32;
userdirs.macos = userdirs.darwin;

/**
 * Expose "userdirs"
 */

module.exports = userdirs;


/***/ }),

/***/ 699:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



const os = __nccwpck_require__(87);
const fs = __nccwpck_require__(747);
const path = __nccwpck_require__(622);

const BOM_REGEX = /^\ufeff/;
const NEWLINE_REGEX = /[\r\n]+/;
const PROP_REGEX = /\s*=\s*/;
const XDG_DIR_REGEX = /^(?:XDG_)?(.+)(?:_DIR)?$/i;

const split = str => str ? str.split(path.delimiter) : [];
const title = str => str ? str[0].toUpperCase() + str.slice(1) : '';

const read = filepath => {
  if (filepath) {
    return fs.readFileSync(filepath, 'utf8').replace(BOM_REGEX, '');
  }
  return null;
};

const homedir = (platform = process.platform) => {
  return os.homedir() || (platform === 'win32' ? os.tmpdir() : '/usr/local/share');
};

const dir = (key, options = {}) => {
  const prop = options.envPrefix ? `${options.envPrefix}_${key}_dir` : null;
  const name = `${key}dir`;

  if (prop) {
    return process.env[prop.toUpperCase()] || process.env[prop.toLowerCase()] || options[name];
  }

  return options[name];
};

const resolve = (parentdir, ...args) => {
  if (args.length && /^[A-Z]/.test(path.basename(parentdir))) {
    return path.join(parentdir, ...args.map(v => title(v)));
  }
  if (args.length) {
    return path.join(parentdir, ...args.map(v => v.toLowerCase()));
  }
  return path.join(parentdir, 'xdg');
};

const load = (filepath, options = {}, resolve = fp => fp) => {
  const format = options.format !== false ? !filepath.endsWith('.conf') : false;
  const data = {};

  if (fs.existsSync(filepath)) {
    const contents = read(filepath);

    for (const line of contents.split(NEWLINE_REGEX)) {
      if (line.trim() !== '' && !line.startsWith('#')) {
        let [key, value] = line.split(PROP_REGEX);

        if (typeof options.onProperty === 'function') {
          const name = path.basename(filepath);
          ({ key, value } = options.onProperty(key, value, { name, path, format, resolve }));
        } else if (options.modify !== false) {
          key = format !== false ? formatKey(key) : key;
          value = resolve(formatValue(value));
        }

        data[key] = value;
      }
    }
  }

  return data;
};

const formatValue = input => {
  if (/^(['"]).*\1$/.test(input)) {
    return input.replace(/^(['"])(.*)\1$/, '$2');
  }
  if (/^(false|true)$/i.test(input)) {
    return input.toLowerCase() === 'true';
  }
  return input;
};

const unformatKey = input => {
  const match = XDG_DIR_REGEX.exec(input);
  return match[1].toLowerCase();
};

const formatKey = input => {
  return `XDG_${unformatKey(input).toUpperCase()}_DIR`;
};

module.exports = {
  dir,
  formatKey,
  formatValue,
  homedir,
  load,
  read,
  resolve,
  split,
  title,
  unformatKey
};


/***/ }),

/***/ 470:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



const fs = __nccwpck_require__(747);
const path = __nccwpck_require__(622);
const strip = __nccwpck_require__(877);
const ordinals = ['th', 'st', 'nd', 'rd'];

const ordinal = n => {
  if (isNaN(n)) {
    throw new TypeError('expected a number');
  }
  return ordinals[((n % 100) - 20) % 10] || ordinals[n % 100] || ordinals[0];
};

const toOrdinal = number => {
  return `${Number(number)}${ordinal(Math.abs(number))}`;
};

const format = {
  darwin(stem, n) {
    if (n === 1) return `${stem} copy`;
    if (n > 1) return `${stem} copy ${n}`;
    return stem;
  },
  default: (stem, n) => n > 1 ? `${stem} (${n})` : stem,
  win32: (stem, n) => n > 1 ? `${stem} (${n})` : stem,
  windows: (stem, n) => format.win32(stem, n),
  linux(stem, n) {
    if (n === 0) return stem;
    if (n === 1) return `${stem} (copy)`;
    if (n === 2) return `${stem} (another copy)`;
    return `${stem} (${toOrdinal(n)} copy)`;
  }
};

/**
 * The main export is a function that adds a trailing increment to
 * the `stem` (basename without extension) of the given file path or object.
 * ```js
 * console.log(increment('foo/bar.txt', { platform: 'darwin' }));
 * //=> foo/bar copy.txt
 * console.log(increment('foo/bar.txt', { platform: 'linux' }));
 * //=> foo/bar (copy).txt
 * console.log(increment('foo/bar.txt', { platform: 'win32' }));
 * //=> foo/bar (2).txt
 * ```
 * @name increment
 * @param {String|Object} `file` If the file is an object, it must have a `path` property.
 * @param {Object} `options` See [available options](#options).
 * @return {String|Object} Returns a file of the same type that was given, with an increment added to the file name.
 * @api public
 */

const increment = (...args) => {
  return typeof args[0] === 'string' ? increment.path(...args) : increment.file(...args);
};

/**
 * Add a trailing increment to the given `filepath`.
 *
 * ```js
 * console.log(increment.path('foo/bar.txt', { platform: 'darwin' }));
 * //=> foo/bar copy.txt
 * console.log(increment.path('foo/bar.txt', { platform: 'linux' }));
 * //=> foo/bar (copy).txt
 * console.log(increment.path('foo/bar.txt', { platform: 'win32' }));
 * //=> foo/bar (2).txt
 * ```
 * @name .path
 * @param {String} `filepath`
 * @param {Object} `options` See [available options](#options).
 * @return {String}
 * @api public
 */

increment.path = (filepath, options = {}) => {
  return path.format(increment.file(path.parse(filepath), options));
};

/**
 * Add a trailing increment to the `file.base` of the given file object.
 *
 * ```js
 * console.log(increment.file({ path: 'foo/bar.txt' }, { platform: 'darwin' }));
 * //=> { path: 'foo/bar copy.txt', base: 'bar copy.txt' }
 * console.log(increment.file({ path: 'foo/bar.txt' }, { platform: 'linux' }));
 * //=> { path: 'foo/bar (copy).txt', base: 'bar (copy).txt' }
 * console.log(increment.file({ path: 'foo/bar.txt' }, { platform: 'win32' }));
 * //=> { path: 'foo/bar (2).txt', base: 'bar (2).txt' }
 * ```
 * @name .file
 * @param {String|Object} `file` If passed as a string, the path will be parsed to create an object using `path.parse()`.
 * @param {Object} `options` See [available options](#options).
 * @return {Object} Returns an object.
 * @api public
 */

increment.file = (file, options = {}) => {
  if (typeof file === 'string') {
    let temp = file;
    file = path.parse(file);
    file.path = temp;
  }

  file = { ...file };

  if (file.path && Object.keys(file).length === 1) {
    let temp = file.path;
    file = path.parse(file.path);
    file.path = temp;
  }

  if (file.dirname && !file.dir) file.dir = file.dirname;
  if (file.basename && !file.base) file.base = file.basename;
  if (file.extname && !file.ext) file.ext = file.extname;
  if (file.stem && !file.name) file.name = file.stem;

  let { start = 1, platform = process.platform } = options;
  let fn = options.increment || format[platform] || format.default;

  if (start === 1 && (platform === 'win32' || platform === 'windows')) {
    if (!options.increment) {
      start++;
    }
  }

  if (options.strip === true) {
    file.name = strip.increment(file.name, options);
    file.dir = strip.increment(file.dir, options);
    file.base = file.name + file.ext;
  }

  if (options.fs === true) {
    let name = file.name;
    let dest = path.format(file);

    while (fs.existsSync(dest)) {
      file.base = fn(name, start++) + file.ext;
      dest = path.format(file);
    }
  } else {
    file.base = fn(file.name, start) + file.ext;
  }

  file.path = path.join(file.dir, file.base);
  return file;
};

/**
 * Returns an ordinal-suffix for the given number. This is used
 * when creating increments for files on Linux.
 *
 * ```js
 * const { ordinal } = require('add-filename-increment');
 * console.log(ordinal(1)); //=> 'st'
 * console.log(ordinal(2)); //=> 'nd'
 * console.log(ordinal(3)); //=> 'rd'
 * console.log(ordinal(110)); //=> 'th'
 * ```
 * @name .ordinal
 * @param {Number} `num`
 * @return {String}
 * @api public
 */

increment.ordinal = ordinal;

/**
 * Returns an ordinal for the given number.
 *
 * ```js
 * const { toOrdinal } = require('add-filename-increment');
 * console.log(toOrdinal(1)); //=> '1st'
 * console.log(toOrdinal(2)); //=> '2nd'
 * console.log(toOrdinal(3)); //=> '3rd'
 * console.log(toOrdinal(110)); //=> '110th'
 * ```
 * @name .toOrdinal
 * @param {Number} `num`
 * @return {String}
 * @api public
 */

increment.toOrdinal = toOrdinal;
module.exports = increment;


/***/ }),

/***/ 877:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/*!
 * file-name <https://github.com/jonschlinkert/file-name>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Licensed under the MIT License.
 */



const path = __nccwpck_require__(622);
const isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);

const constants = {
  REGEX_DARWIN: /( copy( [0-9]+)?)+$/i,
  REGEX_DEFAULT: /(( copy)?( \([0-9]+\)|[0-9]+)?)+$/i,
  REGEX_WIN32: /( \([0-9]+\))+$/i,
  REGEX_NON_STANDARD: /( \.\(incomplete\)| \([0-9]+\)|[- ]+)+$/i,
  REGEX_LINUX: /( \(((another|[0-9]+(th|st|nd|rd)) )?copy\))+$/i,
  REGEX_RAW_NUMBERS: '| [0-9]+',
  REGEX_SOURCE: ' \\((?:(another|[0-9]+(th|st|nd|rd)) )?copy\\)|copy( [0-9]+)?|\\.\\(incomplete\\)| \\([0-9]+\\)|[- ]+'
};

/**
 * Remove trailing increments from the `dirname` and/or `stem` (basename
 * without extension) of the given file path or object.
 *
 * @name strip
 * @param {Sring|Object} `file` If the file is an object, it must have a `path` property.
 * @param {Object} `options` See [available options](#options).
 * @return {String|Object} Returns the same type that was given.
 * @api public
 */

const strip = (file, options) => {
  if (!file) return file;
  if (isObject(file) && file.path) {
    return strip.file(file, options);
  }

  let filepath = strip.increment(file, options);
  let extname = path.extname(filepath);
  let dirname = strip.increment(path.dirname(filepath), options);
  let stem = strip.increment(path.basename(filepath, extname), options);
  return path.join(dirname, stem + extname);
};

/**
 * Removes trailing increments from the given string.
 *
 * ```js
 * console.log(strip.increment('foo (2)')); => 'foo'
 * console.log(strip.increment('foo (copy)')); => 'foo'
 * console.log(strip.increment('foo copy 2')); => 'foo'
 * ```
 * @name .increment
 * @param {String} `input`
 * @param {Object} `options` See [available options](#options).
 * @return {String}
 * @api public
 */

strip.increment = (input, options = {}) => {
  if (typeof input === 'string' && input !== '') {
    let suffix = options.removeRawNumbers === true ? constants.REGEX_RAW_NUMBERS : '';
    let source = constants.REGEX_SOURCE + suffix;
    return input.replace(new RegExp(`(${source})+$`, 'i'), '');
  }
  return input;
};

/**
 * Removes trailing increments and returns the `dirname` of the given `filepath`.
 *
 * ```js
 * console.log(strip.dirname('foo (2)/bar.txt')); => 'foo'
 * console.log(strip.dirname('foo (copy)/bar.txt')); => 'foo'
 * console.log(strip.dirname('foo copy 2/bar.txt')); => 'foo'
 * ```
 * @name .dirname
 * @param {String} `filepath`
 * @param {Object} `options` See [available options](#options).
 * @return {String} Returns the `dirname` of the filepath, without increments.
 * @api public
 */

strip.dirname = (filepath, options) => {
  return strip.increment(path.dirname(filepath), options);
};

/**
 * Removes trailing increments and returns the `stem` of the given `filepath`.
 *
 * ```js
 * console.log(strip.stem('foo/bar (2).txt')); //=> 'bar'
 * console.log(strip.stem('foo/bar (copy).txt')); //=> 'bar'
 * console.log(strip.stem('foo/bar copy 2.txt')); //=> 'bar'
 * console.log(strip.stem('foo/bar (2) copy.txt')); //=> 'bar'
 * console.log(strip.stem('foo/bar (2) - copy.txt')); //=> 'bar'
 * ```
 * @name .stem
 * @param {String} `filepath`
 * @param {Object} `options` See [available options](#options).
 * @return {String} Returns the `stem` of the filepath, without increments.
 * @api public
 */

strip.stem = (filepath, options) => {
  return strip.increment(path.basename(filepath, path.extname(filepath)), options);
};

/**
 * Removes trailing increments and returns the `basename` of the given `filepath`.
 *
 * ```js
 * console.log(strip.basename('foo/bar (2).txt')); //=> 'bar.txt'
 * console.log(strip.basename('foo/bar (copy).txt')); //=> 'bar.txt'
 * console.log(strip.basename('foo/bar copy 2.txt')); //=> 'bar.txt'
 * console.log(strip.basename('foo/bar (2) copy.txt')); //=> 'bar.txt'
 * console.log(strip.basename('foo/bar (2) - copy.txt')); //=> 'bar.txt'
 * ```
 * @name .basename
 * @param {String} `filepath`
 * @param {Object} `options` See [available options](#options).
 * @return {String} Returns the `basename` of the filepath, without increments.
 * @api public
 */

strip.basename = (filepath, options) => {
  let extname = path.extname(filepath);
  let stem = path.basename(filepath, extname);
  return strip.increment(stem, options) + extname;
};

/**
 * Removes trailing increments from the `dirname` and `stem` of the given `filepath`.
 *
 * ```js
 * console.log(strip.path('foo copy/bar (2).txt')); //=> 'foo/bar.txt'
 * console.log(strip.path('foo (2)/bar (copy).txt')); //=> 'foo/bar.txt'
 * console.log(strip.path('foo (2)/bar copy 2.txt')); //=> 'foo/bar.txt'
 * console.log(strip.path('foo copy/bar (2) copy.txt')); //=> 'foo/bar.txt'
 * console.log(strip.path('foo copy/bar (2) - copy.txt')); //=> 'foo/bar.txt'
 * ```
 * @name .path
 * @param {String} `filepath`
 * @param {Object} `options` See [available options](#options).
 * @return {String} Returns the `basename` of the filepath, without increments.
 * @api public
 */

strip.path = (filepath, options) => {
  let extname = path.extname(filepath);
  let stem = strip.increment(path.basename(filepath, extname), options);
  let dirname = strip.increment(path.dirname(filepath), options);
  return path.join(dirname, stem + extname);
};

/**
 * Removes trailing increments from the `dirname` and `stem` properties
 * of the given `file`.
 *
 * ```js
 * console.log(strip({ path: 'foo copy/bar (2).txt' }));
 * //=> { path: 'foo/bar.txt', dir: 'foo', base: 'bar.txt', name: 'bar', ext: '.txt' }
 * console.log(strip({ path: 'foo (2)/bar (copy).txt' }));
 * //=> { path: 'foo/bar.txt', dir: 'foo', base: 'bar.txt', name: 'bar', ext: '.txt' }
 * console.log(strip({ path: 'foo (2)/bar copy 2.txt' }));
 * //=> { path: 'foo/bar.txt', dir: 'foo', base: 'bar.txt', name: 'bar', ext: '.txt' }
 * console.log(strip({ path: 'foo copy/bar (2) copy.txt' }));
 * //=> { path: 'foo/bar.txt', dir: 'foo', base: 'bar.txt', name: 'bar', ext: '.txt' }
 * console.log(strip({ path: 'foo copy/bar (2) - copy.txt' }));
 * //=> { path: 'foo/bar.txt', dir: 'foo', base: 'bar.txt', name: 'bar', ext: '.txt' }
 * ```
 * @name .file
 * @param {String} `filepath`
 * @param {Object} `options` See [available options](#options).
 * @return {String} Returns the `basename` of the filepath, without increments.
 * @api public
 */

strip.file = (file, options = {}) => {
  if (!isObject(file)) return file;
  if (!file.path) return file;

  if (file.dirname && !file.dir) file.dir = file.dirname;
  if (file.basename && !file.base) file.base = file.basename;
  if (file.extname && !file.ext) file.ext = file.extname;
  if (file.stem && !file.name) file.name = file.stem;

  if (file.dir === void 0) file.dir = path.dirname(file.path);
  if (file.ext === void 0) file.ext = path.extname(file.path);
  if (file.base === void 0) file.base = path.basename(file.path);
  if (file.name === void 0) file.name = path.basename(file.path, file.ext);

  file.name = strip.increment(file.name, options);
  file.dir = strip.increment(file.dir, options);
  file.base = file.name + file.ext;

  file.path = path.join(file.dir, file.base);
  return file;
};

module.exports = strip;


/***/ }),

/***/ 531:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



const fs = __nccwpck_require__(747);
const path = __nccwpck_require__(622);
const increment = __nccwpck_require__(470);

/**
 * Asynchronously writes data to a file, replacing the file if it already
 * exists and creating any intermediate directories if they don't already
 * exist. Data can be a string or a buffer. Returns a promise if a callback
 * function is not passed.
 *
 * ```js
 * const write = require('write');
 *
 * // async/await
 * (async () => {
 *   await write('foo.txt', 'This is content...');
 * })();
 *
 * // promise
 * write('foo.txt', 'This is content...')
 *   .then(() => {
 *     // do stuff
 *   });
 *
 * // callback
 * write('foo.txt', 'This is content...', err => {
 *   // do stuff with err
 * });
 * ```
 * @name write
 * @param {String} `filepath` file path.
 * @param {String|Buffer|Uint8Array} `data` Data to write.
 * @param {Object} `options` Options to pass to [fs.writeFile][writefile]
 * @param {Function} `callback` (optional) If no callback is provided, a promise is returned.
 * @returns {Object} Returns an object with the `path` and `contents` of the file that was written to the file system. This is useful for debugging when `options.increment` is used and the path might have been modified.
 * @api public
 */

const write = (filepath, data, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  const opts = { encoding: 'utf8', ...options };
  const destpath = opts.increment ? incrementName(filepath, options) : filepath;
  const result = { path: destpath, data };

  if (opts.overwrite === false && exists(filepath, destpath)) {
    throw new Error('File already exists: ' + destpath);
  }

  const promise = mkdir(path.dirname(destpath), { recursive: true, ...options })
    .then(() => {
      return new Promise((resolve, reject) => {
        fs.createWriteStream(destpath, opts)
          .on('error', err => reject(err))
          .on('close', resolve)
          .end(ensureNewline(data, opts));
      });
    });

  if (typeof callback === 'function') {
    promise.then(() => callback(null, result)).catch(callback);
    return;
  }

  return promise.then(() => result);
};

/**
 * The synchronous version of [write](#write). Returns undefined.
 *
 * ```js
 * const write = require('write');
 * write.sync('foo.txt', 'This is content...');
 * ```
 * @name .sync
 * @param {String} `filepath` file path.
 * @param {String|Buffer|Uint8Array} `data` Data to write.
 * @param {Object} `options` Options to pass to [fs.writeFileSync][writefilesync]
 * @returns {Object} Returns an object with the `path` and `contents` of the file that was written to the file system. This is useful for debugging when `options.increment` is used and the path might have been modified.
 * @api public
 */

write.sync = (filepath, data, options) => {
  if (typeof filepath !== 'string') {
    throw new TypeError('expected filepath to be a string');
  }

  const opts = { encoding: 'utf8', ...options };
  const destpath = opts.increment ? incrementName(filepath, options) : filepath;

  if (opts.overwrite === false && exists(filepath, destpath)) {
    throw new Error('File already exists: ' + destpath);
  }

  mkdirSync(path.dirname(destpath), { recursive: true, ...options });
  fs.writeFileSync(destpath, ensureNewline(data, opts), opts);
  return { path: destpath, data };
};

/**
 * Returns a new [WriteStream][writestream] object. Uses `fs.createWriteStream`
 * to write data to a file, replacing the file if it already exists and creating
 * any intermediate directories if they don't already exist. Data can be a string
 * or a buffer.
 *
 * ```js
 * const fs = require('fs');
 * const write = require('write');
 * fs.createReadStream('README.md')
 *   .pipe(write.stream('a/b/c/other-file.md'))
 *   .on('close', () => {
 *     // do stuff
 *   });
 * ```
 * @name .stream
 * @param {String} `filepath` file path.
 * @param {Object} `options` Options to pass to [fs.createWriteStream][wsoptions]
 * @return {Stream} Returns a new [WriteStream][writestream] object. (See [Writable Stream][writable]).
 * @api public
 */

write.stream = (filepath, options) => {
  if (typeof filepath !== 'string') {
    throw new TypeError('expected filepath to be a string');
  }

  const opts = { encoding: 'utf8', ...options };
  const destpath = opts.increment ? incrementName(filepath, options) : filepath;

  if (opts.overwrite === false && exists(filepath, destpath)) {
    throw new Error('File already exists: ' + filepath);
  }

  mkdirSync(path.dirname(destpath), { recursive: true, ...options });
  return fs.createWriteStream(destpath, opts);
};

/**
 * Increment the filename if the file already exists and enabled by the user
 */

const incrementName = (destpath, options = {}) => {
  if (options.increment === true) options.increment = void 0;
  return increment(destpath, options);
};

/**
 * Ensure newline at EOF if defined on options
 */

const ensureNewline = (data, options) => {
  if (!options || options.newline !== true) return data;
  if (typeof data !== 'string' && !isBuffer(data)) {
    return data;
  }

  // Only call `.toString()` on the last character. This way,
  // if data is a buffer, we don't need to stringify the entire
  // buffer just to append a newline.
  if (String(data.slice(-1)) !== '\n') {
    if (typeof data === 'string') {
      return data + '\n';
    }
    return data.concat(Buffer.from('\n'));
  }

  return data;
};

// if filepath !== destpath, that means the user has enabled
// "increment", which has already checked the file system and
// renamed the file to avoid conflicts, so we don't need to
// check again.
const exists = (filepath, destpath) => {
  return filepath === destpath && fs.existsSync(filepath);
};

const mkdir = (dirname, options) => {
  return new Promise(resolve => fs.mkdir(dirname, options, () => resolve()));
};

const mkdirSync = (dirname, options) => {
  try {
    fs.mkdirSync(dirname, options);
  } catch (err) { /* do nothing */ }
};

const isBuffer = data => {
  if (data.constructor && typeof data.constructor.isBuffer === 'function') {
    return data.constructor.isBuffer(data);
  }
  return false;
};

/**
 * Expose `write`
 */

module.exports = write;


/***/ }),

/***/ 129:
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ 747:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 87:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 622:
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ 669:
/***/ ((module) => {

module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(242);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;