#! /usr/bin/env node
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 9644:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"ENV_SOCKET_PATH":"STAT_HELPER_SOCKET","ENV_LOG_DEBUG":"STAT_HELPER_LOG_DEBUG"}');

/***/ }),

/***/ 8835:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

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
const core = __importStar(__nccwpck_require__(1519));
const yargs_1 = __importDefault(__nccwpck_require__(4139));
const fs_1 = __importStar(__nccwpck_require__(5747));
const process_1 = __nccwpck_require__(1765);
const util_1 = __nccwpck_require__(1669);
const constants_json_1 = __nccwpck_require__(9644);
const _1 = __nccwpck_require__(8242);
const client_1 = __nccwpck_require__(6);
const measurement_1 = __nccwpck_require__(7730);
const validate_1 = __nccwpck_require__(5494);
const teardown_1 = __nccwpck_require__(8748);
async function wrapCommand(f) {
    const [client, handle] = await (0, client_1.connectEnv)();
    await f(client)
        .finally(async () => {
        await handle.close();
    });
}
const seriesValidator = (0, validate_1.compile)({
    kind: "array",
    element: { kind: "guard", check: measurement_1.datapointValidator },
});
async function decode(mode, contents) {
    switch (mode) {
        case "json": {
            const decoded = JSON.parse(contents);
            if (!seriesValidator(decoded)) {
                throw new Error("Malformed input data, expected an array of measurements");
            }
            return decoded;
        }
    }
}
async function main() {
    core.debug(`stat-helper-cli starting`);
    const YARGS = yargs_1.default
        .command('add', "Add measurements", yargs => {
        return yargs.option('format', {
            describe: 'The format of the provided input data',
            choices: ['json'],
            default: 'json',
        }).option('input', {
            describe: 'Input of the measurements',
            normalize: true,
            requiresArg: true,
            type: "string",
        });
    }, addArgs => wrapCommand(async (client) => {
        let format = addArgs.format;
        const contents = await (0, util_1.promisify)(fs_1.default.readFile)(addArgs.input || process_1.stdin.fd, 'utf-8');
        const datapoints = await decode(format, contents);
        for (const d of datapoints) {
            await client.add(d);
        }
    }))
        .command('daemon', "Start the stat-helper daemon", yargs => {
        return yargs.option('ignore-existing', {
            describe: 'Start a daemon even if one already exists',
            boolean: true,
            default: false,
        });
    }, async (daemonArgs) => {
        const envSocket = process.env[constants_json_1.ENV_SOCKET_PATH];
        const hasStarted = envSocket && await fs_1.promises.access(envSocket).then(_ => true, _ => false);
        if (!daemonArgs['ignore-existing'] && hasStarted) {
            core.error(`Daemon already running`);
            return;
        }
        await (0, _1.main)();
    })
        .command('teardown', "Stop the daemon and print results", yargs => yargs, async (_) => {
        await (0, teardown_1.main)();
    })
        .command('$0', "", yargs => yargs, _ => { YARGS.showHelp(); })
        .help()
        .recommendCommands()
        .fail(false)
        .demandCommand(0, 1);
    await YARGS.parseAsync();
    core.debug(`stat-helper-cli executed`);
}
if (require.main === require.cache[eval('__filename')]) {
    main().catch(e => {
        core.setFailed(e.message);
        throw e;
    });
}
//# sourceMappingURL=cli.js.map

/***/ }),

/***/ 6:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.connectEnv = exports.connect = void 0;
const net_1 = __importDefault(__nccwpck_require__(1631));
const util_1 = __nccwpck_require__(1669);
const impl_1 = __nccwpck_require__(4792);
const validate_1 = __nccwpck_require__(5494);
const constants_json_1 = __nccwpck_require__(9644);
async function connect(socketPath) {
    const socket = net_1.default.createConnection(socketPath);
    const connection = (0, impl_1.connectServer)(socket, {
        add: {
            returnValidator: (0, validate_1.compile)({
                kind: "any",
            })
        },
        printReport: {
            returnValidator: (0, validate_1.compile)({
                kind: "string",
            })
        },
        shutdown: {
            returnValidator: (0, validate_1.compile)({
                kind: "any",
            })
        }
    });
    await (0, util_1.promisify)(res => {
        socket.on('ready', () => res(undefined, undefined));
        socket.on('error', err => res(err, undefined));
    })();
    return connection;
}
exports.connect = connect;
async function connectEnv() {
    const SOCKET_PATH = process.env[constants_json_1.ENV_SOCKET_PATH];
    if (!SOCKET_PATH) {
        throw Error(`${constants_json_1.ENV_SOCKET_PATH} has not been set to tell stat-helper-cli which server to connect to`);
    }
    return connect(SOCKET_PATH);
}
exports.connectEnv = connectEnv;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 8242:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

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
const child_process_1 = __nccwpck_require__(3129);
const path_1 = __importDefault(__nccwpck_require__(5622));
const fs_1 = __nccwpck_require__(5747);
const util_1 = __nccwpck_require__(1669);
const core = __importStar(__nccwpck_require__(1519));
const constants_json_1 = __nccwpck_require__(9644);
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
if (false) {}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 645:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

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
const core = __importStar(__nccwpck_require__(2186));
const path_1 = __importDefault(__nccwpck_require__(5622));
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

/***/ 1519:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.locations = exports.exportVariable = exports.setFailed = exports.error = exports.info = exports.debug = void 0;
let integration;
if (process.env["CI"] == "true" && process.env["GITHUB_WORKFLOW"]) {
    const github = __nccwpck_require__(645);
    integration = github.integration;
}
else {
    const local = __nccwpck_require__(1854);
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

/***/ 1854:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.integration = void 0;
const xdg_1 = __importDefault(__nccwpck_require__(7147));
const constants_json_1 = __nccwpck_require__(9644);
const path_1 = __importDefault(__nccwpck_require__(5622));
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

/***/ 7730:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.datapointValidator = exports.formatMeasurement = exports.FORMATTERS = void 0;
const validate_1 = __nccwpck_require__(5494);
;
function genericFormatter(measure) {
    return `${measure.value}${measure.unit}`;
}
exports.FORMATTERS = {
    ["B"]: genericFormatter,
    ["s"]: genericFormatter,
    ["ms"]: genericFormatter,
    ["ops/s"]: genericFormatter,
    ["ops/ms"]: genericFormatter,
    ["s/ops"]: genericFormatter,
    ["ms/ops"]: genericFormatter,
};
function formatMeasurement(m) {
    switch (m.unit) {
        case "B": return exports.FORMATTERS["B"]({ ...m, unit: "B" });
        case "s": return exports.FORMATTERS["s"]({ ...m, unit: "s" });
        case "ms": return exports.FORMATTERS["ms"]({ ...m, unit: "ms" });
        case "ops/s": return exports.FORMATTERS["ops/s"]({ ...m, unit: "ops/s" });
        case "ops/ms": return exports.FORMATTERS["ops/ms"]({ ...m, unit: "ops/ms" });
        case "s/ops": return exports.FORMATTERS["s/ops"]({ ...m, unit: "s/ops" });
        case "ms/ops": return exports.FORMATTERS["ms/ops"]({ ...m, unit: "ms/ops" });
    }
}
exports.formatMeasurement = formatMeasurement;
exports.datapointValidator = (0, validate_1.compile)({
    kind: "all-of",
    types: [{
            kind: "object",
            properties: {
                id: { required: true, kind: "string" },
            },
        }, {
            kind: "one-of",
            types: [{
                    kind: "object",
                    properties: {
                        kind: { required: true, kind: "exact", value: "scalar", },
                        unit: {
                            required: true,
                            kind: "one-of",
                            types: [
                                { kind: "exact", value: "B" },
                                { kind: "exact", value: "s" },
                                { kind: "exact", value: "ms" },
                                { kind: "exact", value: "ops/s" },
                                { kind: "exact", value: "ops/ms" },
                                { kind: "exact", value: "s/ops" },
                                { kind: "exact", value: "ms/ops" },
                            ],
                        },
                        value: { required: true, kind: "number" },
                    }
                }]
        }]
});
//# sourceMappingURL=measurement.js.map

/***/ }),

/***/ 4792:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.connectServer = exports.bindService = void 0;
const core = __importStar(__nccwpck_require__(1519));
const util_1 = __nccwpck_require__(1669);
const validate_1 = __nccwpck_require__(5494);
const validateRPC = (0, validate_1.compile)({
    kind: 'object',
    properties: {
        type: { required: true, kind: 'exact', value: "remote-procedure-call" },
        callid: { required: true, kind: 'number' },
        proc: { required: true, kind: 'string' },
        args: { required: true, kind: 'any' },
    }
});
const validateRPA = (0, validate_1.compile)({
    kind: 'object',
    properties: {
        type: { required: true, kind: 'exact', value: "remote-procedure-return" },
        callid: { required: true, kind: 'number' },
        details: {
            required: true,
            kind: "one-of",
            types: [{
                    kind: 'object',
                    properties: {
                        status: {
                            required: true,
                            kind: 'one-of',
                            types: [
                                { kind: "exact", value: "error-unknown-proc" },
                                { kind: "exact", value: "error-invalid-args" },
                                { kind: "exact", value: "error-server-error" },
                            ]
                        },
                        error: { required: true, kind: 'string' },
                    }
                }, {
                    kind: 'object',
                    properties: {
                        status: { required: true, kind: 'exact', value: "success" },
                        response: { kind: 'any' },
                    }
                }]
        }
    }
});
function handleConnection(impl, socket) {
    core.debug('Client connected.');
    const clientState = {
        activeCalls: 0,
        closeRequested: undefined,
    };
    const sendResponse = (resp) => {
        const encoded = JSON.stringify(resp);
        socket.write(encoded);
    };
    const recvCall = (buffer) => {
        const data = buffer.toString();
        const call = JSON.parse(data);
        return validateRPC(call) ? call : undefined;
    };
    async function wrapCall(procName, callid, serverImpl, args) {
        const { validators, run } = serverImpl;
        if (!validators(args)) {
            sendResponse({
                type: "remote-procedure-return",
                callid,
                details: {
                    status: "error-invalid-args",
                    error: `invalid arguments for the procedure ${procName}`
                }
            });
            return;
        }
        try {
            const result = await run(...args);
            sendResponse({
                type: "remote-procedure-return",
                callid,
                details: {
                    status: "success",
                    response: result,
                }
            });
        }
        catch (e) {
            sendResponse({
                type: "remote-procedure-return",
                callid,
                details: {
                    status: "error-server-error",
                    error: `server error: ${e}`,
                }
            });
        }
    }
    const onData = async (buffer) => {
        if (clientState.closeRequested) {
            return;
        }
        core.debug(`Message from client: ${buffer}`);
        const call = recvCall(buffer);
        if (!call) {
            return;
        }
        const { proc, callid, args } = call;
        if (!(proc in impl)) {
            sendResponse({
                type: "remote-procedure-return",
                callid,
                details: {
                    status: "error-unknown-proc",
                    error: `unknown procedure: ${proc}`
                }
            });
        }
        let procName = proc;
        await wrapCall(procName, callid, impl[procName], args);
    };
    socket.on('data', buffer => {
        clientState.activeCalls += 1;
        onData(buffer).finally(() => {
            clientState.activeCalls -= 1;
            if (clientState.closeRequested && clientState.activeCalls == 0) {
                clientState.closeRequested.trigger();
            }
        });
    });
    return {
        close() {
            let triggerPlace = {};
            const future = new Promise(trigger => { triggerPlace.trigger = trigger; });
            const { trigger } = triggerPlace;
            clientState.closeRequested = clientState.closeRequested || {
                trigger, future,
            };
            return future;
        }
    };
}
function bindService(server, impl) {
    const CONNECTIONS = {};
    let next_client = 0;
    async function cleanup() {
        core.debug("Terminating.");
        for (const client of Object.keys(CONNECTIONS)) {
            CONNECTIONS[client].close();
        }
        if (server.listening) {
            server.close();
        }
    }
    server.on('connection', socket => {
        const handle = handleConnection(impl, socket);
        var self = next_client;
        next_client++;
        CONNECTIONS[self] = handle;
        socket.on('close', () => {
            core.debug('Client disconnected.');
            delete CONNECTIONS[self];
        });
    });
    server.on('close', cleanup);
    const futureShutdown = (0, util_1.promisify)(f => server.on('close', () => f(undefined, undefined)))();
    return {
        async close() {
            await cleanup();
        },
        async waitForShutdown() {
            await futureShutdown;
        },
    };
}
exports.bindService = bindService;
function connectServer(socket, impl) {
    let nextId = 0;
    const waitingForResponse = {};
    const cleanup = async () => {
        for (const k in waitingForResponse) {
            const waitHandle = waitingForResponse[k];
            delete waitingForResponse[k];
            waitHandle({
                status: "error-server-error",
                error: "server shutdown",
            });
        }
    };
    const sendCall = (call) => {
        const encoded = JSON.stringify(call);
        socket.write(encoded);
    };
    const recvResponse = (buffer) => {
        const data = buffer.toString();
        const response = JSON.parse(data);
        return validateRPA(response) ? response : undefined;
    };
    socket.on('data', buffer => {
        core.debug(`Message from server: ${buffer}`);
        const response = recvResponse(buffer);
        if (!response) {
            return;
        }
        const { callid, details } = response;
        const waitHandle = waitingForResponse[callid];
        delete waitingForResponse[callid];
        waitHandle(details);
    });
    socket.on('error', e => core.debug(`error: ${e.message}`));
    socket.on('close', cleanup);
    function wrap(procName, clientImpl) {
        const handleResponse = async (response) => {
            if (response.status === "success") {
                const { returnValidator } = clientImpl;
                if (!returnValidator(response.response)) {
                    throw new Error(`invalid return value from server`);
                }
                return response.response;
            }
            throw new Error(response.error);
        };
        return async (...args) => {
            const callid = nextId;
            nextId++;
            const result = new Promise((resolve, reject) => {
                waitingForResponse[callid] = resp => handleResponse(resp).then(resolve, reject);
            });
            sendCall({
                type: "remote-procedure-call",
                callid,
                proc: procName,
                args,
            });
            return result;
        };
    }
    let proxy = {};
    for (const proc in impl) {
        proxy[proc] = wrap(proc, impl[proc]);
    }
    const clientHandle = {
        async close() {
            await cleanup();
            socket.end();
        },
    };
    return [proxy, clientHandle];
}
exports.connectServer = connectServer;
//# sourceMappingURL=impl.js.map

/***/ }),

/***/ 5494:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.compile = void 0;
const MARKER = Symbol();
function compileNull(_) {
    return function validateNull(o) {
        return o === null;
    };
}
function compileString(_) {
    return function validateString(o) {
        return typeof o === "string";
    };
}
function compileNumber(_) {
    return function validateNumber(o) {
        return typeof o === "number";
    };
}
function compileArray(s) {
    const validateElement = compile(s.element);
    return function validateArray(o) {
        if (o instanceof Array) {
            const valid = o.every((v) => validateElement(v));
            return valid;
        }
        return false;
    };
}
function compileAny(_) {
    return function validateAny(_t) {
        return true;
    };
}
function compileOneOf(s) {
    const validators = s.types.map(t => compile(t));
    return function validateOneOf(t) {
        const valid = validators.some(v => v(t));
        return valid;
    };
}
function compileAllOf(s) {
    const validators = s.types.map(t => compile(t));
    return function validateOneOf(t) {
        const valid = validators.every(v => v(t));
        return valid;
    };
}
function compileExact(s) {
    const value = s.value;
    return function validateExact(t) {
        const valid = t === value;
        return valid;
    };
}
function compileGuard(s) {
    const check = s.check;
    return check;
}
function compileTuple(s) {
    const validators = s.types.map(v => compile(v));
    return function validateTuple(t) {
        if (!(t instanceof Array)) {
            return false;
        }
        if (t.length !== validators.length) {
            return false;
        }
        for (let i = 0; i < validators.length; i++) {
            const validate = validators[i];
            const value = t[i];
            if (!validate(value)) {
                return false;
            }
        }
        return true;
    };
}
function compileObject(s) {
    const validators = {};
    function compileProperty(prop, propSchema) {
        const { required } = propSchema;
        const propertyValidator = compile(propSchema);
        if (required) {
            function validateRequiredProperty(t) {
                const valid = prop in t && propertyValidator(t[prop]);
                return valid;
            }
            return validateRequiredProperty;
        }
        else {
            function validateOptionalProperty(t) {
                const valid = !(prop in t) || propertyValidator(t[prop]);
                return valid;
            }
            return validateOptionalProperty;
        }
    }
    const properties = s.properties;
    for (const k in properties) {
        validators[k] = compileProperty(k, properties[k]);
    }
    const propertyValidator = Object.entries(validators).map(([_, v]) => v);
    return function validateObject(t) {
        const valid = typeof t === 'object' && propertyValidator.every(v => v(t));
        return valid;
    };
}
function compile(s) {
    switch (s.kind) {
        case 'any': return compileAny(s);
        case 'null': return compileNull(s);
        case 'string': return compileString(s);
        case 'number': return compileNumber(s);
        case 'array': return compileArray(s);
        case 'tuple': return compileTuple(s);
        case 'one-of': return compileOneOf(s);
        case 'all-of': return compileAllOf(s);
        case 'exact': return compileExact(s);
        case 'guard': return compileGuard(s);
        case 'object': return compileObject(s);
    }
}
exports.compile = compile;
//# sourceMappingURL=validate.js.map

/***/ }),

/***/ 8748:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.main = void 0;
const core = __importStar(__nccwpck_require__(1519));
const client_1 = __nccwpck_require__(6);
async function main() {
    core.debug(`stat-helper teardown starting`);
    const [client, handle] = await (0, client_1.connectEnv)();
    const report = await client.printReport();
    core.info(`${report}`);
    await client.shutdown();
    await handle.close();
    core.debug(`stat-helper teardown done`);
}
exports.main = main;
if (false) {}
//# sourceMappingURL=teardown.js.map

/***/ }),

/***/ 7351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

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
const os = __importStar(__nccwpck_require__(2087));
const utils_1 = __nccwpck_require__(5278);
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

/***/ 2186:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

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
const command_1 = __nccwpck_require__(7351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(5278);
const os = __importStar(__nccwpck_require__(2087));
const path = __importStar(__nccwpck_require__(5622));
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

"use strict";

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
const fs = __importStar(__nccwpck_require__(5747));
const os = __importStar(__nccwpck_require__(2087));
const utils_1 = __nccwpck_require__(5278);
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

/***/ 5278:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

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

/***/ 7147:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const isWindows = process.platform === 'win32';
const os = __nccwpck_require__(2087);
const path = __nccwpck_require__(5622);
const join = path.join;
const expand = __nccwpck_require__(117);
const { homedir, load, resolve, split } = __nccwpck_require__(4699);

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

xdg.userdirs = __nccwpck_require__(2262);

/**
 * Expose "xdg"
 */

module.exports = xdg;


/***/ }),

/***/ 117:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const os = __nccwpck_require__(2087);
const fs = __nccwpck_require__(5747);
const path = __nccwpck_require__(5622);
const write = __nccwpck_require__(3531);
const userdirs = __nccwpck_require__(2262);
const { dir, homedir, read, resolve } = __nccwpck_require__(4699);

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

/***/ 2262:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const isWindows = process.platform === 'win32';
const path = __nccwpck_require__(5622);
const utils = __nccwpck_require__(4699);
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

/***/ 4699:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const os = __nccwpck_require__(2087);
const fs = __nccwpck_require__(5747);
const path = __nccwpck_require__(5622);

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

/***/ 7470:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const fs = __nccwpck_require__(5747);
const path = __nccwpck_require__(5622);
const strip = __nccwpck_require__(4877);
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

/***/ 5063:
/***/ ((module) => {

"use strict";


module.exports = ({onlyFirst = false} = {}) => {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
};


/***/ }),

/***/ 2068:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";
/* module decorator */ module = __nccwpck_require__.nmd(module);


const wrapAnsi16 = (fn, offset) => (...args) => {
	const code = fn(...args);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => (...args) => {
	const code = fn(...args);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => (...args) => {
	const rgb = fn(...args);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

const ansi2ansi = n => n;
const rgb2rgb = (r, g, b) => [r, g, b];

const setLazyProperty = (object, property, get) => {
	Object.defineProperty(object, property, {
		get: () => {
			const value = get();

			Object.defineProperty(object, property, {
				value,
				enumerable: true,
				configurable: true
			});

			return value;
		},
		enumerable: true,
		configurable: true
	});
};

/** @type {typeof import('color-convert')} */
let colorConvert;
const makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
	if (colorConvert === undefined) {
		colorConvert = __nccwpck_require__(6931);
	}

	const offset = isBackground ? 10 : 0;
	const styles = {};

	for (const [sourceSpace, suite] of Object.entries(colorConvert)) {
		const name = sourceSpace === 'ansi16' ? 'ansi' : sourceSpace;
		if (sourceSpace === targetSpace) {
			styles[name] = wrap(identity, offset);
		} else if (typeof suite === 'object') {
			styles[name] = wrap(suite[targetSpace], offset);
		}
	}

	return styles;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],

			// Bright color
			blackBright: [90, 39],
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Alias bright black as gray (and grey)
	styles.color.gray = styles.color.blackBright;
	styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
	styles.color.grey = styles.color.blackBright;
	styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;

	for (const [groupName, group] of Object.entries(styles)) {
		for (const [styleName, style] of Object.entries(group)) {
			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	}

	Object.defineProperty(styles, 'codes', {
		value: codes,
		enumerable: false
	});

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	setLazyProperty(styles.color, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, false));
	setLazyProperty(styles.color, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, false));
	setLazyProperty(styles.color, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, false));
	setLazyProperty(styles.bgColor, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, true));
	setLazyProperty(styles.bgColor, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, true));
	setLazyProperty(styles.bgColor, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, true));

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});


/***/ }),

/***/ 7391:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/* MIT license */
/* eslint-disable no-mixed-operators */
const cssKeywords = __nccwpck_require__(8510);

// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

const reverseKeywords = {};
for (const key of Object.keys(cssKeywords)) {
	reverseKeywords[cssKeywords[key]] = key;
}

const convert = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

module.exports = convert;

// Hide .channels and .labels properties
for (const model of Object.keys(convert)) {
	if (!('channels' in convert[model])) {
		throw new Error('missing channels property: ' + model);
	}

	if (!('labels' in convert[model])) {
		throw new Error('missing channel labels property: ' + model);
	}

	if (convert[model].labels.length !== convert[model].channels) {
		throw new Error('channel and label counts mismatch: ' + model);
	}

	const {channels, labels} = convert[model];
	delete convert[model].channels;
	delete convert[model].labels;
	Object.defineProperty(convert[model], 'channels', {value: channels});
	Object.defineProperty(convert[model], 'labels', {value: labels});
}

convert.rgb.hsl = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const min = Math.min(r, g, b);
	const max = Math.max(r, g, b);
	const delta = max - min;
	let h;
	let s;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	const l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	let rdif;
	let gdif;
	let bdif;
	let h;
	let s;

	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const v = Math.max(r, g, b);
	const diff = v - Math.min(r, g, b);
	const diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = 0;
		s = 0;
	} else {
		s = diff / v;
		rdif = diffc(r);
		gdif = diffc(g);
		bdif = diffc(b);

		if (r === v) {
			h = bdif - gdif;
		} else if (g === v) {
			h = (1 / 3) + rdif - bdif;
		} else if (b === v) {
			h = (2 / 3) + gdif - rdif;
		}

		if (h < 0) {
			h += 1;
		} else if (h > 1) {
			h -= 1;
		}
	}

	return [
		h * 360,
		s * 100,
		v * 100
	];
};

convert.rgb.hwb = function (rgb) {
	const r = rgb[0];
	const g = rgb[1];
	let b = rgb[2];
	const h = convert.rgb.hsl(rgb)[0];
	const w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;

	const k = Math.min(1 - r, 1 - g, 1 - b);
	const c = (1 - r - k) / (1 - k) || 0;
	const m = (1 - g - k) / (1 - k) || 0;
	const y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

function comparativeDistance(x, y) {
	/*
		See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
	*/
	return (
		((x[0] - y[0]) ** 2) +
		((x[1] - y[1]) ** 2) +
		((x[2] - y[2]) ** 2)
	);
}

convert.rgb.keyword = function (rgb) {
	const reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	let currentClosestDistance = Infinity;
	let currentClosestKeyword;

	for (const keyword of Object.keys(cssKeywords)) {
		const value = cssKeywords[keyword];

		// Compute comparative distance
		const distance = comparativeDistance(rgb, value);

		// Check if its less, if so set as closest
		if (distance < currentClosestDistance) {
			currentClosestDistance = distance;
			currentClosestKeyword = keyword;
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return cssKeywords[keyword];
};

convert.rgb.xyz = function (rgb) {
	let r = rgb[0] / 255;
	let g = rgb[1] / 255;
	let b = rgb[2] / 255;

	// Assume sRGB
	r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92);
	g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92);
	b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92);

	const x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	const y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	const z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	const xyz = convert.rgb.xyz(rgb);
	let x = xyz[0];
	let y = xyz[1];
	let z = xyz[2];

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

	const l = (116 * y) - 16;
	const a = 500 * (x - y);
	const b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	const h = hsl[0] / 360;
	const s = hsl[1] / 100;
	const l = hsl[2] / 100;
	let t2;
	let t3;
	let val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	const t1 = 2 * l - t2;

	const rgb = [0, 0, 0];
	for (let i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}

		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	const h = hsl[0];
	let s = hsl[1] / 100;
	let l = hsl[2] / 100;
	let smin = s;
	const lmin = Math.max(l, 0.01);

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	const v = (l + s) / 2;
	const sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	const h = hsv[0] / 60;
	const s = hsv[1] / 100;
	let v = hsv[2] / 100;
	const hi = Math.floor(h) % 6;

	const f = h - Math.floor(h);
	const p = 255 * v * (1 - s);
	const q = 255 * v * (1 - (s * f));
	const t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	const h = hsv[0];
	const s = hsv[1] / 100;
	const v = hsv[2] / 100;
	const vmin = Math.max(v, 0.01);
	let sl;
	let l;

	l = (2 - s) * v;
	const lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	const h = hwb[0] / 360;
	let wh = hwb[1] / 100;
	let bl = hwb[2] / 100;
	const ratio = wh + bl;
	let f;

	// Wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	const i = Math.floor(6 * h);
	const v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	const n = wh + f * (v - wh); // Linear interpolation

	let r;
	let g;
	let b;
	/* eslint-disable max-statements-per-line,no-multi-spaces */
	switch (i) {
		default:
		case 6:
		case 0: r = v;  g = n;  b = wh; break;
		case 1: r = n;  g = v;  b = wh; break;
		case 2: r = wh; g = v;  b = n; break;
		case 3: r = wh; g = n;  b = v; break;
		case 4: r = n;  g = wh; b = v; break;
		case 5: r = v;  g = wh; b = n; break;
	}
	/* eslint-enable max-statements-per-line,no-multi-spaces */

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	const c = cmyk[0] / 100;
	const m = cmyk[1] / 100;
	const y = cmyk[2] / 100;
	const k = cmyk[3] / 100;

	const r = 1 - Math.min(1, c * (1 - k) + k);
	const g = 1 - Math.min(1, m * (1 - k) + k);
	const b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	const x = xyz[0] / 100;
	const y = xyz[1] / 100;
	const z = xyz[2] / 100;
	let r;
	let g;
	let b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// Assume sRGB
	r = r > 0.0031308
		? ((1.055 * (r ** (1.0 / 2.4))) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * (g ** (1.0 / 2.4))) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * (b ** (1.0 / 2.4))) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	let x = xyz[0];
	let y = xyz[1];
	let z = xyz[2];

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

	const l = (116 * y) - 16;
	const a = 500 * (x - y);
	const b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	const l = lab[0];
	const a = lab[1];
	const b = lab[2];
	let x;
	let y;
	let z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	const y2 = y ** 3;
	const x2 = x ** 3;
	const z2 = z ** 3;
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	const l = lab[0];
	const a = lab[1];
	const b = lab[2];
	let h;

	const hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	const c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	const l = lch[0];
	const c = lch[1];
	const h = lch[2];

	const hr = h / 360 * 2 * Math.PI;
	const a = c * Math.cos(hr);
	const b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args, saturation = null) {
	const [r, g, b] = args;
	let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation; // Hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	let ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// Optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	const r = args[0];
	const g = args[1];
	const b = args[2];

	// We use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	const ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	let color = args % 10;

	// Handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	const mult = (~~(args > 50) + 1) * 0.5;
	const r = ((color & 1) * mult) * 255;
	const g = (((color >> 1) & 1) * mult) * 255;
	const b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// Handle greyscale
	if (args >= 232) {
		const c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	let rem;
	const r = Math.floor(args / 36) / 5 * 255;
	const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	const b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	const integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	const string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	let colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(char => {
			return char + char;
		}).join('');
	}

	const integer = parseInt(colorString, 16);
	const r = (integer >> 16) & 0xFF;
	const g = (integer >> 8) & 0xFF;
	const b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const max = Math.max(Math.max(r, g), b);
	const min = Math.min(Math.min(r, g), b);
	const chroma = (max - min);
	let grayscale;
	let hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	const s = hsl[1] / 100;
	const l = hsl[2] / 100;

	const c = l < 0.5 ? (2.0 * s * l) : (2.0 * s * (1.0 - l));

	let f = 0;
	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	const s = hsv[1] / 100;
	const v = hsv[2] / 100;

	const c = s * v;
	let f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	const h = hcg[0] / 360;
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	const pure = [0, 0, 0];
	const hi = (h % 1) * 6;
	const v = hi % 1;
	const w = 1 - v;
	let mg = 0;

	/* eslint-disable max-statements-per-line */
	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}
	/* eslint-enable max-statements-per-line */

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	const v = c + g * (1.0 - c);
	let f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	const l = g * (1.0 - c) + 0.5 * c;
	let s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;
	const v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	const w = hwb[1] / 100;
	const b = hwb[2] / 100;
	const v = 1 - b;
	const c = v - w;
	let g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hsv = convert.gray.hsl;

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	const val = Math.round(gray[0] / 100 * 255) & 0xFF;
	const integer = (val << 16) + (val << 8) + val;

	const string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};


/***/ }),

/***/ 6931:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const conversions = __nccwpck_require__(7391);
const route = __nccwpck_require__(880);

const convert = {};

const models = Object.keys(conversions);

function wrapRaw(fn) {
	const wrappedFn = function (...args) {
		const arg0 = args[0];
		if (arg0 === undefined || arg0 === null) {
			return arg0;
		}

		if (arg0.length > 1) {
			args = arg0;
		}

		return fn(args);
	};

	// Preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	const wrappedFn = function (...args) {
		const arg0 = args[0];

		if (arg0 === undefined || arg0 === null) {
			return arg0;
		}

		if (arg0.length > 1) {
			args = arg0;
		}

		const result = fn(args);

		// We're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (let len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// Preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(fromModel => {
	convert[fromModel] = {};

	Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

	const routes = route(fromModel);
	const routeModels = Object.keys(routes);

	routeModels.forEach(toModel => {
		const fn = routes[toModel];

		convert[fromModel][toModel] = wrapRounded(fn);
		convert[fromModel][toModel].raw = wrapRaw(fn);
	});
});

module.exports = convert;


/***/ }),

/***/ 880:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const conversions = __nccwpck_require__(7391);

/*
	This function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	const graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	const models = Object.keys(conversions);

	for (let len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	const graph = buildGraph();
	const queue = [fromModel]; // Unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		const current = queue.pop();
		const adjacents = Object.keys(conversions[current]);

		for (let len = adjacents.length, i = 0; i < len; i++) {
			const adjacent = adjacents[i];
			const node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	const path = [graph[toModel].parent, toModel];
	let fn = conversions[graph[toModel].parent][toModel];

	let cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

module.exports = function (fromModel) {
	const graph = deriveBFS(fromModel);
	const conversion = {};

	const models = Object.keys(graph);
	for (let len = models.length, i = 0; i < len; i++) {
		const toModel = models[i];
		const node = graph[toModel];

		if (node.parent === null) {
			// No possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};



/***/ }),

/***/ 8510:
/***/ ((module) => {

"use strict";


module.exports = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};


/***/ }),

/***/ 8212:
/***/ ((module) => {

"use strict";


module.exports = function () {
  // https://mths.be/emoji
  return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
};


/***/ }),

/***/ 2644:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const { dirname, resolve } = __nccwpck_require__(5622);
const { readdirSync, statSync } = __nccwpck_require__(5747);

module.exports = function (start, callback) {
	let dir = resolve('.', start);
	let tmp, stats = statSync(dir);

	if (!stats.isDirectory()) {
		dir = dirname(dir);
	}

	while (true) {
		tmp = callback(dir, readdirSync(dir));
		if (tmp) return resolve(dir, tmp);
		dir = dirname(tmp = dir);
		if (tmp === dir) break;
	}
}


/***/ }),

/***/ 351:
/***/ ((module) => {

"use strict";

// Call this function in a another function to find out the file from
// which that function was called from. (Inspects the v8 stack trace)
//
// Inspired by http://stackoverflow.com/questions/13227489
module.exports = function getCallerFile(position) {
    if (position === void 0) { position = 2; }
    if (position >= Error.stackTraceLimit) {
        throw new TypeError('getCallerFile(position) requires position be less then Error.stackTraceLimit but position was: `' + position + '` and Error.stackTraceLimit was: `' + Error.stackTraceLimit + '`');
    }
    var oldPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) { return stack; };
    var stack = new Error().stack;
    Error.prepareStackTrace = oldPrepareStackTrace;
    if (stack !== null && typeof stack === 'object') {
        // stack[0] holds this file
        // stack[1] holds where this function was called
        // stack[2] holds the file we're interested in
        return stack[position] ? stack[position].getFileName() : undefined;
    }
};
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 4882:
/***/ ((module) => {

"use strict";
/* eslint-disable yoda */


const isFullwidthCodePoint = codePoint => {
	if (Number.isNaN(codePoint)) {
		return false;
	}

	// Code points are derived from:
	// http://www.unix.org/Public/UNIDATA/EastAsianWidth.txt
	if (
		codePoint >= 0x1100 && (
			codePoint <= 0x115F || // Hangul Jamo
			codePoint === 0x2329 || // LEFT-POINTING ANGLE BRACKET
			codePoint === 0x232A || // RIGHT-POINTING ANGLE BRACKET
			// CJK Radicals Supplement .. Enclosed CJK Letters and Months
			(0x2E80 <= codePoint && codePoint <= 0x3247 && codePoint !== 0x303F) ||
			// Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
			(0x3250 <= codePoint && codePoint <= 0x4DBF) ||
			// CJK Unified Ideographs .. Yi Radicals
			(0x4E00 <= codePoint && codePoint <= 0xA4C6) ||
			// Hangul Jamo Extended-A
			(0xA960 <= codePoint && codePoint <= 0xA97C) ||
			// Hangul Syllables
			(0xAC00 <= codePoint && codePoint <= 0xD7A3) ||
			// CJK Compatibility Ideographs
			(0xF900 <= codePoint && codePoint <= 0xFAFF) ||
			// Vertical Forms
			(0xFE10 <= codePoint && codePoint <= 0xFE19) ||
			// CJK Compatibility Forms .. Small Form Variants
			(0xFE30 <= codePoint && codePoint <= 0xFE6B) ||
			// Halfwidth and Fullwidth Forms
			(0xFF01 <= codePoint && codePoint <= 0xFF60) ||
			(0xFFE0 <= codePoint && codePoint <= 0xFFE6) ||
			// Kana Supplement
			(0x1B000 <= codePoint && codePoint <= 0x1B001) ||
			// Enclosed Ideographic Supplement
			(0x1F200 <= codePoint && codePoint <= 0x1F251) ||
			// CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
			(0x20000 <= codePoint && codePoint <= 0x3FFFD)
		)
	) {
		return true;
	}

	return false;
};

module.exports = isFullwidthCodePoint;
module.exports.default = isFullwidthCodePoint;


/***/ }),

/***/ 9200:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var fs = __nccwpck_require__(5747),
  join = __nccwpck_require__(5622).join,
  resolve = __nccwpck_require__(5622).resolve,
  dirname = __nccwpck_require__(5622).dirname,
  defaultOptions = {
    extensions: ['js', 'json', 'coffee'],
    recurse: true,
    rename: function (name) {
      return name;
    },
    visit: function (obj) {
      return obj;
    }
  };

function checkFileInclusion(path, filename, options) {
  return (
    // verify file has valid extension
    (new RegExp('\\.(' + options.extensions.join('|') + ')$', 'i').test(filename)) &&

    // if options.include is a RegExp, evaluate it and make sure the path passes
    !(options.include && options.include instanceof RegExp && !options.include.test(path)) &&

    // if options.include is a function, evaluate it and make sure the path passes
    !(options.include && typeof options.include === 'function' && !options.include(path, filename)) &&

    // if options.exclude is a RegExp, evaluate it and make sure the path doesn't pass
    !(options.exclude && options.exclude instanceof RegExp && options.exclude.test(path)) &&

    // if options.exclude is a function, evaluate it and make sure the path doesn't pass
    !(options.exclude && typeof options.exclude === 'function' && options.exclude(path, filename))
  );
}

function requireDirectory(m, path, options) {
  var retval = {};

  // path is optional
  if (path && !options && typeof path !== 'string') {
    options = path;
    path = null;
  }

  // default options
  options = options || {};
  for (var prop in defaultOptions) {
    if (typeof options[prop] === 'undefined') {
      options[prop] = defaultOptions[prop];
    }
  }

  // if no path was passed in, assume the equivelant of __dirname from caller
  // otherwise, resolve path relative to the equivalent of __dirname
  path = !path ? dirname(m.filename) : resolve(dirname(m.filename), path);

  // get the path of each file in specified directory, append to current tree node, recurse
  fs.readdirSync(path).forEach(function (filename) {
    var joined = join(path, filename),
      files,
      key,
      obj;

    if (fs.statSync(joined).isDirectory() && options.recurse) {
      // this node is a directory; recurse
      files = requireDirectory(m, joined, options);
      // exclude empty directories
      if (Object.keys(files).length) {
        retval[options.rename(filename, joined, filename)] = files;
      }
    } else {
      if (joined !== m.filename && checkFileInclusion(joined, filename, options)) {
        // hash node key shouldn't include file extension
        key = filename.substring(0, filename.lastIndexOf('.'));
        obj = m.require(joined);
        retval[options.rename(key, joined, filename)] = options.visit(obj, joined, filename) || obj;
      }
    }
  });

  return retval;
}

module.exports = requireDirectory;
module.exports.defaults = defaultOptions;


/***/ }),

/***/ 2577:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const stripAnsi = __nccwpck_require__(5591);
const isFullwidthCodePoint = __nccwpck_require__(4882);
const emojiRegex = __nccwpck_require__(8212);

const stringWidth = string => {
	if (typeof string !== 'string' || string.length === 0) {
		return 0;
	}

	string = stripAnsi(string);

	if (string.length === 0) {
		return 0;
	}

	string = string.replace(emojiRegex(), '  ');

	let width = 0;

	for (let i = 0; i < string.length; i++) {
		const code = string.codePointAt(i);

		// Ignore control characters
		if (code <= 0x1F || (code >= 0x7F && code <= 0x9F)) {
			continue;
		}

		// Ignore combining characters
		if (code >= 0x300 && code <= 0x36F) {
			continue;
		}

		// Surrogates
		if (code > 0xFFFF) {
			i++;
		}

		width += isFullwidthCodePoint(code) ? 2 : 1;
	}

	return width;
};

module.exports = stringWidth;
// TODO: remove this in the next major version
module.exports.default = stringWidth;


/***/ }),

/***/ 5591:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const ansiRegex = __nccwpck_require__(5063);

module.exports = string => typeof string === 'string' ? string.replace(ansiRegex(), '') : string;


/***/ }),

/***/ 4877:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";
/*!
 * file-name <https://github.com/jonschlinkert/file-name>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Licensed under the MIT License.
 */



const path = __nccwpck_require__(5622);
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

/***/ 9824:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const stringWidth = __nccwpck_require__(2577);
const stripAnsi = __nccwpck_require__(5591);
const ansiStyles = __nccwpck_require__(2068);

const ESCAPES = new Set([
	'\u001B',
	'\u009B'
]);

const END_CODE = 39;

const ANSI_ESCAPE_BELL = '\u0007';
const ANSI_CSI = '[';
const ANSI_OSC = ']';
const ANSI_SGR_TERMINATOR = 'm';
const ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;

const wrapAnsi = code => `${ESCAPES.values().next().value}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
const wrapAnsiHyperlink = uri => `${ESCAPES.values().next().value}${ANSI_ESCAPE_LINK}${uri}${ANSI_ESCAPE_BELL}`;

// Calculate the length of words split on ' ', ignoring
// the extra characters added by ansi escape codes
const wordLengths = string => string.split(' ').map(character => stringWidth(character));

// Wrap a long word across multiple rows
// Ansi escape codes do not count towards length
const wrapWord = (rows, word, columns) => {
	const characters = [...word];

	let isInsideEscape = false;
	let isInsideLinkEscape = false;
	let visible = stringWidth(stripAnsi(rows[rows.length - 1]));

	for (const [index, character] of characters.entries()) {
		const characterLength = stringWidth(character);

		if (visible + characterLength <= columns) {
			rows[rows.length - 1] += character;
		} else {
			rows.push(character);
			visible = 0;
		}

		if (ESCAPES.has(character)) {
			isInsideEscape = true;
			isInsideLinkEscape = characters.slice(index + 1).join('').startsWith(ANSI_ESCAPE_LINK);
		}

		if (isInsideEscape) {
			if (isInsideLinkEscape) {
				if (character === ANSI_ESCAPE_BELL) {
					isInsideEscape = false;
					isInsideLinkEscape = false;
				}
			} else if (character === ANSI_SGR_TERMINATOR) {
				isInsideEscape = false;
			}

			continue;
		}

		visible += characterLength;

		if (visible === columns && index < characters.length - 1) {
			rows.push('');
			visible = 0;
		}
	}

	// It's possible that the last row we copy over is only
	// ansi escape characters, handle this edge-case
	if (!visible && rows[rows.length - 1].length > 0 && rows.length > 1) {
		rows[rows.length - 2] += rows.pop();
	}
};

// Trims spaces from a string ignoring invisible sequences
const stringVisibleTrimSpacesRight = string => {
	const words = string.split(' ');
	let last = words.length;

	while (last > 0) {
		if (stringWidth(words[last - 1]) > 0) {
			break;
		}

		last--;
	}

	if (last === words.length) {
		return string;
	}

	return words.slice(0, last).join(' ') + words.slice(last).join('');
};

// The wrap-ansi module can be invoked in either 'hard' or 'soft' wrap mode
//
// 'hard' will never allow a string to take up more than columns characters
//
// 'soft' allows long words to expand past the column length
const exec = (string, columns, options = {}) => {
	if (options.trim !== false && string.trim() === '') {
		return '';
	}

	let returnValue = '';
	let escapeCode;
	let escapeUrl;

	const lengths = wordLengths(string);
	let rows = [''];

	for (const [index, word] of string.split(' ').entries()) {
		if (options.trim !== false) {
			rows[rows.length - 1] = rows[rows.length - 1].trimStart();
		}

		let rowLength = stringWidth(rows[rows.length - 1]);

		if (index !== 0) {
			if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
				// If we start with a new word but the current row length equals the length of the columns, add a new row
				rows.push('');
				rowLength = 0;
			}

			if (rowLength > 0 || options.trim === false) {
				rows[rows.length - 1] += ' ';
				rowLength++;
			}
		}

		// In 'hard' wrap mode, the length of a line is never allowed to extend past 'columns'
		if (options.hard && lengths[index] > columns) {
			const remainingColumns = (columns - rowLength);
			const breaksStartingThisLine = 1 + Math.floor((lengths[index] - remainingColumns - 1) / columns);
			const breaksStartingNextLine = Math.floor((lengths[index] - 1) / columns);
			if (breaksStartingNextLine < breaksStartingThisLine) {
				rows.push('');
			}

			wrapWord(rows, word, columns);
			continue;
		}

		if (rowLength + lengths[index] > columns && rowLength > 0 && lengths[index] > 0) {
			if (options.wordWrap === false && rowLength < columns) {
				wrapWord(rows, word, columns);
				continue;
			}

			rows.push('');
		}

		if (rowLength + lengths[index] > columns && options.wordWrap === false) {
			wrapWord(rows, word, columns);
			continue;
		}

		rows[rows.length - 1] += word;
	}

	if (options.trim !== false) {
		rows = rows.map(stringVisibleTrimSpacesRight);
	}

	const pre = [...rows.join('\n')];

	for (const [index, character] of pre.entries()) {
		returnValue += character;

		if (ESCAPES.has(character)) {
			const {groups} = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`).exec(pre.slice(index).join('')) || {groups: {}};
			if (groups.code !== undefined) {
				const code = Number.parseFloat(groups.code);
				escapeCode = code === END_CODE ? undefined : code;
			} else if (groups.uri !== undefined) {
				escapeUrl = groups.uri.length === 0 ? undefined : groups.uri;
			}
		}

		const code = ansiStyles.codes.get(Number(escapeCode));

		if (pre[index + 1] === '\n') {
			if (escapeUrl) {
				returnValue += wrapAnsiHyperlink('');
			}

			if (escapeCode && code) {
				returnValue += wrapAnsi(code);
			}
		} else if (character === '\n') {
			if (escapeCode && code) {
				returnValue += wrapAnsi(escapeCode);
			}

			if (escapeUrl) {
				returnValue += wrapAnsiHyperlink(escapeUrl);
			}
		}
	}

	return returnValue;
};

// For each newline, invoke the method separately
module.exports = (string, columns, options) => {
	return String(string)
		.normalize()
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map(line => exec(line, columns, options))
		.join('\n');
};


/***/ }),

/***/ 3531:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const fs = __nccwpck_require__(5747);
const path = __nccwpck_require__(5622);
const increment = __nccwpck_require__(7470);

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

/***/ 6702:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const align = {
    right: alignRight,
    center: alignCenter
};
const top = 0;
const right = 1;
const bottom = 2;
const left = 3;
class UI {
    constructor(opts) {
        var _a;
        this.width = opts.width;
        this.wrap = (_a = opts.wrap) !== null && _a !== void 0 ? _a : true;
        this.rows = [];
    }
    span(...args) {
        const cols = this.div(...args);
        cols.span = true;
    }
    resetOutput() {
        this.rows = [];
    }
    div(...args) {
        if (args.length === 0) {
            this.div('');
        }
        if (this.wrap && this.shouldApplyLayoutDSL(...args) && typeof args[0] === 'string') {
            return this.applyLayoutDSL(args[0]);
        }
        const cols = args.map(arg => {
            if (typeof arg === 'string') {
                return this.colFromString(arg);
            }
            return arg;
        });
        this.rows.push(cols);
        return cols;
    }
    shouldApplyLayoutDSL(...args) {
        return args.length === 1 && typeof args[0] === 'string' &&
            /[\t\n]/.test(args[0]);
    }
    applyLayoutDSL(str) {
        const rows = str.split('\n').map(row => row.split('\t'));
        let leftColumnWidth = 0;
        // simple heuristic for layout, make sure the
        // second column lines up along the left-hand.
        // don't allow the first column to take up more
        // than 50% of the screen.
        rows.forEach(columns => {
            if (columns.length > 1 && mixin.stringWidth(columns[0]) > leftColumnWidth) {
                leftColumnWidth = Math.min(Math.floor(this.width * 0.5), mixin.stringWidth(columns[0]));
            }
        });
        // generate a table:
        //  replacing ' ' with padding calculations.
        //  using the algorithmically generated width.
        rows.forEach(columns => {
            this.div(...columns.map((r, i) => {
                return {
                    text: r.trim(),
                    padding: this.measurePadding(r),
                    width: (i === 0 && columns.length > 1) ? leftColumnWidth : undefined
                };
            }));
        });
        return this.rows[this.rows.length - 1];
    }
    colFromString(text) {
        return {
            text,
            padding: this.measurePadding(text)
        };
    }
    measurePadding(str) {
        // measure padding without ansi escape codes
        const noAnsi = mixin.stripAnsi(str);
        return [0, noAnsi.match(/\s*$/)[0].length, 0, noAnsi.match(/^\s*/)[0].length];
    }
    toString() {
        const lines = [];
        this.rows.forEach(row => {
            this.rowToString(row, lines);
        });
        // don't display any lines with the
        // hidden flag set.
        return lines
            .filter(line => !line.hidden)
            .map(line => line.text)
            .join('\n');
    }
    rowToString(row, lines) {
        this.rasterize(row).forEach((rrow, r) => {
            let str = '';
            rrow.forEach((col, c) => {
                const { width } = row[c]; // the width with padding.
                const wrapWidth = this.negatePadding(row[c]); // the width without padding.
                let ts = col; // temporary string used during alignment/padding.
                if (wrapWidth > mixin.stringWidth(col)) {
                    ts += ' '.repeat(wrapWidth - mixin.stringWidth(col));
                }
                // align the string within its column.
                if (row[c].align && row[c].align !== 'left' && this.wrap) {
                    const fn = align[row[c].align];
                    ts = fn(ts, wrapWidth);
                    if (mixin.stringWidth(ts) < wrapWidth) {
                        ts += ' '.repeat((width || 0) - mixin.stringWidth(ts) - 1);
                    }
                }
                // apply border and padding to string.
                const padding = row[c].padding || [0, 0, 0, 0];
                if (padding[left]) {
                    str += ' '.repeat(padding[left]);
                }
                str += addBorder(row[c], ts, '| ');
                str += ts;
                str += addBorder(row[c], ts, ' |');
                if (padding[right]) {
                    str += ' '.repeat(padding[right]);
                }
                // if prior row is span, try to render the
                // current row on the prior line.
                if (r === 0 && lines.length > 0) {
                    str = this.renderInline(str, lines[lines.length - 1]);
                }
            });
            // remove trailing whitespace.
            lines.push({
                text: str.replace(/ +$/, ''),
                span: row.span
            });
        });
        return lines;
    }
    // if the full 'source' can render in
    // the target line, do so.
    renderInline(source, previousLine) {
        const match = source.match(/^ */);
        const leadingWhitespace = match ? match[0].length : 0;
        const target = previousLine.text;
        const targetTextWidth = mixin.stringWidth(target.trimRight());
        if (!previousLine.span) {
            return source;
        }
        // if we're not applying wrapping logic,
        // just always append to the span.
        if (!this.wrap) {
            previousLine.hidden = true;
            return target + source;
        }
        if (leadingWhitespace < targetTextWidth) {
            return source;
        }
        previousLine.hidden = true;
        return target.trimRight() + ' '.repeat(leadingWhitespace - targetTextWidth) + source.trimLeft();
    }
    rasterize(row) {
        const rrows = [];
        const widths = this.columnWidths(row);
        let wrapped;
        // word wrap all columns, and create
        // a data-structure that is easy to rasterize.
        row.forEach((col, c) => {
            // leave room for left and right padding.
            col.width = widths[c];
            if (this.wrap) {
                wrapped = mixin.wrap(col.text, this.negatePadding(col), { hard: true }).split('\n');
            }
            else {
                wrapped = col.text.split('\n');
            }
            if (col.border) {
                wrapped.unshift('.' + '-'.repeat(this.negatePadding(col) + 2) + '.');
                wrapped.push("'" + '-'.repeat(this.negatePadding(col) + 2) + "'");
            }
            // add top and bottom padding.
            if (col.padding) {
                wrapped.unshift(...new Array(col.padding[top] || 0).fill(''));
                wrapped.push(...new Array(col.padding[bottom] || 0).fill(''));
            }
            wrapped.forEach((str, r) => {
                if (!rrows[r]) {
                    rrows.push([]);
                }
                const rrow = rrows[r];
                for (let i = 0; i < c; i++) {
                    if (rrow[i] === undefined) {
                        rrow.push('');
                    }
                }
                rrow.push(str);
            });
        });
        return rrows;
    }
    negatePadding(col) {
        let wrapWidth = col.width || 0;
        if (col.padding) {
            wrapWidth -= (col.padding[left] || 0) + (col.padding[right] || 0);
        }
        if (col.border) {
            wrapWidth -= 4;
        }
        return wrapWidth;
    }
    columnWidths(row) {
        if (!this.wrap) {
            return row.map(col => {
                return col.width || mixin.stringWidth(col.text);
            });
        }
        let unset = row.length;
        let remainingWidth = this.width;
        // column widths can be set in config.
        const widths = row.map(col => {
            if (col.width) {
                unset--;
                remainingWidth -= col.width;
                return col.width;
            }
            return undefined;
        });
        // any unset widths should be calculated.
        const unsetWidth = unset ? Math.floor(remainingWidth / unset) : 0;
        return widths.map((w, i) => {
            if (w === undefined) {
                return Math.max(unsetWidth, _minWidth(row[i]));
            }
            return w;
        });
    }
}
function addBorder(col, ts, style) {
    if (col.border) {
        if (/[.']-+[.']/.test(ts)) {
            return '';
        }
        if (ts.trim().length !== 0) {
            return style;
        }
        return '  ';
    }
    return '';
}
// calculates the minimum width of
// a column, based on padding preferences.
function _minWidth(col) {
    const padding = col.padding || [];
    const minWidth = 1 + (padding[left] || 0) + (padding[right] || 0);
    if (col.border) {
        return minWidth + 4;
    }
    return minWidth;
}
function getWindowWidth() {
    /* istanbul ignore next: depends on terminal */
    if (typeof process === 'object' && process.stdout && process.stdout.columns) {
        return process.stdout.columns;
    }
    return 80;
}
function alignRight(str, width) {
    str = str.trim();
    const strWidth = mixin.stringWidth(str);
    if (strWidth < width) {
        return ' '.repeat(width - strWidth) + str;
    }
    return str;
}
function alignCenter(str, width) {
    str = str.trim();
    const strWidth = mixin.stringWidth(str);
    /* istanbul ignore next */
    if (strWidth >= width) {
        return str;
    }
    return ' '.repeat((width - strWidth) >> 1) + str;
}
let mixin;
function cliui(opts, _mixin) {
    mixin = _mixin;
    return new UI({
        width: (opts === null || opts === void 0 ? void 0 : opts.width) || getWindowWidth(),
        wrap: opts === null || opts === void 0 ? void 0 : opts.wrap
    });
}

// Bootstrap cliui with CommonJS dependencies:
const stringWidth = __nccwpck_require__(2577);
const stripAnsi = __nccwpck_require__(5591);
const wrap = __nccwpck_require__(9824);
function ui(opts) {
    return cliui(opts, {
        stringWidth,
        stripAnsi,
        wrap
    });
}

module.exports = ui;


/***/ }),

/***/ 9087:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var fs = __nccwpck_require__(5747);
var util = __nccwpck_require__(1669);
var path = __nccwpck_require__(5622);

let shim;
class Y18N {
    constructor(opts) {
        // configurable options.
        opts = opts || {};
        this.directory = opts.directory || './locales';
        this.updateFiles = typeof opts.updateFiles === 'boolean' ? opts.updateFiles : true;
        this.locale = opts.locale || 'en';
        this.fallbackToLanguage = typeof opts.fallbackToLanguage === 'boolean' ? opts.fallbackToLanguage : true;
        // internal stuff.
        this.cache = Object.create(null);
        this.writeQueue = [];
    }
    __(...args) {
        if (typeof arguments[0] !== 'string') {
            return this._taggedLiteral(arguments[0], ...arguments);
        }
        const str = args.shift();
        let cb = function () { }; // start with noop.
        if (typeof args[args.length - 1] === 'function')
            cb = args.pop();
        cb = cb || function () { }; // noop.
        if (!this.cache[this.locale])
            this._readLocaleFile();
        // we've observed a new string, update the language file.
        if (!this.cache[this.locale][str] && this.updateFiles) {
            this.cache[this.locale][str] = str;
            // include the current directory and locale,
            // since these values could change before the
            // write is performed.
            this._enqueueWrite({
                directory: this.directory,
                locale: this.locale,
                cb
            });
        }
        else {
            cb();
        }
        return shim.format.apply(shim.format, [this.cache[this.locale][str] || str].concat(args));
    }
    __n() {
        const args = Array.prototype.slice.call(arguments);
        const singular = args.shift();
        const plural = args.shift();
        const quantity = args.shift();
        let cb = function () { }; // start with noop.
        if (typeof args[args.length - 1] === 'function')
            cb = args.pop();
        if (!this.cache[this.locale])
            this._readLocaleFile();
        let str = quantity === 1 ? singular : plural;
        if (this.cache[this.locale][singular]) {
            const entry = this.cache[this.locale][singular];
            str = entry[quantity === 1 ? 'one' : 'other'];
        }
        // we've observed a new string, update the language file.
        if (!this.cache[this.locale][singular] && this.updateFiles) {
            this.cache[this.locale][singular] = {
                one: singular,
                other: plural
            };
            // include the current directory and locale,
            // since these values could change before the
            // write is performed.
            this._enqueueWrite({
                directory: this.directory,
                locale: this.locale,
                cb
            });
        }
        else {
            cb();
        }
        // if a %d placeholder is provided, add quantity
        // to the arguments expanded by util.format.
        const values = [str];
        if (~str.indexOf('%d'))
            values.push(quantity);
        return shim.format.apply(shim.format, values.concat(args));
    }
    setLocale(locale) {
        this.locale = locale;
    }
    getLocale() {
        return this.locale;
    }
    updateLocale(obj) {
        if (!this.cache[this.locale])
            this._readLocaleFile();
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                this.cache[this.locale][key] = obj[key];
            }
        }
    }
    _taggedLiteral(parts, ...args) {
        let str = '';
        parts.forEach(function (part, i) {
            const arg = args[i + 1];
            str += part;
            if (typeof arg !== 'undefined') {
                str += '%s';
            }
        });
        return this.__.apply(this, [str].concat([].slice.call(args, 1)));
    }
    _enqueueWrite(work) {
        this.writeQueue.push(work);
        if (this.writeQueue.length === 1)
            this._processWriteQueue();
    }
    _processWriteQueue() {
        const _this = this;
        const work = this.writeQueue[0];
        // destructure the enqueued work.
        const directory = work.directory;
        const locale = work.locale;
        const cb = work.cb;
        const languageFile = this._resolveLocaleFile(directory, locale);
        const serializedLocale = JSON.stringify(this.cache[locale], null, 2);
        shim.fs.writeFile(languageFile, serializedLocale, 'utf-8', function (err) {
            _this.writeQueue.shift();
            if (_this.writeQueue.length > 0)
                _this._processWriteQueue();
            cb(err);
        });
    }
    _readLocaleFile() {
        let localeLookup = {};
        const languageFile = this._resolveLocaleFile(this.directory, this.locale);
        try {
            // When using a bundler such as webpack, readFileSync may not be defined:
            if (shim.fs.readFileSync) {
                localeLookup = JSON.parse(shim.fs.readFileSync(languageFile, 'utf-8'));
            }
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                err.message = 'syntax error in ' + languageFile;
            }
            if (err.code === 'ENOENT')
                localeLookup = {};
            else
                throw err;
        }
        this.cache[this.locale] = localeLookup;
    }
    _resolveLocaleFile(directory, locale) {
        let file = shim.resolve(directory, './', locale + '.json');
        if (this.fallbackToLanguage && !this._fileExistsSync(file) && ~locale.lastIndexOf('_')) {
            // attempt fallback to language only
            const languageFile = shim.resolve(directory, './', locale.split('_')[0] + '.json');
            if (this._fileExistsSync(languageFile))
                file = languageFile;
        }
        return file;
    }
    _fileExistsSync(file) {
        return shim.exists(file);
    }
}
function y18n$1(opts, _shim) {
    shim = _shim;
    const y18n = new Y18N(opts);
    return {
        __: y18n.__.bind(y18n),
        __n: y18n.__n.bind(y18n),
        setLocale: y18n.setLocale.bind(y18n),
        getLocale: y18n.getLocale.bind(y18n),
        updateLocale: y18n.updateLocale.bind(y18n),
        locale: y18n.locale
    };
}

var nodePlatformShim = {
    fs: {
        readFileSync: fs.readFileSync,
        writeFile: fs.writeFile
    },
    format: util.format,
    resolve: path.resolve,
    exists: (file) => {
        try {
            return fs.statSync(file).isFile();
        }
        catch (err) {
            return false;
        }
    }
};

const y18n = (opts) => {
    return y18n$1(opts, nodePlatformShim);
};

module.exports = y18n;


/***/ }),

/***/ 8909:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var util = __nccwpck_require__(1669);
var fs = __nccwpck_require__(5747);
var path = __nccwpck_require__(5622);

function camelCase(str) {
    const isCamelCase = str !== str.toLowerCase() && str !== str.toUpperCase();
    if (!isCamelCase) {
        str = str.toLowerCase();
    }
    if (str.indexOf('-') === -1 && str.indexOf('_') === -1) {
        return str;
    }
    else {
        let camelcase = '';
        let nextChrUpper = false;
        const leadingHyphens = str.match(/^-+/);
        for (let i = leadingHyphens ? leadingHyphens[0].length : 0; i < str.length; i++) {
            let chr = str.charAt(i);
            if (nextChrUpper) {
                nextChrUpper = false;
                chr = chr.toUpperCase();
            }
            if (i !== 0 && (chr === '-' || chr === '_')) {
                nextChrUpper = true;
            }
            else if (chr !== '-' && chr !== '_') {
                camelcase += chr;
            }
        }
        return camelcase;
    }
}
function decamelize(str, joinString) {
    const lowercase = str.toLowerCase();
    joinString = joinString || '-';
    let notCamelcase = '';
    for (let i = 0; i < str.length; i++) {
        const chrLower = lowercase.charAt(i);
        const chrString = str.charAt(i);
        if (chrLower !== chrString && i > 0) {
            notCamelcase += `${joinString}${lowercase.charAt(i)}`;
        }
        else {
            notCamelcase += chrString;
        }
    }
    return notCamelcase;
}
function looksLikeNumber(x) {
    if (x === null || x === undefined)
        return false;
    if (typeof x === 'number')
        return true;
    if (/^0x[0-9a-f]+$/i.test(x))
        return true;
    if (/^0[^.]/.test(x))
        return false;
    return /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

function tokenizeArgString(argString) {
    if (Array.isArray(argString)) {
        return argString.map(e => typeof e !== 'string' ? e + '' : e);
    }
    argString = argString.trim();
    let i = 0;
    let prevC = null;
    let c = null;
    let opening = null;
    const args = [];
    for (let ii = 0; ii < argString.length; ii++) {
        prevC = c;
        c = argString.charAt(ii);
        if (c === ' ' && !opening) {
            if (!(prevC === ' ')) {
                i++;
            }
            continue;
        }
        if (c === opening) {
            opening = null;
        }
        else if ((c === "'" || c === '"') && !opening) {
            opening = c;
        }
        if (!args[i])
            args[i] = '';
        args[i] += c;
    }
    return args;
}

var DefaultValuesForTypeKey;
(function (DefaultValuesForTypeKey) {
    DefaultValuesForTypeKey["BOOLEAN"] = "boolean";
    DefaultValuesForTypeKey["STRING"] = "string";
    DefaultValuesForTypeKey["NUMBER"] = "number";
    DefaultValuesForTypeKey["ARRAY"] = "array";
})(DefaultValuesForTypeKey || (DefaultValuesForTypeKey = {}));

let mixin;
class YargsParser {
    constructor(_mixin) {
        mixin = _mixin;
    }
    parse(argsInput, options) {
        const opts = Object.assign({
            alias: undefined,
            array: undefined,
            boolean: undefined,
            config: undefined,
            configObjects: undefined,
            configuration: undefined,
            coerce: undefined,
            count: undefined,
            default: undefined,
            envPrefix: undefined,
            narg: undefined,
            normalize: undefined,
            string: undefined,
            number: undefined,
            __: undefined,
            key: undefined
        }, options);
        const args = tokenizeArgString(argsInput);
        const aliases = combineAliases(Object.assign(Object.create(null), opts.alias));
        const configuration = Object.assign({
            'boolean-negation': true,
            'camel-case-expansion': true,
            'combine-arrays': false,
            'dot-notation': true,
            'duplicate-arguments-array': true,
            'flatten-duplicate-arrays': true,
            'greedy-arrays': true,
            'halt-at-non-option': false,
            'nargs-eats-options': false,
            'negation-prefix': 'no-',
            'parse-numbers': true,
            'parse-positional-numbers': true,
            'populate--': false,
            'set-placeholder-key': false,
            'short-option-groups': true,
            'strip-aliased': false,
            'strip-dashed': false,
            'unknown-options-as-args': false
        }, opts.configuration);
        const defaults = Object.assign(Object.create(null), opts.default);
        const configObjects = opts.configObjects || [];
        const envPrefix = opts.envPrefix;
        const notFlagsOption = configuration['populate--'];
        const notFlagsArgv = notFlagsOption ? '--' : '_';
        const newAliases = Object.create(null);
        const defaulted = Object.create(null);
        const __ = opts.__ || mixin.format;
        const flags = {
            aliases: Object.create(null),
            arrays: Object.create(null),
            bools: Object.create(null),
            strings: Object.create(null),
            numbers: Object.create(null),
            counts: Object.create(null),
            normalize: Object.create(null),
            configs: Object.create(null),
            nargs: Object.create(null),
            coercions: Object.create(null),
            keys: []
        };
        const negative = /^-([0-9]+(\.[0-9]+)?|\.[0-9]+)$/;
        const negatedBoolean = new RegExp('^--' + configuration['negation-prefix'] + '(.+)');
        [].concat(opts.array || []).filter(Boolean).forEach(function (opt) {
            const key = typeof opt === 'object' ? opt.key : opt;
            const assignment = Object.keys(opt).map(function (key) {
                const arrayFlagKeys = {
                    boolean: 'bools',
                    string: 'strings',
                    number: 'numbers'
                };
                return arrayFlagKeys[key];
            }).filter(Boolean).pop();
            if (assignment) {
                flags[assignment][key] = true;
            }
            flags.arrays[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.boolean || []).filter(Boolean).forEach(function (key) {
            flags.bools[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.string || []).filter(Boolean).forEach(function (key) {
            flags.strings[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.number || []).filter(Boolean).forEach(function (key) {
            flags.numbers[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.count || []).filter(Boolean).forEach(function (key) {
            flags.counts[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.normalize || []).filter(Boolean).forEach(function (key) {
            flags.normalize[key] = true;
            flags.keys.push(key);
        });
        if (typeof opts.narg === 'object') {
            Object.entries(opts.narg).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    flags.nargs[key] = value;
                    flags.keys.push(key);
                }
            });
        }
        if (typeof opts.coerce === 'object') {
            Object.entries(opts.coerce).forEach(([key, value]) => {
                if (typeof value === 'function') {
                    flags.coercions[key] = value;
                    flags.keys.push(key);
                }
            });
        }
        if (typeof opts.config !== 'undefined') {
            if (Array.isArray(opts.config) || typeof opts.config === 'string') {
                [].concat(opts.config).filter(Boolean).forEach(function (key) {
                    flags.configs[key] = true;
                });
            }
            else if (typeof opts.config === 'object') {
                Object.entries(opts.config).forEach(([key, value]) => {
                    if (typeof value === 'boolean' || typeof value === 'function') {
                        flags.configs[key] = value;
                    }
                });
            }
        }
        extendAliases(opts.key, aliases, opts.default, flags.arrays);
        Object.keys(defaults).forEach(function (key) {
            (flags.aliases[key] || []).forEach(function (alias) {
                defaults[alias] = defaults[key];
            });
        });
        let error = null;
        checkConfiguration();
        let notFlags = [];
        const argv = Object.assign(Object.create(null), { _: [] });
        const argvReturn = {};
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const truncatedArg = arg.replace(/^-{3,}/, '---');
            let broken;
            let key;
            let letters;
            let m;
            let next;
            let value;
            if (arg !== '--' && isUnknownOptionAsArg(arg)) {
                pushPositional(arg);
            }
            else if (truncatedArg.match(/---+(=|$)/)) {
                pushPositional(arg);
                continue;
            }
            else if (arg.match(/^--.+=/) || (!configuration['short-option-groups'] && arg.match(/^-.+=/))) {
                m = arg.match(/^--?([^=]+)=([\s\S]*)$/);
                if (m !== null && Array.isArray(m) && m.length >= 3) {
                    if (checkAllAliases(m[1], flags.arrays)) {
                        i = eatArray(i, m[1], args, m[2]);
                    }
                    else if (checkAllAliases(m[1], flags.nargs) !== false) {
                        i = eatNargs(i, m[1], args, m[2]);
                    }
                    else {
                        setArg(m[1], m[2]);
                    }
                }
            }
            else if (arg.match(negatedBoolean) && configuration['boolean-negation']) {
                m = arg.match(negatedBoolean);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    setArg(key, checkAllAliases(key, flags.arrays) ? [false] : false);
                }
            }
            else if (arg.match(/^--.+/) || (!configuration['short-option-groups'] && arg.match(/^-[^-]+/))) {
                m = arg.match(/^--?(.+)/);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    if (checkAllAliases(key, flags.arrays)) {
                        i = eatArray(i, key, args);
                    }
                    else if (checkAllAliases(key, flags.nargs) !== false) {
                        i = eatNargs(i, key, args);
                    }
                    else {
                        next = args[i + 1];
                        if (next !== undefined && (!next.match(/^-/) ||
                            next.match(negative)) &&
                            !checkAllAliases(key, flags.bools) &&
                            !checkAllAliases(key, flags.counts)) {
                            setArg(key, next);
                            i++;
                        }
                        else if (/^(true|false)$/.test(next)) {
                            setArg(key, next);
                            i++;
                        }
                        else {
                            setArg(key, defaultValue(key));
                        }
                    }
                }
            }
            else if (arg.match(/^-.\..+=/)) {
                m = arg.match(/^-([^=]+)=([\s\S]*)$/);
                if (m !== null && Array.isArray(m) && m.length >= 3) {
                    setArg(m[1], m[2]);
                }
            }
            else if (arg.match(/^-.\..+/) && !arg.match(negative)) {
                next = args[i + 1];
                m = arg.match(/^-(.\..+)/);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    if (next !== undefined && !next.match(/^-/) &&
                        !checkAllAliases(key, flags.bools) &&
                        !checkAllAliases(key, flags.counts)) {
                        setArg(key, next);
                        i++;
                    }
                    else {
                        setArg(key, defaultValue(key));
                    }
                }
            }
            else if (arg.match(/^-[^-]+/) && !arg.match(negative)) {
                letters = arg.slice(1, -1).split('');
                broken = false;
                for (let j = 0; j < letters.length; j++) {
                    next = arg.slice(j + 2);
                    if (letters[j + 1] && letters[j + 1] === '=') {
                        value = arg.slice(j + 3);
                        key = letters[j];
                        if (checkAllAliases(key, flags.arrays)) {
                            i = eatArray(i, key, args, value);
                        }
                        else if (checkAllAliases(key, flags.nargs) !== false) {
                            i = eatNargs(i, key, args, value);
                        }
                        else {
                            setArg(key, value);
                        }
                        broken = true;
                        break;
                    }
                    if (next === '-') {
                        setArg(letters[j], next);
                        continue;
                    }
                    if (/[A-Za-z]/.test(letters[j]) &&
                        /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) &&
                        checkAllAliases(next, flags.bools) === false) {
                        setArg(letters[j], next);
                        broken = true;
                        break;
                    }
                    if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                        setArg(letters[j], next);
                        broken = true;
                        break;
                    }
                    else {
                        setArg(letters[j], defaultValue(letters[j]));
                    }
                }
                key = arg.slice(-1)[0];
                if (!broken && key !== '-') {
                    if (checkAllAliases(key, flags.arrays)) {
                        i = eatArray(i, key, args);
                    }
                    else if (checkAllAliases(key, flags.nargs) !== false) {
                        i = eatNargs(i, key, args);
                    }
                    else {
                        next = args[i + 1];
                        if (next !== undefined && (!/^(-|--)[^-]/.test(next) ||
                            next.match(negative)) &&
                            !checkAllAliases(key, flags.bools) &&
                            !checkAllAliases(key, flags.counts)) {
                            setArg(key, next);
                            i++;
                        }
                        else if (/^(true|false)$/.test(next)) {
                            setArg(key, next);
                            i++;
                        }
                        else {
                            setArg(key, defaultValue(key));
                        }
                    }
                }
            }
            else if (arg.match(/^-[0-9]$/) &&
                arg.match(negative) &&
                checkAllAliases(arg.slice(1), flags.bools)) {
                key = arg.slice(1);
                setArg(key, defaultValue(key));
            }
            else if (arg === '--') {
                notFlags = args.slice(i + 1);
                break;
            }
            else if (configuration['halt-at-non-option']) {
                notFlags = args.slice(i);
                break;
            }
            else {
                pushPositional(arg);
            }
        }
        applyEnvVars(argv, true);
        applyEnvVars(argv, false);
        setConfig(argv);
        setConfigObjects();
        applyDefaultsAndAliases(argv, flags.aliases, defaults, true);
        applyCoercions(argv);
        if (configuration['set-placeholder-key'])
            setPlaceholderKeys(argv);
        Object.keys(flags.counts).forEach(function (key) {
            if (!hasKey(argv, key.split('.')))
                setArg(key, 0);
        });
        if (notFlagsOption && notFlags.length)
            argv[notFlagsArgv] = [];
        notFlags.forEach(function (key) {
            argv[notFlagsArgv].push(key);
        });
        if (configuration['camel-case-expansion'] && configuration['strip-dashed']) {
            Object.keys(argv).filter(key => key !== '--' && key.includes('-')).forEach(key => {
                delete argv[key];
            });
        }
        if (configuration['strip-aliased']) {
            [].concat(...Object.keys(aliases).map(k => aliases[k])).forEach(alias => {
                if (configuration['camel-case-expansion'] && alias.includes('-')) {
                    delete argv[alias.split('.').map(prop => camelCase(prop)).join('.')];
                }
                delete argv[alias];
            });
        }
        function pushPositional(arg) {
            const maybeCoercedNumber = maybeCoerceNumber('_', arg);
            if (typeof maybeCoercedNumber === 'string' || typeof maybeCoercedNumber === 'number') {
                argv._.push(maybeCoercedNumber);
            }
        }
        function eatNargs(i, key, args, argAfterEqualSign) {
            let ii;
            let toEat = checkAllAliases(key, flags.nargs);
            toEat = typeof toEat !== 'number' || isNaN(toEat) ? 1 : toEat;
            if (toEat === 0) {
                if (!isUndefined(argAfterEqualSign)) {
                    error = Error(__('Argument unexpected for: %s', key));
                }
                setArg(key, defaultValue(key));
                return i;
            }
            let available = isUndefined(argAfterEqualSign) ? 0 : 1;
            if (configuration['nargs-eats-options']) {
                if (args.length - (i + 1) + available < toEat) {
                    error = Error(__('Not enough arguments following: %s', key));
                }
                available = toEat;
            }
            else {
                for (ii = i + 1; ii < args.length; ii++) {
                    if (!args[ii].match(/^-[^0-9]/) || args[ii].match(negative) || isUnknownOptionAsArg(args[ii]))
                        available++;
                    else
                        break;
                }
                if (available < toEat)
                    error = Error(__('Not enough arguments following: %s', key));
            }
            let consumed = Math.min(available, toEat);
            if (!isUndefined(argAfterEqualSign) && consumed > 0) {
                setArg(key, argAfterEqualSign);
                consumed--;
            }
            for (ii = i + 1; ii < (consumed + i + 1); ii++) {
                setArg(key, args[ii]);
            }
            return (i + consumed);
        }
        function eatArray(i, key, args, argAfterEqualSign) {
            let argsToSet = [];
            let next = argAfterEqualSign || args[i + 1];
            const nargsCount = checkAllAliases(key, flags.nargs);
            if (checkAllAliases(key, flags.bools) && !(/^(true|false)$/.test(next))) {
                argsToSet.push(true);
            }
            else if (isUndefined(next) ||
                (isUndefined(argAfterEqualSign) && /^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next))) {
                if (defaults[key] !== undefined) {
                    const defVal = defaults[key];
                    argsToSet = Array.isArray(defVal) ? defVal : [defVal];
                }
            }
            else {
                if (!isUndefined(argAfterEqualSign)) {
                    argsToSet.push(processValue(key, argAfterEqualSign));
                }
                for (let ii = i + 1; ii < args.length; ii++) {
                    if ((!configuration['greedy-arrays'] && argsToSet.length > 0) ||
                        (nargsCount && typeof nargsCount === 'number' && argsToSet.length >= nargsCount))
                        break;
                    next = args[ii];
                    if (/^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next))
                        break;
                    i = ii;
                    argsToSet.push(processValue(key, next));
                }
            }
            if (typeof nargsCount === 'number' && ((nargsCount && argsToSet.length < nargsCount) ||
                (isNaN(nargsCount) && argsToSet.length === 0))) {
                error = Error(__('Not enough arguments following: %s', key));
            }
            setArg(key, argsToSet);
            return i;
        }
        function setArg(key, val) {
            if (/-/.test(key) && configuration['camel-case-expansion']) {
                const alias = key.split('.').map(function (prop) {
                    return camelCase(prop);
                }).join('.');
                addNewAlias(key, alias);
            }
            const value = processValue(key, val);
            const splitKey = key.split('.');
            setKey(argv, splitKey, value);
            if (flags.aliases[key]) {
                flags.aliases[key].forEach(function (x) {
                    const keyProperties = x.split('.');
                    setKey(argv, keyProperties, value);
                });
            }
            if (splitKey.length > 1 && configuration['dot-notation']) {
                (flags.aliases[splitKey[0]] || []).forEach(function (x) {
                    let keyProperties = x.split('.');
                    const a = [].concat(splitKey);
                    a.shift();
                    keyProperties = keyProperties.concat(a);
                    if (!(flags.aliases[key] || []).includes(keyProperties.join('.'))) {
                        setKey(argv, keyProperties, value);
                    }
                });
            }
            if (checkAllAliases(key, flags.normalize) && !checkAllAliases(key, flags.arrays)) {
                const keys = [key].concat(flags.aliases[key] || []);
                keys.forEach(function (key) {
                    Object.defineProperty(argvReturn, key, {
                        enumerable: true,
                        get() {
                            return val;
                        },
                        set(value) {
                            val = typeof value === 'string' ? mixin.normalize(value) : value;
                        }
                    });
                });
            }
        }
        function addNewAlias(key, alias) {
            if (!(flags.aliases[key] && flags.aliases[key].length)) {
                flags.aliases[key] = [alias];
                newAliases[alias] = true;
            }
            if (!(flags.aliases[alias] && flags.aliases[alias].length)) {
                addNewAlias(alias, key);
            }
        }
        function processValue(key, val) {
            if (typeof val === 'string' &&
                (val[0] === "'" || val[0] === '"') &&
                val[val.length - 1] === val[0]) {
                val = val.substring(1, val.length - 1);
            }
            if (checkAllAliases(key, flags.bools) || checkAllAliases(key, flags.counts)) {
                if (typeof val === 'string')
                    val = val === 'true';
            }
            let value = Array.isArray(val)
                ? val.map(function (v) { return maybeCoerceNumber(key, v); })
                : maybeCoerceNumber(key, val);
            if (checkAllAliases(key, flags.counts) && (isUndefined(value) || typeof value === 'boolean')) {
                value = increment();
            }
            if (checkAllAliases(key, flags.normalize) && checkAllAliases(key, flags.arrays)) {
                if (Array.isArray(val))
                    value = val.map((val) => { return mixin.normalize(val); });
                else
                    value = mixin.normalize(val);
            }
            return value;
        }
        function maybeCoerceNumber(key, value) {
            if (!configuration['parse-positional-numbers'] && key === '_')
                return value;
            if (!checkAllAliases(key, flags.strings) && !checkAllAliases(key, flags.bools) && !Array.isArray(value)) {
                const shouldCoerceNumber = looksLikeNumber(value) && configuration['parse-numbers'] && (Number.isSafeInteger(Math.floor(parseFloat(`${value}`))));
                if (shouldCoerceNumber || (!isUndefined(value) && checkAllAliases(key, flags.numbers))) {
                    value = Number(value);
                }
            }
            return value;
        }
        function setConfig(argv) {
            const configLookup = Object.create(null);
            applyDefaultsAndAliases(configLookup, flags.aliases, defaults);
            Object.keys(flags.configs).forEach(function (configKey) {
                const configPath = argv[configKey] || configLookup[configKey];
                if (configPath) {
                    try {
                        let config = null;
                        const resolvedConfigPath = mixin.resolve(mixin.cwd(), configPath);
                        const resolveConfig = flags.configs[configKey];
                        if (typeof resolveConfig === 'function') {
                            try {
                                config = resolveConfig(resolvedConfigPath);
                            }
                            catch (e) {
                                config = e;
                            }
                            if (config instanceof Error) {
                                error = config;
                                return;
                            }
                        }
                        else {
                            config = mixin.require(resolvedConfigPath);
                        }
                        setConfigObject(config);
                    }
                    catch (ex) {
                        if (ex.name === 'PermissionDenied')
                            error = ex;
                        else if (argv[configKey])
                            error = Error(__('Invalid JSON config file: %s', configPath));
                    }
                }
            });
        }
        function setConfigObject(config, prev) {
            Object.keys(config).forEach(function (key) {
                const value = config[key];
                const fullKey = prev ? prev + '.' + key : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && configuration['dot-notation']) {
                    setConfigObject(value, fullKey);
                }
                else {
                    if (!hasKey(argv, fullKey.split('.')) || (checkAllAliases(fullKey, flags.arrays) && configuration['combine-arrays'])) {
                        setArg(fullKey, value);
                    }
                }
            });
        }
        function setConfigObjects() {
            if (typeof configObjects !== 'undefined') {
                configObjects.forEach(function (configObject) {
                    setConfigObject(configObject);
                });
            }
        }
        function applyEnvVars(argv, configOnly) {
            if (typeof envPrefix === 'undefined')
                return;
            const prefix = typeof envPrefix === 'string' ? envPrefix : '';
            const env = mixin.env();
            Object.keys(env).forEach(function (envVar) {
                if (prefix === '' || envVar.lastIndexOf(prefix, 0) === 0) {
                    const keys = envVar.split('__').map(function (key, i) {
                        if (i === 0) {
                            key = key.substring(prefix.length);
                        }
                        return camelCase(key);
                    });
                    if (((configOnly && flags.configs[keys.join('.')]) || !configOnly) && !hasKey(argv, keys)) {
                        setArg(keys.join('.'), env[envVar]);
                    }
                }
            });
        }
        function applyCoercions(argv) {
            let coerce;
            const applied = new Set();
            Object.keys(argv).forEach(function (key) {
                if (!applied.has(key)) {
                    coerce = checkAllAliases(key, flags.coercions);
                    if (typeof coerce === 'function') {
                        try {
                            const value = maybeCoerceNumber(key, coerce(argv[key]));
                            ([].concat(flags.aliases[key] || [], key)).forEach(ali => {
                                applied.add(ali);
                                argv[ali] = value;
                            });
                        }
                        catch (err) {
                            error = err;
                        }
                    }
                }
            });
        }
        function setPlaceholderKeys(argv) {
            flags.keys.forEach((key) => {
                if (~key.indexOf('.'))
                    return;
                if (typeof argv[key] === 'undefined')
                    argv[key] = undefined;
            });
            return argv;
        }
        function applyDefaultsAndAliases(obj, aliases, defaults, canLog = false) {
            Object.keys(defaults).forEach(function (key) {
                if (!hasKey(obj, key.split('.'))) {
                    setKey(obj, key.split('.'), defaults[key]);
                    if (canLog)
                        defaulted[key] = true;
                    (aliases[key] || []).forEach(function (x) {
                        if (hasKey(obj, x.split('.')))
                            return;
                        setKey(obj, x.split('.'), defaults[key]);
                    });
                }
            });
        }
        function hasKey(obj, keys) {
            let o = obj;
            if (!configuration['dot-notation'])
                keys = [keys.join('.')];
            keys.slice(0, -1).forEach(function (key) {
                o = (o[key] || {});
            });
            const key = keys[keys.length - 1];
            if (typeof o !== 'object')
                return false;
            else
                return key in o;
        }
        function setKey(obj, keys, value) {
            let o = obj;
            if (!configuration['dot-notation'])
                keys = [keys.join('.')];
            keys.slice(0, -1).forEach(function (key) {
                key = sanitizeKey(key);
                if (typeof o === 'object' && o[key] === undefined) {
                    o[key] = {};
                }
                if (typeof o[key] !== 'object' || Array.isArray(o[key])) {
                    if (Array.isArray(o[key])) {
                        o[key].push({});
                    }
                    else {
                        o[key] = [o[key], {}];
                    }
                    o = o[key][o[key].length - 1];
                }
                else {
                    o = o[key];
                }
            });
            const key = sanitizeKey(keys[keys.length - 1]);
            const isTypeArray = checkAllAliases(keys.join('.'), flags.arrays);
            const isValueArray = Array.isArray(value);
            let duplicate = configuration['duplicate-arguments-array'];
            if (!duplicate && checkAllAliases(key, flags.nargs)) {
                duplicate = true;
                if ((!isUndefined(o[key]) && flags.nargs[key] === 1) || (Array.isArray(o[key]) && o[key].length === flags.nargs[key])) {
                    o[key] = undefined;
                }
            }
            if (value === increment()) {
                o[key] = increment(o[key]);
            }
            else if (Array.isArray(o[key])) {
                if (duplicate && isTypeArray && isValueArray) {
                    o[key] = configuration['flatten-duplicate-arrays'] ? o[key].concat(value) : (Array.isArray(o[key][0]) ? o[key] : [o[key]]).concat([value]);
                }
                else if (!duplicate && Boolean(isTypeArray) === Boolean(isValueArray)) {
                    o[key] = value;
                }
                else {
                    o[key] = o[key].concat([value]);
                }
            }
            else if (o[key] === undefined && isTypeArray) {
                o[key] = isValueArray ? value : [value];
            }
            else if (duplicate && !(o[key] === undefined ||
                checkAllAliases(key, flags.counts) ||
                checkAllAliases(key, flags.bools))) {
                o[key] = [o[key], value];
            }
            else {
                o[key] = value;
            }
        }
        function extendAliases(...args) {
            args.forEach(function (obj) {
                Object.keys(obj || {}).forEach(function (key) {
                    if (flags.aliases[key])
                        return;
                    flags.aliases[key] = [].concat(aliases[key] || []);
                    flags.aliases[key].concat(key).forEach(function (x) {
                        if (/-/.test(x) && configuration['camel-case-expansion']) {
                            const c = camelCase(x);
                            if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                                flags.aliases[key].push(c);
                                newAliases[c] = true;
                            }
                        }
                    });
                    flags.aliases[key].concat(key).forEach(function (x) {
                        if (x.length > 1 && /[A-Z]/.test(x) && configuration['camel-case-expansion']) {
                            const c = decamelize(x, '-');
                            if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                                flags.aliases[key].push(c);
                                newAliases[c] = true;
                            }
                        }
                    });
                    flags.aliases[key].forEach(function (x) {
                        flags.aliases[x] = [key].concat(flags.aliases[key].filter(function (y) {
                            return x !== y;
                        }));
                    });
                });
            });
        }
        function checkAllAliases(key, flag) {
            const toCheck = [].concat(flags.aliases[key] || [], key);
            const keys = Object.keys(flag);
            const setAlias = toCheck.find(key => keys.includes(key));
            return setAlias ? flag[setAlias] : false;
        }
        function hasAnyFlag(key) {
            const flagsKeys = Object.keys(flags);
            const toCheck = [].concat(flagsKeys.map(k => flags[k]));
            return toCheck.some(function (flag) {
                return Array.isArray(flag) ? flag.includes(key) : flag[key];
            });
        }
        function hasFlagsMatching(arg, ...patterns) {
            const toCheck = [].concat(...patterns);
            return toCheck.some(function (pattern) {
                const match = arg.match(pattern);
                return match && hasAnyFlag(match[1]);
            });
        }
        function hasAllShortFlags(arg) {
            if (arg.match(negative) || !arg.match(/^-[^-]+/)) {
                return false;
            }
            let hasAllFlags = true;
            let next;
            const letters = arg.slice(1).split('');
            for (let j = 0; j < letters.length; j++) {
                next = arg.slice(j + 2);
                if (!hasAnyFlag(letters[j])) {
                    hasAllFlags = false;
                    break;
                }
                if ((letters[j + 1] && letters[j + 1] === '=') ||
                    next === '-' ||
                    (/[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) ||
                    (letters[j + 1] && letters[j + 1].match(/\W/))) {
                    break;
                }
            }
            return hasAllFlags;
        }
        function isUnknownOptionAsArg(arg) {
            return configuration['unknown-options-as-args'] && isUnknownOption(arg);
        }
        function isUnknownOption(arg) {
            arg = arg.replace(/^-{3,}/, '--');
            if (arg.match(negative)) {
                return false;
            }
            if (hasAllShortFlags(arg)) {
                return false;
            }
            const flagWithEquals = /^-+([^=]+?)=[\s\S]*$/;
            const normalFlag = /^-+([^=]+?)$/;
            const flagEndingInHyphen = /^-+([^=]+?)-$/;
            const flagEndingInDigits = /^-+([^=]+?\d+)$/;
            const flagEndingInNonWordCharacters = /^-+([^=]+?)\W+.*$/;
            return !hasFlagsMatching(arg, flagWithEquals, negatedBoolean, normalFlag, flagEndingInHyphen, flagEndingInDigits, flagEndingInNonWordCharacters);
        }
        function defaultValue(key) {
            if (!checkAllAliases(key, flags.bools) &&
                !checkAllAliases(key, flags.counts) &&
                `${key}` in defaults) {
                return defaults[key];
            }
            else {
                return defaultForType(guessType(key));
            }
        }
        function defaultForType(type) {
            const def = {
                [DefaultValuesForTypeKey.BOOLEAN]: true,
                [DefaultValuesForTypeKey.STRING]: '',
                [DefaultValuesForTypeKey.NUMBER]: undefined,
                [DefaultValuesForTypeKey.ARRAY]: []
            };
            return def[type];
        }
        function guessType(key) {
            let type = DefaultValuesForTypeKey.BOOLEAN;
            if (checkAllAliases(key, flags.strings))
                type = DefaultValuesForTypeKey.STRING;
            else if (checkAllAliases(key, flags.numbers))
                type = DefaultValuesForTypeKey.NUMBER;
            else if (checkAllAliases(key, flags.bools))
                type = DefaultValuesForTypeKey.BOOLEAN;
            else if (checkAllAliases(key, flags.arrays))
                type = DefaultValuesForTypeKey.ARRAY;
            return type;
        }
        function isUndefined(num) {
            return num === undefined;
        }
        function checkConfiguration() {
            Object.keys(flags.counts).find(key => {
                if (checkAllAliases(key, flags.arrays)) {
                    error = Error(__('Invalid configuration: %s, opts.count excludes opts.array.', key));
                    return true;
                }
                else if (checkAllAliases(key, flags.nargs)) {
                    error = Error(__('Invalid configuration: %s, opts.count excludes opts.narg.', key));
                    return true;
                }
                return false;
            });
        }
        return {
            aliases: Object.assign({}, flags.aliases),
            argv: Object.assign(argvReturn, argv),
            configuration: configuration,
            defaulted: Object.assign({}, defaulted),
            error: error,
            newAliases: Object.assign({}, newAliases)
        };
    }
}
function combineAliases(aliases) {
    const aliasArrays = [];
    const combined = Object.create(null);
    let change = true;
    Object.keys(aliases).forEach(function (key) {
        aliasArrays.push([].concat(aliases[key], key));
    });
    while (change) {
        change = false;
        for (let i = 0; i < aliasArrays.length; i++) {
            for (let ii = i + 1; ii < aliasArrays.length; ii++) {
                const intersect = aliasArrays[i].filter(function (v) {
                    return aliasArrays[ii].indexOf(v) !== -1;
                });
                if (intersect.length) {
                    aliasArrays[i] = aliasArrays[i].concat(aliasArrays[ii]);
                    aliasArrays.splice(ii, 1);
                    change = true;
                    break;
                }
            }
        }
    }
    aliasArrays.forEach(function (aliasArray) {
        aliasArray = aliasArray.filter(function (v, i, self) {
            return self.indexOf(v) === i;
        });
        const lastAlias = aliasArray.pop();
        if (lastAlias !== undefined && typeof lastAlias === 'string') {
            combined[lastAlias] = aliasArray;
        }
    });
    return combined;
}
function increment(orig) {
    return orig !== undefined ? orig + 1 : 1;
}
function sanitizeKey(key) {
    if (key === '__proto__')
        return '___proto___';
    return key;
}

const minNodeVersion = (process && process.env && process.env.YARGS_MIN_NODE_VERSION)
    ? Number(process.env.YARGS_MIN_NODE_VERSION)
    : 10;
if (process && process.version) {
    const major = Number(process.version.match(/v([^.]+)/)[1]);
    if (major < minNodeVersion) {
        throw Error(`yargs parser supports a minimum Node.js version of ${minNodeVersion}. Read our version support policy: https://github.com/yargs/yargs-parser#supported-nodejs-versions`);
    }
}
const env = process ? process.env : {};
const parser = new YargsParser({
    cwd: process.cwd,
    env: () => {
        return env;
    },
    format: util.format,
    normalize: path.normalize,
    resolve: path.resolve,
    require: (path) => {
        if (true) {
            return __nccwpck_require__(5670)(path);
        }
        else {}
    }
});
const yargsParser = function Parser(args, opts) {
    const result = parser.parse(args.slice(), opts);
    return result.argv;
};
yargsParser.detailed = function (args, opts) {
    return parser.parse(args.slice(), opts);
};
yargsParser.camelCase = camelCase;
yargsParser.decamelize = decamelize;
yargsParser.looksLikeNumber = looksLikeNumber;

module.exports = yargsParser;


/***/ }),

/***/ 9567:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";
var t=__nccwpck_require__(2357);class e extends Error{constructor(t){super(t||"yargs error"),this.name="YError",Error.captureStackTrace(this,e)}}let s,i=[];function n(t,o,a,h){s=h;let l={};if(Object.prototype.hasOwnProperty.call(t,"extends")){if("string"!=typeof t.extends)return l;const r=/\.json|\..*rc$/.test(t.extends);let h=null;if(r)h=function(t,e){return s.path.resolve(t,e)}(o,t.extends);else try{h=/*require.resolve*/(__nccwpck_require__(9167).resolve(t.extends))}catch(e){return t}!function(t){if(i.indexOf(t)>-1)throw new e(`Circular extended configurations: '${t}'.`)}(h),i.push(h),l=r?JSON.parse(s.readFileSync(h,"utf8")):__nccwpck_require__(9167)(t.extends),delete t.extends,l=n(l,s.path.dirname(h),a,s)}return i=[],a?r(l,t):Object.assign({},l,t)}function r(t,e){const s={};function i(t){return t&&"object"==typeof t&&!Array.isArray(t)}Object.assign(s,t);for(const n of Object.keys(e))i(e[n])&&i(s[n])?s[n]=r(t[n],e[n]):s[n]=e[n];return s}function o(t){const e=t.replace(/\s{2,}/g," ").split(/\s+(?![^[]*]|[^<]*>)/),s=/\.*[\][<>]/g,i=e.shift();if(!i)throw new Error(`No command found in: ${t}`);const n={cmd:i.replace(s,""),demanded:[],optional:[]};return e.forEach(((t,i)=>{let r=!1;t=t.replace(/\s/g,""),/\.+[\]>]/.test(t)&&i===e.length-1&&(r=!0),/^\[/.test(t)?n.optional.push({cmd:t.replace(s,"").split("|"),variadic:r}):n.demanded.push({cmd:t.replace(s,"").split("|"),variadic:r})})),n}const a=["first","second","third","fourth","fifth","sixth"];function h(t,s,i){try{let n=0;const[r,a,h]="object"==typeof t?[{demanded:[],optional:[]},t,s]:[o(`cmd ${t}`),s,i],f=[].slice.call(a);for(;f.length&&void 0===f[f.length-1];)f.pop();const d=h||f.length;if(d<r.demanded.length)throw new e(`Not enough arguments provided. Expected ${r.demanded.length} but received ${f.length}.`);const u=r.demanded.length+r.optional.length;if(d>u)throw new e(`Too many arguments provided. Expected max ${u} but received ${d}.`);r.demanded.forEach((t=>{const e=l(f.shift());0===t.cmd.filter((t=>t===e||"*"===t)).length&&c(e,t.cmd,n),n+=1})),r.optional.forEach((t=>{if(0===f.length)return;const e=l(f.shift());0===t.cmd.filter((t=>t===e||"*"===t)).length&&c(e,t.cmd,n),n+=1}))}catch(t){console.warn(t.stack)}}function l(t){return Array.isArray(t)?"array":null===t?"null":typeof t}function c(t,s,i){throw new e(`Invalid ${a[i]||"manyith"} argument. Expected ${s.join(" or ")} but received ${t}.`)}function f(t){return!!t&&!!t.then&&"function"==typeof t.then}function d(t,e,s,i){s.assert.notStrictEqual(t,e,i)}function u(t,e){e.assert.strictEqual(typeof t,"string")}function p(t){return Object.keys(t)}function g(t={},e=(()=>!0)){const s={};return p(t).forEach((i=>{e(i,t[i])&&(s[i]=t[i])})),s}function m(){return process.versions.electron&&!process.defaultApp?0:1}function y(){return process.argv[m()]}var b=Object.freeze({__proto__:null,hideBin:function(t){return t.slice(m()+1)},getProcessArgvBin:y});function v(t,e,s,i){if("a"===s&&!i)throw new TypeError("Private accessor was defined without a getter");if("function"==typeof e?t!==e||!i:!e.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return"m"===s?i:"a"===s?i.call(t):i?i.value:e.get(t)}function O(t,e,s,i,n){if("m"===i)throw new TypeError("Private method is not writable");if("a"===i&&!n)throw new TypeError("Private accessor was defined without a setter");if("function"==typeof e?t!==e||!n:!e.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return"a"===i?n.call(t,s):n?n.value=s:e.set(t,s),s}class w{constructor(t){this.globalMiddleware=[],this.frozens=[],this.yargs=t}addMiddleware(t,e,s=!0,i=!1){if(h("<array|function> [boolean] [boolean] [boolean]",[t,e,s],arguments.length),Array.isArray(t)){for(let i=0;i<t.length;i++){if("function"!=typeof t[i])throw Error("middleware must be a function");const n=t[i];n.applyBeforeValidation=e,n.global=s}Array.prototype.push.apply(this.globalMiddleware,t)}else if("function"==typeof t){const n=t;n.applyBeforeValidation=e,n.global=s,n.mutates=i,this.globalMiddleware.push(t)}return this.yargs}addCoerceMiddleware(t,e){const s=this.yargs.getAliases();return this.globalMiddleware=this.globalMiddleware.filter((t=>{const i=[...s[e]||[],e];return!t.option||!i.includes(t.option)})),t.option=e,this.addMiddleware(t,!0,!0,!0)}getMiddleware(){return this.globalMiddleware}freeze(){this.frozens.push([...this.globalMiddleware])}unfreeze(){const t=this.frozens.pop();void 0!==t&&(this.globalMiddleware=t)}reset(){this.globalMiddleware=this.globalMiddleware.filter((t=>t.global))}}function C(t,e,s,i){return s.reduce(((t,s)=>{if(s.applyBeforeValidation!==i)return t;if(s.mutates){if(s.applied)return t;s.applied=!0}if(f(t))return t.then((t=>Promise.all([t,s(t,e)]))).then((([t,e])=>Object.assign(t,e)));{const i=s(t,e);return f(i)?i.then((e=>Object.assign(t,e))):Object.assign(t,i)}}),t)}function j(t,e,s=(t=>{throw t})){try{const s="function"==typeof t?t():t;return f(s)?s.then((t=>e(t))):e(s)}catch(t){return s(t)}}const _=/(^\*)|(^\$0)/;class M{constructor(t,e,s,i){this.requireCache=new Set,this.handlers={},this.aliasMap={},this.frozens=[],this.shim=i,this.usage=t,this.globalMiddleware=s,this.validation=e}addDirectory(t,e,s,i){"boolean"!=typeof(i=i||{}).recurse&&(i.recurse=!1),Array.isArray(i.extensions)||(i.extensions=["js"]);const n="function"==typeof i.visit?i.visit:t=>t;i.visit=(t,e,s)=>{const i=n(t,e,s);if(i){if(this.requireCache.has(e))return i;this.requireCache.add(e),this.addHandler(i)}return i},this.shim.requireDirectory({require:e,filename:s},t,i)}addHandler(t,e,s,i,n,r){let a=[];const h=function(t){return t?t.map((t=>(t.applyBeforeValidation=!1,t))):[]}(n);if(i=i||(()=>{}),Array.isArray(t))if(function(t){return t.every((t=>"string"==typeof t))}(t))[t,...a]=t;else for(const e of t)this.addHandler(e);else{if(function(t){return"object"==typeof t&&!Array.isArray(t)}(t)){let e=Array.isArray(t.command)||"string"==typeof t.command?t.command:this.moduleName(t);return t.aliases&&(e=[].concat(e).concat(t.aliases)),void this.addHandler(e,this.extractDesc(t),t.builder,t.handler,t.middlewares,t.deprecated)}if(k(s))return void this.addHandler([t].concat(a),e,s.builder,s.handler,s.middlewares,s.deprecated)}if("string"==typeof t){const n=o(t);a=a.map((t=>o(t).cmd));let l=!1;const c=[n.cmd].concat(a).filter((t=>!_.test(t)||(l=!0,!1)));0===c.length&&l&&c.push("$0"),l&&(n.cmd=c[0],a=c.slice(1),t=t.replace(_,n.cmd)),a.forEach((t=>{this.aliasMap[t]=n.cmd})),!1!==e&&this.usage.command(t,e,l,a,r),this.handlers[n.cmd]={original:t,description:e,handler:i,builder:s||{},middlewares:h,deprecated:r,demanded:n.demanded,optional:n.optional},l&&(this.defaultCommand=this.handlers[n.cmd])}}getCommandHandlers(){return this.handlers}getCommands(){return Object.keys(this.handlers).concat(Object.keys(this.aliasMap))}hasDefaultCommand(){return!!this.defaultCommand}runCommand(t,e,s,i,n,r){const o=this.handlers[t]||this.handlers[this.aliasMap[t]]||this.defaultCommand,a=e.getInternalMethods().getContext(),h=a.commands.slice(),l=!t;t&&(a.commands.push(t),a.fullCommands.push(o.original));const c=this.applyBuilderUpdateUsageAndParse(l,o,e,s.aliases,h,i,n,r);return f(c)?c.then((t=>this.applyMiddlewareAndGetResult(l,o,t.innerArgv,a,n,t.aliases,e))):this.applyMiddlewareAndGetResult(l,o,c.innerArgv,a,n,c.aliases,e)}applyBuilderUpdateUsageAndParse(t,e,s,i,n,r,o,a){const h=e.builder;let l=s;if(E(h)){const c=h(s.getInternalMethods().reset(i),a);if(f(c))return c.then((i=>{var a;return l=(a=i)&&"function"==typeof a.getInternalMethods?i:s,this.parseAndUpdateUsage(t,e,l,n,r,o)}))}else(function(t){return"object"==typeof t})(h)&&(l=s.getInternalMethods().reset(i),Object.keys(e.builder).forEach((t=>{l.option(t,h[t])})));return this.parseAndUpdateUsage(t,e,l,n,r,o)}parseAndUpdateUsage(t,e,s,i,n,r){t&&s.getInternalMethods().getUsageInstance().unfreeze(),this.shouldUpdateUsage(s)&&s.getInternalMethods().getUsageInstance().usage(this.usageFromParentCommandsCommandHandler(i,e),e.description);const o=s.getInternalMethods().runYargsParserAndExecuteCommands(null,void 0,!0,n,r);return f(o)?o.then((t=>({aliases:s.parsed.aliases,innerArgv:t}))):{aliases:s.parsed.aliases,innerArgv:o}}shouldUpdateUsage(t){return!t.getInternalMethods().getUsageInstance().getUsageDisabled()&&0===t.getInternalMethods().getUsageInstance().getUsage().length}usageFromParentCommandsCommandHandler(t,e){const s=_.test(e.original)?e.original.replace(_,"").trim():e.original,i=t.filter((t=>!_.test(t)));return i.push(s),`$0 ${i.join(" ")}`}applyMiddlewareAndGetResult(t,e,s,i,n,r,o){let a={};if(n)return s;o.getInternalMethods().getHasOutput()||(a=this.populatePositionals(e,s,i,o));const h=this.globalMiddleware.getMiddleware().slice(0).concat(e.middlewares);if(s=C(s,o,h,!0),!o.getInternalMethods().getHasOutput()){const e=o.getInternalMethods().runValidation(r,a,o.parsed.error,t);s=j(s,(t=>(e(t),t)))}if(e.handler&&!o.getInternalMethods().getHasOutput()){o.getInternalMethods().setHasOutput();const i=!!o.getOptions().configuration["populate--"];o.getInternalMethods().postProcess(s,i,!1,!1),s=j(s=C(s,o,h,!1),(t=>{const s=e.handler(t);return f(s)?s.then((()=>t)):t})),t||o.getInternalMethods().getUsageInstance().cacheHelpMessage(),f(s)&&!o.getInternalMethods().hasParseCallback()&&s.catch((t=>{try{o.getInternalMethods().getUsageInstance().fail(null,t)}catch(t){}}))}return t||(i.commands.pop(),i.fullCommands.pop()),s}populatePositionals(t,e,s,i){e._=e._.slice(s.commands.length);const n=t.demanded.slice(0),r=t.optional.slice(0),o={};for(this.validation.positionalCount(n.length,e._.length);n.length;){const t=n.shift();this.populatePositional(t,e,o)}for(;r.length;){const t=r.shift();this.populatePositional(t,e,o)}return e._=s.commands.concat(e._.map((t=>""+t))),this.postProcessPositionals(e,o,this.cmdToParseOptions(t.original),i),o}populatePositional(t,e,s){const i=t.cmd[0];t.variadic?s[i]=e._.splice(0).map(String):e._.length&&(s[i]=[String(e._.shift())])}cmdToParseOptions(t){const e={array:[],default:{},alias:{},demand:{}},s=o(t);return s.demanded.forEach((t=>{const[s,...i]=t.cmd;t.variadic&&(e.array.push(s),e.default[s]=[]),e.alias[s]=i,e.demand[s]=!0})),s.optional.forEach((t=>{const[s,...i]=t.cmd;t.variadic&&(e.array.push(s),e.default[s]=[]),e.alias[s]=i})),e}postProcessPositionals(t,e,s,i){const n=Object.assign({},i.getOptions());n.default=Object.assign(s.default,n.default);for(const t of Object.keys(s.alias))n.alias[t]=(n.alias[t]||[]).concat(s.alias[t]);n.array=n.array.concat(s.array),n.config={};const r=[];if(Object.keys(e).forEach((t=>{e[t].map((e=>{n.configuration["unknown-options-as-args"]&&(n.key[t]=!0),r.push(`--${t}`),r.push(e)}))})),!r.length)return;const o=Object.assign({},n.configuration,{"populate--":!1}),a=this.shim.Parser.detailed(r,Object.assign({},n,{configuration:o}));if(a.error)i.getInternalMethods().getUsageInstance().fail(a.error.message,a.error);else{const s=Object.keys(e);Object.keys(e).forEach((t=>{s.push(...a.aliases[t])}));const n=i.getOptions().default;Object.keys(a.argv).forEach((i=>{s.includes(i)&&(e[i]||(e[i]=a.argv[i]),!Object.prototype.hasOwnProperty.call(n,i)&&Object.prototype.hasOwnProperty.call(t,i)&&Object.prototype.hasOwnProperty.call(a.argv,i)&&(Array.isArray(t[i])||Array.isArray(a.argv[i]))?t[i]=[].concat(t[i],a.argv[i]):t[i]=a.argv[i])}))}}runDefaultBuilderOn(t){if(!this.defaultCommand)return;if(this.shouldUpdateUsage(t)){const e=_.test(this.defaultCommand.original)?this.defaultCommand.original:this.defaultCommand.original.replace(/^[^[\]<>]*/,"$0 ");t.getInternalMethods().getUsageInstance().usage(e,this.defaultCommand.description)}const e=this.defaultCommand.builder;if(E(e))return e(t,!0);k(e)||Object.keys(e).forEach((s=>{t.option(s,e[s])}))}moduleName(t){const e=function(t){if(false){}for(let e,s=0,i=Object.keys(__nccwpck_require__.c);s<i.length;s++)if(e=__nccwpck_require__.c[i[s]],e.exports===t)return e;return null}(t);if(!e)throw new Error(`No command name given for module: ${this.shim.inspect(t)}`);return this.commandFromFilename(e.filename)}commandFromFilename(t){return this.shim.path.basename(t,this.shim.path.extname(t))}extractDesc({describe:t,description:e,desc:s}){for(const i of[t,e,s]){if("string"==typeof i||!1===i)return i;d(i,!0,this.shim)}return!1}freeze(){this.frozens.push({handlers:this.handlers,aliasMap:this.aliasMap,defaultCommand:this.defaultCommand})}unfreeze(){const t=this.frozens.pop();d(t,void 0,this.shim),({handlers:this.handlers,aliasMap:this.aliasMap,defaultCommand:this.defaultCommand}=t)}reset(){return this.handlers={},this.aliasMap={},this.defaultCommand=void 0,this.requireCache=new Set,this}}function k(t){return"object"==typeof t&&!!t.builder&&"function"==typeof t.handler}function E(t){return"function"==typeof t}function x(t){"undefined"!=typeof process&&[process.stdout,process.stderr].forEach((e=>{const s=e;s._handle&&s.isTTY&&"function"==typeof s._handle.setBlocking&&s._handle.setBlocking(t)}))}function A(t){return"boolean"==typeof t}function S(t,s){const i=s.y18n.__,n={},r=[];n.failFn=function(t){r.push(t)};let o=null,a=!0;n.showHelpOnFail=function(t=!0,e){const[s,i]="string"==typeof t?[!0,t]:[t,e];return o=i,a=s,n};let h=!1;n.fail=function(s,i){const l=t.getInternalMethods().getLoggerInstance();if(!r.length){if(t.getExitProcess()&&x(!0),h||(h=!0,a&&(t.showHelp("error"),l.error()),(s||i)&&l.error(s||i),o&&((s||i)&&l.error(""),l.error(o))),i=i||new e(s),t.getExitProcess())return t.exit(1);if(t.getInternalMethods().hasParseCallback())return t.exit(1,i);throw i}for(let t=r.length-1;t>=0;--t){const e=r[t];if(A(e)){if(i)throw i;if(s)throw Error(s)}else e(s,i,n)}};let l=[],c=!1;n.usage=(t,e)=>null===t?(c=!0,l=[],n):(c=!1,l.push([t,e||""]),n),n.getUsage=()=>l,n.getUsageDisabled=()=>c,n.getPositionalGroupName=()=>i("Positionals:");let f=[];n.example=(t,e)=>{f.push([t,e||""])};let d=[];n.command=function(t,e,s,i,n=!1){s&&(d=d.map((t=>(t[2]=!1,t)))),d.push([t,e||"",s,i,n])},n.getCommands=()=>d;let u={};n.describe=function(t,e){Array.isArray(t)?t.forEach((t=>{n.describe(t,e)})):"object"==typeof t?Object.keys(t).forEach((e=>{n.describe(e,t[e])})):u[t]=e},n.getDescriptions=()=>u;let p=[];n.epilog=t=>{p.push(t)};let m,y=!1;function b(){return y||(m=function(){const t=80;return s.process.stdColumns?Math.min(t,s.process.stdColumns):t}(),y=!0),m}n.wrap=t=>{y=!0,m=t};const v="__yargsString__:";function O(t,e,i){let n=0;return Array.isArray(t)||(t=Object.values(t).map((t=>[t]))),t.forEach((t=>{n=Math.max(s.stringWidth(i?`${i} ${I(t[0])}`:I(t[0]))+$(t[0]),n)})),e&&(n=Math.min(n,parseInt((.5*e).toString(),10))),n}let w;function C(e){return t.getOptions().hiddenOptions.indexOf(e)<0||t.parsed.argv[t.getOptions().showHiddenOpt]}function j(t,e){let s=`[${i("default:")} `;if(void 0===t&&!e)return null;if(e)s+=e;else switch(typeof t){case"string":s+=`"${t}"`;break;case"object":s+=JSON.stringify(t);break;default:s+=t}return`${s}]`}n.deferY18nLookup=t=>v+t,n.help=function(){if(w)return w;!function(){const e=t.getDemandedOptions(),s=t.getOptions();(Object.keys(s.alias)||[]).forEach((i=>{s.alias[i].forEach((r=>{u[r]&&n.describe(i,u[r]),r in e&&t.demandOption(i,e[r]),s.boolean.includes(r)&&t.boolean(i),s.count.includes(r)&&t.count(i),s.string.includes(r)&&t.string(i),s.normalize.includes(r)&&t.normalize(i),s.array.includes(r)&&t.array(i),s.number.includes(r)&&t.number(i)}))}))}();const e=t.customScriptName?t.$0:s.path.basename(t.$0),r=t.getDemandedOptions(),o=t.getDemandedCommands(),a=t.getDeprecatedOptions(),h=t.getGroups(),g=t.getOptions();let m=[];m=m.concat(Object.keys(u)),m=m.concat(Object.keys(r)),m=m.concat(Object.keys(o)),m=m.concat(Object.keys(g.default)),m=m.filter(C),m=Object.keys(m.reduce(((t,e)=>("_"!==e&&(t[e]=!0),t)),{}));const y=b(),_=s.cliui({width:y,wrap:!!y});if(!c)if(l.length)l.forEach((t=>{_.div({text:`${t[0].replace(/\$0/g,e)}`}),t[1]&&_.div({text:`${t[1]}`,padding:[1,0,0,0]})})),_.div();else if(d.length){let t=null;t=o._?`${e} <${i("command")}>\n`:`${e} [${i("command")}]\n`,_.div(`${t}`)}if(d.length>1||1===d.length&&!d[0][2]){_.div(i("Commands:"));const s=t.getInternalMethods().getContext(),n=s.commands.length?`${s.commands.join(" ")} `:"";!0===t.getInternalMethods().getParserConfiguration()["sort-commands"]&&(d=d.sort(((t,e)=>t[0].localeCompare(e[0]))));const r=e?`${e} `:"";d.forEach((t=>{const s=`${r}${n}${t[0].replace(/^\$0 ?/,"")}`;_.span({text:s,padding:[0,2,0,2],width:O(d,y,`${e}${n}`)+4},{text:t[1]});const o=[];t[2]&&o.push(`[${i("default")}]`),t[3]&&t[3].length&&o.push(`[${i("aliases:")} ${t[3].join(", ")}]`),t[4]&&("string"==typeof t[4]?o.push(`[${i("deprecated: %s",t[4])}]`):o.push(`[${i("deprecated")}]`)),o.length?_.div({text:o.join(" "),padding:[0,0,0,2],align:"right"}):_.div()})),_.div()}const M=(Object.keys(g.alias)||[]).concat(Object.keys(t.parsed.newAliases)||[]);m=m.filter((e=>!t.parsed.newAliases[e]&&M.every((t=>-1===(g.alias[t]||[]).indexOf(e)))));const k=i("Options:");h[k]||(h[k]=[]),function(t,e,s,i){let n=[],r=null;Object.keys(s).forEach((t=>{n=n.concat(s[t])})),t.forEach((t=>{r=[t].concat(e[t]),r.some((t=>-1!==n.indexOf(t)))||s[i].push(t)}))}(m,g.alias,h,k);const E=t=>/^--/.test(I(t)),x=Object.keys(h).filter((t=>h[t].length>0)).map((t=>({groupName:t,normalizedKeys:h[t].filter(C).map((t=>{if(M.includes(t))return t;for(let e,s=0;void 0!==(e=M[s]);s++)if((g.alias[e]||[]).includes(t))return e;return t}))}))).filter((({normalizedKeys:t})=>t.length>0)).map((({groupName:t,normalizedKeys:e})=>{const s=e.reduce(((e,s)=>(e[s]=[s].concat(g.alias[s]||[]).map((e=>t===n.getPositionalGroupName()?e:(/^[0-9]$/.test(e)?g.boolean.includes(s)?"-":"--":e.length>1?"--":"-")+e)).sort(((t,e)=>E(t)===E(e)?0:E(t)?1:-1)).join(", "),e)),{});return{groupName:t,normalizedKeys:e,switches:s}}));if(x.filter((({groupName:t})=>t!==n.getPositionalGroupName())).some((({normalizedKeys:t,switches:e})=>!t.every((t=>E(e[t])))))&&x.filter((({groupName:t})=>t!==n.getPositionalGroupName())).forEach((({normalizedKeys:t,switches:e})=>{t.forEach((t=>{var s,i;E(e[t])&&(e[t]=(s=e[t],i="-x, ".length,P(s)?{text:s.text,indentation:s.indentation+i}:{text:s,indentation:i}))}))})),x.forEach((({groupName:t,normalizedKeys:e,switches:s})=>{_.div(t),e.forEach((t=>{const e=s[t];let o=u[t]||"",h=null;o.includes(v)&&(o=i(o.substring(v.length))),g.boolean.includes(t)&&(h=`[${i("boolean")}]`),g.count.includes(t)&&(h=`[${i("count")}]`),g.string.includes(t)&&(h=`[${i("string")}]`),g.normalize.includes(t)&&(h=`[${i("string")}]`),g.array.includes(t)&&(h=`[${i("array")}]`),g.number.includes(t)&&(h=`[${i("number")}]`);const l=[t in a?(c=a[t],"string"==typeof c?`[${i("deprecated: %s",c)}]`:`[${i("deprecated")}]`):null,h,t in r?`[${i("required")}]`:null,g.choices&&g.choices[t]?`[${i("choices:")} ${n.stringifiedValues(g.choices[t])}]`:null,j(g.default[t],g.defaultDescription[t])].filter(Boolean).join(" ");var c;_.span({text:I(e),padding:[0,2,0,2+$(e)],width:O(s,y)+4},o),l?_.div({text:l,padding:[0,0,0,2],align:"right"}):_.div()})),_.div()})),f.length&&(_.div(i("Examples:")),f.forEach((t=>{t[0]=t[0].replace(/\$0/g,e)})),f.forEach((t=>{""===t[1]?_.div({text:t[0],padding:[0,2,0,2]}):_.div({text:t[0],padding:[0,2,0,2],width:O(f,y)+4},{text:t[1]})})),_.div()),p.length>0){const t=p.map((t=>t.replace(/\$0/g,e))).join("\n");_.div(`${t}\n`)}return _.toString().replace(/\s*$/,"")},n.cacheHelpMessage=function(){w=this.help()},n.clearCachedHelpMessage=function(){w=void 0},n.hasCachedHelpMessage=function(){return!!w},n.showHelp=e=>{const s=t.getInternalMethods().getLoggerInstance();e||(e="error");("function"==typeof e?e:s[e])(n.help())},n.functionDescription=t=>["(",t.name?s.Parser.decamelize(t.name,"-"):i("generated-value"),")"].join(""),n.stringifiedValues=function(t,e){let s="";const i=e||", ",n=[].concat(t);return t&&n.length?(n.forEach((t=>{s.length&&(s+=i),s+=JSON.stringify(t)})),s):s};let _=null;n.version=t=>{_=t},n.showVersion=e=>{const s=t.getInternalMethods().getLoggerInstance();e||(e="error");("function"==typeof e?e:s[e])(_)},n.reset=function(t){return o=null,h=!1,l=[],c=!1,p=[],f=[],d=[],u=g(u,(e=>!t[e])),n};const M=[];return n.freeze=function(){M.push({failMessage:o,failureOutput:h,usages:l,usageDisabled:c,epilogs:p,examples:f,commands:d,descriptions:u})},n.unfreeze=function(){const t=M.pop();t&&({failMessage:o,failureOutput:h,usages:l,usageDisabled:c,epilogs:p,examples:f,commands:d,descriptions:u}=t)},n}function P(t){return"object"==typeof t}function $(t){return P(t)?t.indentation:0}function I(t){return P(t)?t.text:t}class D{constructor(t,e,s,i){var n,r,o;this.yargs=t,this.usage=e,this.command=s,this.shim=i,this.completionKey="get-yargs-completions",this.aliases=null,this.customCompletionFunction=null,this.zshShell=null!==(o=(null===(n=this.shim.getEnv("SHELL"))||void 0===n?void 0:n.includes("zsh"))||(null===(r=this.shim.getEnv("ZSH_NAME"))||void 0===r?void 0:r.includes("zsh")))&&void 0!==o&&o}defaultCompletion(t,e,s,i){const n=this.command.getCommandHandlers();for(let e=0,s=t.length;e<s;++e)if(n[t[e]]&&n[t[e]].builder){const s=n[t[e]].builder;if(E(s)){const t=this.yargs.getInternalMethods().reset();return s(t,!0),t.argv}}const r=[];this.commandCompletions(r,t,s),this.optionCompletions(r,t,e,s),this.choicesCompletions(r,t,e,s),i(null,r)}commandCompletions(t,e,s){const i=this.yargs.getInternalMethods().getContext().commands;s.match(/^-/)||i[i.length-1]===s||this.previousArgHasChoices(e)||this.usage.getCommands().forEach((s=>{const i=o(s[0]).cmd;if(-1===e.indexOf(i))if(this.zshShell){const e=s[1]||"";t.push(i.replace(/:/g,"\\:")+":"+e)}else t.push(i)}))}optionCompletions(t,e,s,i){if((i.match(/^-/)||""===i&&0===t.length)&&!this.previousArgHasChoices(e)){const n=this.yargs.getOptions(),r=this.yargs.getGroups()[this.usage.getPositionalGroupName()]||[];Object.keys(n.key).forEach((o=>{const a=!!n.configuration["boolean-negation"]&&n.boolean.includes(o);r.includes(o)||this.argsContainKey(e,s,o,a)||(this.completeOptionKey(o,t,i),a&&n.default[o]&&this.completeOptionKey(`no-${o}`,t,i))}))}}choicesCompletions(t,e,s,i){if(this.previousArgHasChoices(e)){const s=this.getPreviousArgChoices(e);s&&s.length>0&&t.push(...s)}}getPreviousArgChoices(t){if(t.length<1)return;let e=t[t.length-1],s="";if(!e.startsWith("--")&&t.length>1&&(s=e,e=t[t.length-2]),!e.startsWith("--"))return;const i=e.replace(/-/g,""),n=this.yargs.getOptions();return Object.keys(n.key).some((t=>t===i))&&Array.isArray(n.choices[i])?n.choices[i].filter((t=>!s||t.startsWith(s))):void 0}previousArgHasChoices(t){const e=this.getPreviousArgChoices(t);return void 0!==e&&e.length>0}argsContainKey(t,e,s,i){if(-1!==t.indexOf(`--${s}`))return!0;if(i&&-1!==t.indexOf(`--no-${s}`))return!0;if(this.aliases)for(const t of this.aliases[s])if(void 0!==e[t])return!0;return!1}completeOptionKey(t,e,s){const i=this.usage.getDescriptions(),n=!/^--/.test(s)&&(t=>/^[^0-9]$/.test(t))(t)?"-":"--";if(this.zshShell){const s=i[t]||"";e.push(n+`${t.replace(/:/g,"\\:")}:${s.replace("__yargsString__:","")}`)}else e.push(n+t)}customCompletion(t,e,s,i){if(d(this.customCompletionFunction,null,this.shim),this.customCompletionFunction.length<3){const t=this.customCompletionFunction(s,e);return f(t)?t.then((t=>{this.shim.process.nextTick((()=>{i(null,t)}))})).catch((t=>{this.shim.process.nextTick((()=>{i(t,void 0)}))})):i(null,t)}return function(t){return t.length>3}(this.customCompletionFunction)?this.customCompletionFunction(s,e,((n=i)=>this.defaultCompletion(t,e,s,n)),(t=>{i(null,t)})):this.customCompletionFunction(s,e,(t=>{i(null,t)}))}getCompletion(t,e){const s=t.length?t[t.length-1]:"",i=this.yargs.parse(t,!0),n=this.customCompletionFunction?i=>this.customCompletion(t,i,s,e):i=>this.defaultCompletion(t,i,s,e);return f(i)?i.then(n):n(i)}generateCompletionScript(t,e){let s=this.zshShell?'#compdef {{app_name}}\n###-begin-{{app_name}}-completions-###\n#\n# yargs command completion script\n#\n# Installation: {{app_path}} {{completion_command}} >> ~/.zshrc\n#    or {{app_path}} {{completion_command}} >> ~/.zsh_profile on OSX.\n#\n_{{app_name}}_yargs_completions()\n{\n  local reply\n  local si=$IFS\n  IFS=$\'\n\' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" {{app_path}} --get-yargs-completions "${words[@]}"))\n  IFS=$si\n  _describe \'values\' reply\n}\ncompdef _{{app_name}}_yargs_completions {{app_name}}\n###-end-{{app_name}}-completions-###\n':'###-begin-{{app_name}}-completions-###\n#\n# yargs command completion script\n#\n# Installation: {{app_path}} {{completion_command}} >> ~/.bashrc\n#    or {{app_path}} {{completion_command}} >> ~/.bash_profile on OSX.\n#\n_{{app_name}}_yargs_completions()\n{\n    local cur_word args type_list\n\n    cur_word="${COMP_WORDS[COMP_CWORD]}"\n    args=("${COMP_WORDS[@]}")\n\n    # ask yargs to generate completions.\n    type_list=$({{app_path}} --get-yargs-completions "${args[@]}")\n\n    COMPREPLY=( $(compgen -W "${type_list}" -- ${cur_word}) )\n\n    # if no match was found, fall back to filename completion\n    if [ ${#COMPREPLY[@]} -eq 0 ]; then\n      COMPREPLY=()\n    fi\n\n    return 0\n}\ncomplete -o default -F _{{app_name}}_yargs_completions {{app_name}}\n###-end-{{app_name}}-completions-###\n';const i=this.shim.path.basename(t);return t.match(/\.js$/)&&(t=`./${t}`),s=s.replace(/{{app_name}}/g,i),s=s.replace(/{{completion_command}}/g,e),s.replace(/{{app_path}}/g,t)}registerFunction(t){this.customCompletionFunction=t}setParsed(t){this.aliases=t.aliases}}function N(t,e){if(0===t.length)return e.length;if(0===e.length)return t.length;const s=[];let i,n;for(i=0;i<=e.length;i++)s[i]=[i];for(n=0;n<=t.length;n++)s[0][n]=n;for(i=1;i<=e.length;i++)for(n=1;n<=t.length;n++)e.charAt(i-1)===t.charAt(n-1)?s[i][n]=s[i-1][n-1]:i>1&&n>1&&e.charAt(i-2)===t.charAt(n-1)&&e.charAt(i-1)===t.charAt(n-2)?s[i][n]=s[i-2][n-2]+1:s[i][n]=Math.min(s[i-1][n-1]+1,Math.min(s[i][n-1]+1,s[i-1][n]+1));return s[e.length][t.length]}const H=["$0","--","_"];var z,q,W,U,F,L,V,T,R,G,K,B,Y,J,Z,X,Q,tt,et,st,it,nt,rt,ot,at,ht,lt,ct,ft,dt,ut,pt,gt;const mt=Symbol("copyDoubleDash"),yt=Symbol("copyDoubleDash"),bt=Symbol("deleteFromParserHintObject"),vt=Symbol("emitWarning"),Ot=Symbol("freeze"),wt=Symbol("getDollarZero"),Ct=Symbol("getParserConfiguration"),jt=Symbol("guessLocale"),_t=Symbol("guessVersion"),Mt=Symbol("parsePositionalNumbers"),kt=Symbol("pkgUp"),Et=Symbol("populateParserHintArray"),xt=Symbol("populateParserHintSingleValueDictionary"),At=Symbol("populateParserHintArrayDictionary"),St=Symbol("populateParserHintDictionary"),Pt=Symbol("sanitizeKey"),$t=Symbol("setKey"),It=Symbol("unfreeze"),Dt=Symbol("validateAsync"),Nt=Symbol("getCommandInstance"),Ht=Symbol("getContext"),zt=Symbol("getHasOutput"),qt=Symbol("getLoggerInstance"),Wt=Symbol("getParseContext"),Ut=Symbol("getUsageInstance"),Ft=Symbol("getValidationInstance"),Lt=Symbol("hasParseCallback"),Vt=Symbol("postProcess"),Tt=Symbol("rebase"),Rt=Symbol("reset"),Gt=Symbol("runYargsParserAndExecuteCommands"),Kt=Symbol("runValidation"),Bt=Symbol("setHasOutput"),Yt=Symbol("kTrackManuallySetKeys");class Jt{constructor(t=[],e,s,i){this.customScriptName=!1,this.parsed=!1,z.set(this,void 0),q.set(this,void 0),W.set(this,{commands:[],fullCommands:[]}),U.set(this,null),F.set(this,null),L.set(this,"show-hidden"),V.set(this,null),T.set(this,!0),R.set(this,{}),G.set(this,!0),K.set(this,[]),B.set(this,void 0),Y.set(this,{}),J.set(this,!1),Z.set(this,null),X.set(this,void 0),Q.set(this,""),tt.set(this,void 0),et.set(this,void 0),st.set(this,{}),it.set(this,null),nt.set(this,null),rt.set(this,{}),ot.set(this,{}),at.set(this,void 0),ht.set(this,!1),lt.set(this,void 0),ct.set(this,!1),ft.set(this,!1),dt.set(this,!1),ut.set(this,void 0),pt.set(this,null),gt.set(this,void 0),O(this,lt,i,"f"),O(this,at,t,"f"),O(this,q,e,"f"),O(this,et,s,"f"),O(this,B,new w(this),"f"),this.$0=this[wt](),this[Rt](),O(this,z,v(this,z,"f"),"f"),O(this,ut,v(this,ut,"f"),"f"),O(this,gt,v(this,gt,"f"),"f"),O(this,tt,v(this,tt,"f"),"f"),v(this,tt,"f").showHiddenOpt=v(this,L,"f"),O(this,X,this[yt](),"f")}addHelpOpt(t,e){return h("[string|boolean] [string]",[t,e],arguments.length),v(this,Z,"f")&&(this[bt](v(this,Z,"f")),O(this,Z,null,"f")),!1===t&&void 0===e||(O(this,Z,"string"==typeof t?t:"help","f"),this.boolean(v(this,Z,"f")),this.describe(v(this,Z,"f"),e||v(this,ut,"f").deferY18nLookup("Show help"))),this}help(t,e){return this.addHelpOpt(t,e)}addShowHiddenOpt(t,e){if(h("[string|boolean] [string]",[t,e],arguments.length),!1===t&&void 0===e)return this;const s="string"==typeof t?t:v(this,L,"f");return this.boolean(s),this.describe(s,e||v(this,ut,"f").deferY18nLookup("Show hidden options")),v(this,tt,"f").showHiddenOpt=s,this}showHidden(t,e){return this.addShowHiddenOpt(t,e)}alias(t,e){return h("<object|string|array> [string|array]",[t,e],arguments.length),this[At](this.alias.bind(this),"alias",t,e),this}array(t){return h("<array|string>",[t],arguments.length),this[Et]("array",t),this[Yt](t),this}boolean(t){return h("<array|string>",[t],arguments.length),this[Et]("boolean",t),this[Yt](t),this}check(t,e){return h("<function> [boolean]",[t,e],arguments.length),this.middleware(((e,s)=>j((()=>t(e)),(s=>(s?("string"==typeof s||s instanceof Error)&&v(this,ut,"f").fail(s.toString(),s):v(this,ut,"f").fail(v(this,lt,"f").y18n.__("Argument check failed: %s",t.toString())),e)),(t=>(v(this,ut,"f").fail(t.message?t.message:t.toString(),t),e)))),!1,e),this}choices(t,e){return h("<object|string|array> [string|array]",[t,e],arguments.length),this[At](this.choices.bind(this),"choices",t,e),this}coerce(t,s){if(h("<object|string|array> [function]",[t,s],arguments.length),Array.isArray(t)){if(!s)throw new e("coerce callback must be provided");for(const e of t)this.coerce(e,s);return this}if("object"==typeof t){for(const e of Object.keys(t))this.coerce(e,t[e]);return this}if(!s)throw new e("coerce callback must be provided");return v(this,tt,"f").key[t]=!0,v(this,B,"f").addCoerceMiddleware(((i,n)=>{let r;return j((()=>(r=n.getAliases(),s(i[t]))),(e=>{if(i[t]=e,r[t])for(const s of r[t])i[s]=e;return i}),(t=>{throw new e(t.message)}))}),t),this}conflicts(t,e){return h("<string|object> [string|array]",[t,e],arguments.length),v(this,gt,"f").conflicts(t,e),this}config(t="config",e,s){return h("[object|string] [string|function] [function]",[t,e,s],arguments.length),"object"!=typeof t||Array.isArray(t)?("function"==typeof e&&(s=e,e=void 0),this.describe(t,e||v(this,ut,"f").deferY18nLookup("Path to JSON config file")),(Array.isArray(t)?t:[t]).forEach((t=>{v(this,tt,"f").config[t]=s||!0})),this):(t=n(t,v(this,q,"f"),this[Ct]()["deep-merge-config"]||!1,v(this,lt,"f")),v(this,tt,"f").configObjects=(v(this,tt,"f").configObjects||[]).concat(t),this)}completion(t,e,s){return h("[string] [string|boolean|function] [function]",[t,e,s],arguments.length),"function"==typeof e&&(s=e,e=void 0),O(this,F,t||v(this,F,"f")||"completion","f"),e||!1===e||(e="generate completion script"),this.command(v(this,F,"f"),e),s&&v(this,U,"f").registerFunction(s),this}command(t,e,s,i,n,r){return h("<string|array|object> [string|boolean] [function|object] [function] [array] [boolean|string]",[t,e,s,i,n,r],arguments.length),v(this,z,"f").addHandler(t,e,s,i,n,r),this}commands(t,e,s,i,n,r){return this.command(t,e,s,i,n,r)}commandDir(t,e){h("<string> [object]",[t,e],arguments.length);const s=v(this,et,"f")||v(this,lt,"f").require;return v(this,z,"f").addDirectory(t,s,v(this,lt,"f").getCallerFile(),e),this}count(t){return h("<array|string>",[t],arguments.length),this[Et]("count",t),this[Yt](t),this}default(t,e,s){return h("<object|string|array> [*] [string]",[t,e,s],arguments.length),s&&(u(t,v(this,lt,"f")),v(this,tt,"f").defaultDescription[t]=s),"function"==typeof e&&(u(t,v(this,lt,"f")),v(this,tt,"f").defaultDescription[t]||(v(this,tt,"f").defaultDescription[t]=v(this,ut,"f").functionDescription(e)),e=e.call()),this[xt](this.default.bind(this),"default",t,e),this}defaults(t,e,s){return this.default(t,e,s)}demandCommand(t=1,e,s,i){return h("[number] [number|string] [string|null|undefined] [string|null|undefined]",[t,e,s,i],arguments.length),"number"!=typeof e&&(s=e,e=1/0),this.global("_",!1),v(this,tt,"f").demandedCommands._={min:t,max:e,minMsg:s,maxMsg:i},this}demand(t,e,s){return Array.isArray(e)?(e.forEach((t=>{d(s,!0,v(this,lt,"f")),this.demandOption(t,s)})),e=1/0):"number"!=typeof e&&(s=e,e=1/0),"number"==typeof t?(d(s,!0,v(this,lt,"f")),this.demandCommand(t,e,s,s)):Array.isArray(t)?t.forEach((t=>{d(s,!0,v(this,lt,"f")),this.demandOption(t,s)})):"string"==typeof s?this.demandOption(t,s):!0!==s&&void 0!==s||this.demandOption(t),this}demandOption(t,e){return h("<object|string|array> [string]",[t,e],arguments.length),this[xt](this.demandOption.bind(this),"demandedOptions",t,e),this}deprecateOption(t,e){return h("<string> [string|boolean]",[t,e],arguments.length),v(this,tt,"f").deprecatedOptions[t]=e,this}describe(t,e){return h("<object|string|array> [string]",[t,e],arguments.length),this[$t](t,!0),v(this,ut,"f").describe(t,e),this}detectLocale(t){return h("<boolean>",[t],arguments.length),O(this,T,t,"f"),this}env(t){return h("[string|boolean]",[t],arguments.length),!1===t?delete v(this,tt,"f").envPrefix:v(this,tt,"f").envPrefix=t||"",this}epilogue(t){return h("<string>",[t],arguments.length),v(this,ut,"f").epilog(t),this}epilog(t){return this.epilogue(t)}example(t,e){return h("<string|array> [string]",[t,e],arguments.length),Array.isArray(t)?t.forEach((t=>this.example(...t))):v(this,ut,"f").example(t,e),this}exit(t,e){O(this,J,!0,"f"),O(this,V,e,"f"),v(this,G,"f")&&v(this,lt,"f").process.exit(t)}exitProcess(t=!0){return h("[boolean]",[t],arguments.length),O(this,G,t,"f"),this}fail(t){if(h("<function|boolean>",[t],arguments.length),"boolean"==typeof t&&!1!==t)throw new e("Invalid first argument. Expected function or boolean 'false'");return v(this,ut,"f").failFn(t),this}getAliases(){return this.parsed?this.parsed.aliases:{}}async getCompletion(t,e){return h("<array> [function]",[t,e],arguments.length),e?v(this,U,"f").getCompletion(t,e):new Promise(((e,s)=>{v(this,U,"f").getCompletion(t,((t,i)=>{t?s(t):e(i)}))}))}getDemandedOptions(){return h([],0),v(this,tt,"f").demandedOptions}getDemandedCommands(){return h([],0),v(this,tt,"f").demandedCommands}getDeprecatedOptions(){return h([],0),v(this,tt,"f").deprecatedOptions}getDetectLocale(){return v(this,T,"f")}getExitProcess(){return v(this,G,"f")}getGroups(){return Object.assign({},v(this,Y,"f"),v(this,ot,"f"))}getHelp(){if(O(this,J,!0,"f"),!v(this,ut,"f").hasCachedHelpMessage()){if(!this.parsed){const t=this[Gt](v(this,at,"f"),void 0,void 0,0,!0);if(f(t))return t.then((()=>v(this,ut,"f").help()))}const t=v(this,z,"f").runDefaultBuilderOn(this);if(f(t))return t.then((()=>v(this,ut,"f").help()))}return Promise.resolve(v(this,ut,"f").help())}getOptions(){return v(this,tt,"f")}getStrict(){return v(this,ct,"f")}getStrictCommands(){return v(this,ft,"f")}getStrictOptions(){return v(this,dt,"f")}global(t,e){return h("<string|array> [boolean]",[t,e],arguments.length),t=[].concat(t),!1!==e?v(this,tt,"f").local=v(this,tt,"f").local.filter((e=>-1===t.indexOf(e))):t.forEach((t=>{v(this,tt,"f").local.includes(t)||v(this,tt,"f").local.push(t)})),this}group(t,e){h("<string|array> <string>",[t,e],arguments.length);const s=v(this,ot,"f")[e]||v(this,Y,"f")[e];v(this,ot,"f")[e]&&delete v(this,ot,"f")[e];const i={};return v(this,Y,"f")[e]=(s||[]).concat(t).filter((t=>!i[t]&&(i[t]=!0))),this}hide(t){return h("<string>",[t],arguments.length),v(this,tt,"f").hiddenOptions.push(t),this}implies(t,e){return h("<string|object> [number|string|array]",[t,e],arguments.length),v(this,gt,"f").implies(t,e),this}locale(t){return h("[string]",[t],arguments.length),t?(O(this,T,!1,"f"),v(this,lt,"f").y18n.setLocale(t),this):(this[jt](),v(this,lt,"f").y18n.getLocale())}middleware(t,e,s){return v(this,B,"f").addMiddleware(t,!!e,s)}nargs(t,e){return h("<string|object|array> [number]",[t,e],arguments.length),this[xt](this.nargs.bind(this),"narg",t,e),this}normalize(t){return h("<array|string>",[t],arguments.length),this[Et]("normalize",t),this}number(t){return h("<array|string>",[t],arguments.length),this[Et]("number",t),this[Yt](t),this}option(t,e){if(h("<string|object> [object]",[t,e],arguments.length),"object"==typeof t)Object.keys(t).forEach((e=>{this.options(e,t[e])}));else{"object"!=typeof e&&(e={}),this[Yt](t),!v(this,pt,"f")||"version"!==t&&"version"!==(null==e?void 0:e.alias)||this[vt](['"version" is a reserved word.',"Please do one of the following:",'- Disable version with `yargs.version(false)` if using "version" as an option',"- Use the built-in `yargs.version` method instead (if applicable)","- Use a different option key","https://yargs.js.org/docs/#api-reference-version"].join("\n"),void 0,"versionWarning"),v(this,tt,"f").key[t]=!0,e.alias&&this.alias(t,e.alias);const s=e.deprecate||e.deprecated;s&&this.deprecateOption(t,s);const i=e.demand||e.required||e.require;i&&this.demand(t,i),e.demandOption&&this.demandOption(t,"string"==typeof e.demandOption?e.demandOption:void 0),e.conflicts&&this.conflicts(t,e.conflicts),"default"in e&&this.default(t,e.default),void 0!==e.implies&&this.implies(t,e.implies),void 0!==e.nargs&&this.nargs(t,e.nargs),e.config&&this.config(t,e.configParser),e.normalize&&this.normalize(t),e.choices&&this.choices(t,e.choices),e.coerce&&this.coerce(t,e.coerce),e.group&&this.group(t,e.group),(e.boolean||"boolean"===e.type)&&(this.boolean(t),e.alias&&this.boolean(e.alias)),(e.array||"array"===e.type)&&(this.array(t),e.alias&&this.array(e.alias)),(e.number||"number"===e.type)&&(this.number(t),e.alias&&this.number(e.alias)),(e.string||"string"===e.type)&&(this.string(t),e.alias&&this.string(e.alias)),(e.count||"count"===e.type)&&this.count(t),"boolean"==typeof e.global&&this.global(t,e.global),e.defaultDescription&&(v(this,tt,"f").defaultDescription[t]=e.defaultDescription),e.skipValidation&&this.skipValidation(t);const n=e.describe||e.description||e.desc;this.describe(t,n),e.hidden&&this.hide(t),e.requiresArg&&this.requiresArg(t)}return this}options(t,e){return this.option(t,e)}parse(t,e,s){h("[string|array] [function|boolean|object] [function]",[t,e,s],arguments.length),this[Ot](),void 0===t&&(t=v(this,at,"f")),"object"==typeof e&&(O(this,nt,e,"f"),e=s),"function"==typeof e&&(O(this,it,e,"f"),e=!1),e||O(this,at,t,"f"),v(this,it,"f")&&O(this,G,!1,"f");const i=this[Gt](t,!!e),n=this.parsed;return v(this,U,"f").setParsed(this.parsed),f(i)?i.then((t=>(v(this,it,"f")&&v(this,it,"f").call(this,v(this,V,"f"),t,v(this,Q,"f")),t))).catch((t=>{throw v(this,it,"f")&&v(this,it,"f")(t,this.parsed.argv,v(this,Q,"f")),t})).finally((()=>{this[It](),this.parsed=n})):(v(this,it,"f")&&v(this,it,"f").call(this,v(this,V,"f"),i,v(this,Q,"f")),this[It](),this.parsed=n,i)}parseAsync(t,e,s){const i=this.parse(t,e,s);return f(i)?i:Promise.resolve(i)}parseSync(t,s,i){const n=this.parse(t,s,i);if(f(n))throw new e(".parseSync() must not be used with asynchronous builders, handlers, or middleware");return n}parserConfiguration(t){return h("<object>",[t],arguments.length),O(this,st,t,"f"),this}pkgConf(t,e){h("<string> [string]",[t,e],arguments.length);let s=null;const i=this[kt](e||v(this,q,"f"));return i[t]&&"object"==typeof i[t]&&(s=n(i[t],e||v(this,q,"f"),this[Ct]()["deep-merge-config"]||!1,v(this,lt,"f")),v(this,tt,"f").configObjects=(v(this,tt,"f").configObjects||[]).concat(s)),this}positional(t,e){h("<string> <object>",[t,e],arguments.length);const s=["default","defaultDescription","implies","normalize","choices","conflicts","coerce","type","describe","desc","description","alias"];e=g(e,((t,e)=>!("type"===t&&!["string","number","boolean"].includes(e))&&s.includes(t)));const i=v(this,W,"f").fullCommands[v(this,W,"f").fullCommands.length-1],n=i?v(this,z,"f").cmdToParseOptions(i):{array:[],alias:{},default:{},demand:{}};return p(n).forEach((s=>{const i=n[s];Array.isArray(i)?-1!==i.indexOf(t)&&(e[s]=!0):i[t]&&!(s in e)&&(e[s]=i[t])})),this.group(t,v(this,ut,"f").getPositionalGroupName()),this.option(t,e)}recommendCommands(t=!0){return h("[boolean]",[t],arguments.length),O(this,ht,t,"f"),this}required(t,e,s){return this.demand(t,e,s)}require(t,e,s){return this.demand(t,e,s)}requiresArg(t){return h("<array|string|object> [number]",[t],arguments.length),"string"==typeof t&&v(this,tt,"f").narg[t]||this[xt](this.requiresArg.bind(this),"narg",t,NaN),this}showCompletionScript(t,e){return h("[string] [string]",[t,e],arguments.length),t=t||this.$0,v(this,X,"f").log(v(this,U,"f").generateCompletionScript(t,e||v(this,F,"f")||"completion")),this}showHelp(t){if(h("[string|function]",[t],arguments.length),O(this,J,!0,"f"),!v(this,ut,"f").hasCachedHelpMessage()){if(!this.parsed){const e=this[Gt](v(this,at,"f"),void 0,void 0,0,!0);if(f(e))return e.then((()=>{v(this,ut,"f").showHelp(t)})),this}const e=v(this,z,"f").runDefaultBuilderOn(this);if(f(e))return e.then((()=>{v(this,ut,"f").showHelp(t)})),this}return v(this,ut,"f").showHelp(t),this}scriptName(t){return this.customScriptName=!0,this.$0=t,this}showHelpOnFail(t,e){return h("[boolean|string] [string]",[t,e],arguments.length),v(this,ut,"f").showHelpOnFail(t,e),this}showVersion(t){return h("[string|function]",[t],arguments.length),v(this,ut,"f").showVersion(t),this}skipValidation(t){return h("<array|string>",[t],arguments.length),this[Et]("skipValidation",t),this}strict(t){return h("[boolean]",[t],arguments.length),O(this,ct,!1!==t,"f"),this}strictCommands(t){return h("[boolean]",[t],arguments.length),O(this,ft,!1!==t,"f"),this}strictOptions(t){return h("[boolean]",[t],arguments.length),O(this,dt,!1!==t,"f"),this}string(t){return h("<array|string>",[t],arguments.length),this[Et]("string",t),this[Yt](t),this}terminalWidth(){return h([],0),v(this,lt,"f").process.stdColumns}updateLocale(t){return this.updateStrings(t)}updateStrings(t){return h("<object>",[t],arguments.length),O(this,T,!1,"f"),v(this,lt,"f").y18n.updateLocale(t),this}usage(t,s,i,n){if(h("<string|null|undefined> [string|boolean] [function|object] [function]",[t,s,i,n],arguments.length),void 0!==s){if(d(t,null,v(this,lt,"f")),(t||"").match(/^\$0( |$)/))return this.command(t,s,i,n);throw new e(".usage() description must start with $0 if being used as alias for .command()")}return v(this,ut,"f").usage(t),this}version(t,e,s){const i="version";if(h("[boolean|string] [string] [string]",[t,e,s],arguments.length),v(this,pt,"f")&&(this[bt](v(this,pt,"f")),v(this,ut,"f").version(void 0),O(this,pt,null,"f")),0===arguments.length)s=this[_t](),t=i;else if(1===arguments.length){if(!1===t)return this;s=t,t=i}else 2===arguments.length&&(s=e,e=void 0);return O(this,pt,"string"==typeof t?t:i,"f"),e=e||v(this,ut,"f").deferY18nLookup("Show version number"),v(this,ut,"f").version(s||void 0),this.boolean(v(this,pt,"f")),this.describe(v(this,pt,"f"),e),this}wrap(t){return h("<number|null|undefined>",[t],arguments.length),v(this,ut,"f").wrap(t),this}[(z=new WeakMap,q=new WeakMap,W=new WeakMap,U=new WeakMap,F=new WeakMap,L=new WeakMap,V=new WeakMap,T=new WeakMap,R=new WeakMap,G=new WeakMap,K=new WeakMap,B=new WeakMap,Y=new WeakMap,J=new WeakMap,Z=new WeakMap,X=new WeakMap,Q=new WeakMap,tt=new WeakMap,et=new WeakMap,st=new WeakMap,it=new WeakMap,nt=new WeakMap,rt=new WeakMap,ot=new WeakMap,at=new WeakMap,ht=new WeakMap,lt=new WeakMap,ct=new WeakMap,ft=new WeakMap,dt=new WeakMap,ut=new WeakMap,pt=new WeakMap,gt=new WeakMap,mt)](t){if(!t._||!t["--"])return t;t._.push.apply(t._,t["--"]);try{delete t["--"]}catch(t){}return t}[yt](){return{log:(...t)=>{this[Lt]()||console.log(...t),O(this,J,!0,"f"),v(this,Q,"f").length&&O(this,Q,v(this,Q,"f")+"\n","f"),O(this,Q,v(this,Q,"f")+t.join(" "),"f")},error:(...t)=>{this[Lt]()||console.error(...t),O(this,J,!0,"f"),v(this,Q,"f").length&&O(this,Q,v(this,Q,"f")+"\n","f"),O(this,Q,v(this,Q,"f")+t.join(" "),"f")}}}[bt](t){p(v(this,tt,"f")).forEach((e=>{if("configObjects"===e)return;const s=v(this,tt,"f")[e];Array.isArray(s)?s.includes(t)&&s.splice(s.indexOf(t),1):"object"==typeof s&&delete s[t]})),delete v(this,ut,"f").getDescriptions()[t]}[vt](t,e,s){v(this,R,"f")[s]||(v(this,lt,"f").process.emitWarning(t,e),v(this,R,"f")[s]=!0)}[Ot](){v(this,K,"f").push({options:v(this,tt,"f"),configObjects:v(this,tt,"f").configObjects.slice(0),exitProcess:v(this,G,"f"),groups:v(this,Y,"f"),strict:v(this,ct,"f"),strictCommands:v(this,ft,"f"),strictOptions:v(this,dt,"f"),completionCommand:v(this,F,"f"),output:v(this,Q,"f"),exitError:v(this,V,"f"),hasOutput:v(this,J,"f"),parsed:this.parsed,parseFn:v(this,it,"f"),parseContext:v(this,nt,"f")}),v(this,ut,"f").freeze(),v(this,gt,"f").freeze(),v(this,z,"f").freeze(),v(this,B,"f").freeze()}[wt](){let t,e="";return t=/\b(node|iojs|electron)(\.exe)?$/.test(v(this,lt,"f").process.argv()[0])?v(this,lt,"f").process.argv().slice(1,2):v(this,lt,"f").process.argv().slice(0,1),e=t.map((t=>{const e=this[Tt](v(this,q,"f"),t);return t.match(/^(\/|([a-zA-Z]:)?\\)/)&&e.length<t.length?e:t})).join(" ").trim(),v(this,lt,"f").getEnv("_")&&v(this,lt,"f").getProcessArgvBin()===v(this,lt,"f").getEnv("_")&&(e=v(this,lt,"f").getEnv("_").replace(`${v(this,lt,"f").path.dirname(v(this,lt,"f").process.execPath())}/`,"")),e}[Ct](){return v(this,st,"f")}[jt](){if(!v(this,T,"f"))return;const t=v(this,lt,"f").getEnv("LC_ALL")||v(this,lt,"f").getEnv("LC_MESSAGES")||v(this,lt,"f").getEnv("LANG")||v(this,lt,"f").getEnv("LANGUAGE")||"en_US";this.locale(t.replace(/[.:].*/,""))}[_t](){return this[kt]().version||"unknown"}[Mt](t){const e=t["--"]?t["--"]:t._;for(let t,s=0;void 0!==(t=e[s]);s++)v(this,lt,"f").Parser.looksLikeNumber(t)&&Number.isSafeInteger(Math.floor(parseFloat(`${t}`)))&&(e[s]=Number(t));return t}[kt](t){const e=t||"*";if(v(this,rt,"f")[e])return v(this,rt,"f")[e];let s={};try{let e=t||v(this,lt,"f").mainFilename;!t&&v(this,lt,"f").path.extname(e)&&(e=v(this,lt,"f").path.dirname(e));const i=v(this,lt,"f").findUp(e,((t,e)=>e.includes("package.json")?"package.json":void 0));d(i,void 0,v(this,lt,"f")),s=JSON.parse(v(this,lt,"f").readFileSync(i,"utf8"))}catch(t){}return v(this,rt,"f")[e]=s||{},v(this,rt,"f")[e]}[Et](t,e){(e=[].concat(e)).forEach((e=>{e=this[Pt](e),v(this,tt,"f")[t].push(e)}))}[xt](t,e,s,i){this[St](t,e,s,i,((t,e,s)=>{v(this,tt,"f")[t][e]=s}))}[At](t,e,s,i){this[St](t,e,s,i,((t,e,s)=>{v(this,tt,"f")[t][e]=(v(this,tt,"f")[t][e]||[]).concat(s)}))}[St](t,e,s,i,n){if(Array.isArray(s))s.forEach((e=>{t(e,i)}));else if((t=>"object"==typeof t)(s))for(const e of p(s))t(e,s[e]);else n(e,this[Pt](s),i)}[Pt](t){return"__proto__"===t?"___proto___":t}[$t](t,e){return this[xt](this[$t].bind(this),"key",t,e),this}[It](){var t,e,s,i,n,r,o,a,h,l,c,f;const u=v(this,K,"f").pop();let p;d(u,void 0,v(this,lt,"f")),t=this,e=this,s=this,i=this,n=this,r=this,o=this,a=this,h=this,l=this,c=this,f=this,({options:{set value(e){O(t,tt,e,"f")}}.value,configObjects:p,exitProcess:{set value(t){O(e,G,t,"f")}}.value,groups:{set value(t){O(s,Y,t,"f")}}.value,output:{set value(t){O(i,Q,t,"f")}}.value,exitError:{set value(t){O(n,V,t,"f")}}.value,hasOutput:{set value(t){O(r,J,t,"f")}}.value,parsed:this.parsed,strict:{set value(t){O(o,ct,t,"f")}}.value,strictCommands:{set value(t){O(a,ft,t,"f")}}.value,strictOptions:{set value(t){O(h,dt,t,"f")}}.value,completionCommand:{set value(t){O(l,F,t,"f")}}.value,parseFn:{set value(t){O(c,it,t,"f")}}.value,parseContext:{set value(t){O(f,nt,t,"f")}}.value}=u),v(this,tt,"f").configObjects=p,v(this,ut,"f").unfreeze(),v(this,gt,"f").unfreeze(),v(this,z,"f").unfreeze(),v(this,B,"f").unfreeze()}[Dt](t,e){return j(e,(e=>(t(e),e)))}getInternalMethods(){return{getCommandInstance:this[Nt].bind(this),getContext:this[Ht].bind(this),getHasOutput:this[zt].bind(this),getLoggerInstance:this[qt].bind(this),getParseContext:this[Wt].bind(this),getParserConfiguration:this[Ct].bind(this),getUsageInstance:this[Ut].bind(this),getValidationInstance:this[Ft].bind(this),hasParseCallback:this[Lt].bind(this),postProcess:this[Vt].bind(this),reset:this[Rt].bind(this),runValidation:this[Kt].bind(this),runYargsParserAndExecuteCommands:this[Gt].bind(this),setHasOutput:this[Bt].bind(this)}}[Nt](){return v(this,z,"f")}[Ht](){return v(this,W,"f")}[zt](){return v(this,J,"f")}[qt](){return v(this,X,"f")}[Wt](){return v(this,nt,"f")||{}}[Ut](){return v(this,ut,"f")}[Ft](){return v(this,gt,"f")}[Lt](){return!!v(this,it,"f")}[Vt](t,e,s,i){if(s)return t;if(f(t))return t;e||(t=this[mt](t));return(this[Ct]()["parse-positional-numbers"]||void 0===this[Ct]()["parse-positional-numbers"])&&(t=this[Mt](t)),i&&(t=C(t,this,v(this,B,"f").getMiddleware(),!1)),t}[Rt](t={}){O(this,tt,v(this,tt,"f")||{},"f");const e={};e.local=v(this,tt,"f").local||[],e.configObjects=v(this,tt,"f").configObjects||[];const s={};e.local.forEach((e=>{s[e]=!0,(t[e]||[]).forEach((t=>{s[t]=!0}))})),Object.assign(v(this,ot,"f"),Object.keys(v(this,Y,"f")).reduce(((t,e)=>{const i=v(this,Y,"f")[e].filter((t=>!(t in s)));return i.length>0&&(t[e]=i),t}),{})),O(this,Y,{},"f");return["array","boolean","string","skipValidation","count","normalize","number","hiddenOptions"].forEach((t=>{e[t]=(v(this,tt,"f")[t]||[]).filter((t=>!s[t]))})),["narg","key","alias","default","defaultDescription","config","choices","demandedOptions","demandedCommands","deprecatedOptions"].forEach((t=>{e[t]=g(v(this,tt,"f")[t],(t=>!s[t]))})),e.envPrefix=v(this,tt,"f").envPrefix,O(this,tt,e,"f"),O(this,ut,v(this,ut,"f")?v(this,ut,"f").reset(s):S(this,v(this,lt,"f")),"f"),O(this,gt,v(this,gt,"f")?v(this,gt,"f").reset(s):function(t,e,s){const i=s.y18n.__,n=s.y18n.__n,r={nonOptionCount:function(s){const i=t.getDemandedCommands(),r=s._.length+(s["--"]?s["--"].length:0)-t.getInternalMethods().getContext().commands.length;i._&&(r<i._.min||r>i._.max)&&(r<i._.min?void 0!==i._.minMsg?e.fail(i._.minMsg?i._.minMsg.replace(/\$0/g,r.toString()).replace(/\$1/,i._.min.toString()):null):e.fail(n("Not enough non-option arguments: got %s, need at least %s","Not enough non-option arguments: got %s, need at least %s",r,r.toString(),i._.min.toString())):r>i._.max&&(void 0!==i._.maxMsg?e.fail(i._.maxMsg?i._.maxMsg.replace(/\$0/g,r.toString()).replace(/\$1/,i._.max.toString()):null):e.fail(n("Too many non-option arguments: got %s, maximum of %s","Too many non-option arguments: got %s, maximum of %s",r,r.toString(),i._.max.toString()))))},positionalCount:function(t,s){s<t&&e.fail(n("Not enough non-option arguments: got %s, need at least %s","Not enough non-option arguments: got %s, need at least %s",s,s+"",t+""))},requiredArguments:function(t,s){let i=null;for(const e of Object.keys(s))Object.prototype.hasOwnProperty.call(t,e)&&void 0!==t[e]||(i=i||{},i[e]=s[e]);if(i){const t=[];for(const e of Object.keys(i)){const s=i[e];s&&t.indexOf(s)<0&&t.push(s)}const s=t.length?`\n${t.join("\n")}`:"";e.fail(n("Missing required argument: %s","Missing required arguments: %s",Object.keys(i).length,Object.keys(i).join(", ")+s))}},unknownArguments:function(s,i,o,a,h=!0){var l;const c=t.getInternalMethods().getCommandInstance().getCommands(),f=[],d=t.getInternalMethods().getContext();if(Object.keys(s).forEach((e=>{H.includes(e)||Object.prototype.hasOwnProperty.call(o,e)||Object.prototype.hasOwnProperty.call(t.getInternalMethods().getParseContext(),e)||r.isValidAndSomeAliasIsNotNew(e,i)||f.push(e)})),h&&(d.commands.length>0||c.length>0||a)&&s._.slice(d.commands.length).forEach((t=>{c.includes(""+t)||f.push(""+t)})),h){const e=(null===(l=t.getDemandedCommands()._)||void 0===l?void 0:l.max)||0,i=d.commands.length+e;i<s._.length&&s._.slice(i).forEach((t=>{t=String(t),d.commands.includes(t)||f.includes(t)||f.push(t)}))}f.length&&e.fail(n("Unknown argument: %s","Unknown arguments: %s",f.length,f.join(", ")))},unknownCommands:function(s){const i=t.getInternalMethods().getCommandInstance().getCommands(),r=[],o=t.getInternalMethods().getContext();return(o.commands.length>0||i.length>0)&&s._.slice(o.commands.length).forEach((t=>{i.includes(""+t)||r.push(""+t)})),r.length>0&&(e.fail(n("Unknown command: %s","Unknown commands: %s",r.length,r.join(", "))),!0)},isValidAndSomeAliasIsNotNew:function(e,s){if(!Object.prototype.hasOwnProperty.call(s,e))return!1;const i=t.parsed.newAliases;return[e,...s[e]].some((t=>!Object.prototype.hasOwnProperty.call(i,t)||!i[e]))},limitedChoices:function(s){const n=t.getOptions(),r={};if(!Object.keys(n.choices).length)return;Object.keys(s).forEach((t=>{-1===H.indexOf(t)&&Object.prototype.hasOwnProperty.call(n.choices,t)&&[].concat(s[t]).forEach((e=>{-1===n.choices[t].indexOf(e)&&void 0!==e&&(r[t]=(r[t]||[]).concat(e))}))}));const o=Object.keys(r);if(!o.length)return;let a=i("Invalid values:");o.forEach((t=>{a+=`\n  ${i("Argument: %s, Given: %s, Choices: %s",t,e.stringifiedValues(r[t]),e.stringifiedValues(n.choices[t]))}`})),e.fail(a)}};let o={};function a(t,e){const s=Number(e);return"number"==typeof(e=isNaN(s)?e:s)?e=t._.length>=e:e.match(/^--no-.+/)?(e=e.match(/^--no-(.+)/)[1],e=!Object.prototype.hasOwnProperty.call(t,e)):e=Object.prototype.hasOwnProperty.call(t,e),e}r.implies=function(e,i){h("<string|object> [array|number|string]",[e,i],arguments.length),"object"==typeof e?Object.keys(e).forEach((t=>{r.implies(t,e[t])})):(t.global(e),o[e]||(o[e]=[]),Array.isArray(i)?i.forEach((t=>r.implies(e,t))):(d(i,void 0,s),o[e].push(i)))},r.getImplied=function(){return o},r.implications=function(t){const s=[];if(Object.keys(o).forEach((e=>{const i=e;(o[e]||[]).forEach((e=>{let n=i;const r=e;n=a(t,n),e=a(t,e),n&&!e&&s.push(` ${i} -> ${r}`)}))})),s.length){let t=`${i("Implications failed:")}\n`;s.forEach((e=>{t+=e})),e.fail(t)}};let l={};r.conflicts=function(e,s){h("<string|object> [array|string]",[e,s],arguments.length),"object"==typeof e?Object.keys(e).forEach((t=>{r.conflicts(t,e[t])})):(t.global(e),l[e]||(l[e]=[]),Array.isArray(s)?s.forEach((t=>r.conflicts(e,t))):l[e].push(s))},r.getConflicting=()=>l,r.conflicting=function(n){Object.keys(n).forEach((t=>{l[t]&&l[t].forEach((s=>{s&&void 0!==n[t]&&void 0!==n[s]&&e.fail(i("Arguments %s and %s are mutually exclusive",t,s))}))})),t.getInternalMethods().getParserConfiguration()["strip-dashed"]&&Object.keys(l).forEach((t=>{l[t].forEach((r=>{r&&void 0!==n[s.Parser.camelCase(t)]&&void 0!==n[s.Parser.camelCase(r)]&&e.fail(i("Arguments %s and %s are mutually exclusive",t,r))}))}))},r.recommendCommands=function(t,s){s=s.sort(((t,e)=>e.length-t.length));let n=null,r=1/0;for(let e,i=0;void 0!==(e=s[i]);i++){const s=N(t,e);s<=3&&s<r&&(r=s,n=e)}n&&e.fail(i("Did you mean %s?",n))},r.reset=function(t){return o=g(o,(e=>!t[e])),l=g(l,(e=>!t[e])),r};const c=[];return r.freeze=function(){c.push({implied:o,conflicting:l})},r.unfreeze=function(){const t=c.pop();d(t,void 0,s),({implied:o,conflicting:l}=t)},r}(this,v(this,ut,"f"),v(this,lt,"f")),"f"),O(this,z,v(this,z,"f")?v(this,z,"f").reset():function(t,e,s,i){return new M(t,e,s,i)}(v(this,ut,"f"),v(this,gt,"f"),v(this,B,"f"),v(this,lt,"f")),"f"),v(this,U,"f")||O(this,U,function(t,e,s,i){return new D(t,e,s,i)}(this,v(this,ut,"f"),v(this,z,"f"),v(this,lt,"f")),"f"),v(this,B,"f").reset(),O(this,F,null,"f"),O(this,Q,"","f"),O(this,V,null,"f"),O(this,J,!1,"f"),this.parsed=!1,this}[Tt](t,e){return v(this,lt,"f").path.relative(t,e)}[Gt](t,s,i,n=0,r=!1){let o=!!i||r;t=t||v(this,at,"f"),v(this,tt,"f").__=v(this,lt,"f").y18n.__,v(this,tt,"f").configuration=this[Ct]();const a=!!v(this,tt,"f").configuration["populate--"],h=Object.assign({},v(this,tt,"f").configuration,{"populate--":!0}),l=v(this,lt,"f").Parser.detailed(t,Object.assign({},v(this,tt,"f"),{configuration:{"parse-positional-numbers":!1,...h}})),c=Object.assign(l.argv,v(this,nt,"f"));let d;const u=l.aliases;let p=!1,g=!1;Object.keys(c).forEach((t=>{t===v(this,Z,"f")&&c[t]?p=!0:t===v(this,pt,"f")&&c[t]&&(g=!0)})),c.$0=this.$0,this.parsed=l,0===n&&v(this,ut,"f").clearCachedHelpMessage();try{if(this[jt](),s)return this[Vt](c,a,!!i,!1);if(v(this,Z,"f")){[v(this,Z,"f")].concat(u[v(this,Z,"f")]||[]).filter((t=>t.length>1)).includes(""+c._[c._.length-1])&&(c._.pop(),p=!0)}const h=v(this,z,"f").getCommands(),m=v(this,U,"f").completionKey in c,y=p||m||r;if(c._.length){if(h.length){let t;for(let e,s=n||0;void 0!==c._[s];s++){if(e=String(c._[s]),h.includes(e)&&e!==v(this,F,"f")){const t=v(this,z,"f").runCommand(e,this,l,s+1,r,p||g||r);return this[Vt](t,a,!!i,!1)}if(!t&&e!==v(this,F,"f")){t=e;break}}!v(this,z,"f").hasDefaultCommand()&&v(this,ht,"f")&&t&&!y&&v(this,gt,"f").recommendCommands(t,h)}v(this,F,"f")&&c._.includes(v(this,F,"f"))&&!m&&(v(this,G,"f")&&x(!0),this.showCompletionScript(),this.exit(0))}if(v(this,z,"f").hasDefaultCommand()&&!y){const t=v(this,z,"f").runCommand(null,this,l,0,r,p||g||r);return this[Vt](t,a,!!i,!1)}if(m){v(this,G,"f")&&x(!0);const s=(t=[].concat(t)).slice(t.indexOf(`--${v(this,U,"f").completionKey}`)+1);return v(this,U,"f").getCompletion(s,((t,s)=>{if(t)throw new e(t.message);(s||[]).forEach((t=>{v(this,X,"f").log(t)})),this.exit(0)})),this[Vt](c,!a,!!i,!1)}if(v(this,J,"f")||(p?(v(this,G,"f")&&x(!0),o=!0,this.showHelp("log"),this.exit(0)):g&&(v(this,G,"f")&&x(!0),o=!0,v(this,ut,"f").showVersion("log"),this.exit(0))),!o&&v(this,tt,"f").skipValidation.length>0&&(o=Object.keys(c).some((t=>v(this,tt,"f").skipValidation.indexOf(t)>=0&&!0===c[t]))),!o){if(l.error)throw new e(l.error.message);if(!m){const t=this[Kt](u,{},l.error);i||(d=C(c,this,v(this,B,"f").getMiddleware(),!0)),d=this[Dt](t,null!=d?d:c),f(d)&&!i&&(d=d.then((()=>C(c,this,v(this,B,"f").getMiddleware(),!1))))}}}catch(t){if(!(t instanceof e))throw t;v(this,ut,"f").fail(t.message,t)}return this[Vt](null!=d?d:c,a,!!i,!0)}[Kt](t,s,i,n){const r={...this.getDemandedOptions()};return o=>{if(i)throw new e(i.message);v(this,gt,"f").nonOptionCount(o),v(this,gt,"f").requiredArguments(o,r);let a=!1;v(this,ft,"f")&&(a=v(this,gt,"f").unknownCommands(o)),v(this,ct,"f")&&!a?v(this,gt,"f").unknownArguments(o,t,s,!!n):v(this,dt,"f")&&v(this,gt,"f").unknownArguments(o,t,{},!1,!1),v(this,gt,"f").limitedChoices(o),v(this,gt,"f").implications(o),v(this,gt,"f").conflicting(o)}}[Bt](){O(this,J,!0,"f")}[Yt](t){if("string"==typeof t)v(this,tt,"f").key[t]=!0;else for(const e of t)v(this,tt,"f").key[e]=!0}}var Zt,Xt;const{readFileSync:Qt}=__nccwpck_require__(5747),{inspect:te}=__nccwpck_require__(1669),{resolve:ee}=__nccwpck_require__(5622),se=__nccwpck_require__(9087),ie=__nccwpck_require__(8909);var ne,re={assert:{notStrictEqual:t.notStrictEqual,strictEqual:t.strictEqual},cliui:__nccwpck_require__(6702),findUp:__nccwpck_require__(2644),getEnv:t=>process.env[t],getCallerFile:__nccwpck_require__(351),getProcessArgvBin:y,inspect:te,mainFilename:null!==(Xt=null===(Zt= false||void 0===__nccwpck_require__(9167)?void 0:__nccwpck_require__.c[__nccwpck_require__.s])||void 0===Zt?void 0:Zt.filename)&&void 0!==Xt?Xt:process.cwd(),Parser:ie,path:__nccwpck_require__(5622),process:{argv:()=>process.argv,cwd:process.cwd,emitWarning:(t,e)=>process.emitWarning(t,e),execPath:()=>process.execPath,exit:t=>{process.exit(t)},nextTick:process.nextTick,stdColumns:void 0!==process.stdout.columns?process.stdout.columns:null},readFileSync:Qt,require:__nccwpck_require__(9167),requireDirectory:__nccwpck_require__(9200),stringWidth:__nccwpck_require__(2577),y18n:se({directory:ee(__dirname,"../locales"),updateFiles:!1})};const oe=(null===(ne=null===process||void 0===process?void 0:process.env)||void 0===ne?void 0:ne.YARGS_MIN_NODE_VERSION)?Number(process.env.YARGS_MIN_NODE_VERSION):12;if(process&&process.version){if(Number(process.version.match(/v([^.]+)/)[1])<oe)throw Error(`yargs supports a minimum Node.js version of ${oe}. Read our version support policy: https://github.com/yargs/yargs#supported-nodejs-versions`)}const ae=__nccwpck_require__(8909);var he,le={applyExtends:n,cjsPlatformShim:re,Yargs:(he=re,(t=[],e=he.process.cwd(),s)=>{const i=new Jt(t,e,s,he);return Object.defineProperty(i,"argv",{get:()=>i.parse(),enumerable:!0}),i.help(),i.version(),i}),argsert:h,isPromise:f,objFilter:g,parseCommand:o,Parser:ae,processArgv:b,YError:e};module.exports=le;


/***/ }),

/***/ 4139:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

// classic singleton yargs API, to use yargs
// without running as a singleton do:
// require('yargs/yargs')(process.argv.slice(2))
const {Yargs, processArgv} = __nccwpck_require__(9567);

Argv(processArgv.hideBin(process.argv));

module.exports = Argv;

function Argv(processArgs, cwd) {
  const argv = Yargs(processArgs, cwd, __nccwpck_require__(4907));
  singletonify(argv);
  // TODO(bcoe): warn if argv.parse() or argv.argv is used directly.
  return argv;
}

/*  Hack an instance of Argv with process.argv into Argv
    so people can do
    require('yargs')(['--beeble=1','-z','zizzle']).argv
    to parse a list of args and
    require('yargs').argv
    to get a parsed version of process.argv.
*/
function singletonify(inst) {
  [
    ...Object.keys(inst),
    ...Object.getOwnPropertyNames(inst.constructor.prototype),
  ].forEach(key => {
    if (key === 'argv') {
      Argv.__defineGetter__(key, inst.__lookupGetter__(key));
    } else if (typeof inst[key] === 'function') {
      Argv[key] = inst[key].bind(inst);
    } else {
      Argv.__defineGetter__('$0', () => {
        return inst.$0;
      });
      Argv.__defineGetter__('parsed', () => {
        return inst.parsed;
      });
    }
  });
}


/***/ }),

/***/ 5670:
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = 5670;
module.exports = webpackEmptyContext;

/***/ }),

/***/ 9167:
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = 9167;
module.exports = webpackEmptyContext;

/***/ }),

/***/ 4907:
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = 4907;
module.exports = webpackEmptyContext;

/***/ }),

/***/ 2357:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 3129:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 5747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 1631:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 2087:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 5622:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 1765:
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ 1669:
/***/ ((module) => {

"use strict";
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
/******/ 			id: moduleId,
/******/ 			loaded: false,
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
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the module cache
/******/ 	__nccwpck_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__nccwpck_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __nccwpck_require__(__nccwpck_require__.s = 8835);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;