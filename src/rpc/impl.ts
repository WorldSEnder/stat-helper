import * as core from '../integration'
import net from 'net';
import { promisify } from 'util';

import { compile, Validator } from './validate';

type ServerImpl<F extends (...args: any) => any> =
    { validators: Validator<Parameters<F>>
    , run: RedeclareFn<F>
    };
type Unpromisify<T>
    = T extends Promise<infer V> ? V : T;
type ClientImpl<F extends (...args: any) => any> =
    { returnValidator: Validator<Unpromisify<ReturnType<F>>> };
type RedeclareFn<F extends (...args: any) => any> =
    (...args: Parameters<F>) => Promise<Unpromisify<ReturnType<F>>>;
export type RemoteFacade<KS extends PropertyKey> = Record<KS, (...args: any) => any>;

export type Remote<T extends RemoteFacade<keyof T>>
    = { [K in keyof T]: RedeclareFn<T[K]> }

export type LocalImpl<T extends RemoteFacade<keyof T>>
    = { [K in keyof T]: ServerImpl<T[K]> };

export type RemoteImpl<T extends RemoteFacade<keyof T>>
    = { [K in keyof T]: ClientImpl<T[K]> };

interface RPCall {
    type: "remote-procedure-call",
    callid: number,
    proc: string,
    args: unknown[],
}

interface RPResponseError {
    status: "error-unknown-proc" | "error-invalid-args" | "error-server-error",
    error: string,
}
interface RPResponseSuccess {
    status: "success",
    response?: unknown,
}
type RPResponse = {
    type: "remote-procedure-return",
    callid: number,
    details: RPResponseError | RPResponseSuccess,
};

const validateRPC: Validator<RPCall> = compile({
    kind: 'object',
    properties: {
        type: { required: true, kind: 'exact', value: "remote-procedure-call" },
        callid: { required: true, kind: 'number' },
        proc: { required: true, kind: 'string' },
        args: { required: true, kind: 'any' },
    }
} as const)

const validateRPA: Validator<RPResponse> = compile({
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
} as const)

interface InternalClientHandle {
    close(): Promise<void>;
}

function handleConnection<F extends RemoteFacade<keyof F>>(impl: LocalImpl<F>, socket: net.Socket): InternalClientHandle {
    core.debug('Client connected.');
    const clientState = {
        activeCalls: 0,
        closeRequested: undefined as undefined | {
            future: Promise<void>,
            trigger(): void,
        },
    };

    const sendResponse = (resp: RPResponse) => {
        // FIXME: JSON encoding mishandles 'undefined'.
        // E.g. `[undefined, undefined]` is encoded as "[null, null]",
        //    while `{a: undefined}` is encoded as "{}".
        // Could run into trouble with that in the future...
        const encoded = JSON.stringify(resp);
        socket.write(encoded);
    }
    const recvCall = (buffer: Buffer): RPCall | undefined => {
        // FIXME: See above for `sendResponse`
        const data = buffer.toString();
        const call = JSON.parse(data);
        return validateRPC(call) ? call : undefined;
    }

    async function wrapCall<K extends keyof F>
    ( procName: K
    , callid: number
    , serverImpl: ServerImpl<F[K]>
    , args: unknown[]
    ) {
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
        } catch (e) {
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

    const onData = async (buffer: Buffer) => {
        if (clientState.closeRequested) {
            return; // Send no answer
        }
        core.debug(`Message from client: ${buffer}`);
        const call = recvCall(buffer);
        if (!call) { return }

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
        let procName = proc as keyof LocalImpl<F>;
        await wrapCall(procName, callid, impl[procName], args);
    }

    socket.on('data', buffer => {
        clientState.activeCalls += 1;
        onData(buffer).finally(() => {
            clientState.activeCalls -= 1;
            if (clientState.closeRequested && clientState.activeCalls == 0) {
                clientState.closeRequested.trigger();
            }
        });
    })

    return {
        close() {
            let triggerPlace: {trigger: () => void} = {} as any;
            const future = new Promise<void>(trigger => { triggerPlace.trigger = trigger });
            const { trigger } = triggerPlace;

            clientState.closeRequested = clientState.closeRequested || {
                trigger, future,
            };
            return future;
        }
    }
}

export interface ServerHandle {
    close(): Promise<void>;
    waitForShutdown(): Promise<void>;
}

export function bindService<F extends RemoteFacade<keyof F>>(server: net.Server, impl: LocalImpl<F>): ServerHandle {
    const CONNECTIONS: { [_ in string]: InternalClientHandle } = {};
    let next_client = 0;
    async function cleanup() {
        core.debug("Terminating.");
        for (const client of Object.keys(CONNECTIONS)) {
            CONNECTIONS[client].close();
        }
        if(server.listening) {
            server.close();
        }
    }

    server.on('connection', socket => {
        // Store all connections so we can terminate them if the server closes.
        // An object is better than an array for these.
        const handle = handleConnection(impl, socket);
        var self = next_client;
        next_client++;
        CONNECTIONS[self] = handle;
        socket.on('close', () => {
            core.debug('Client disconnected.');
            delete CONNECTIONS[self];
        });
    })

    server.on('close', cleanup)
    const futureShutdown = promisify(f => server.on('close', () => f(undefined, undefined)))();
    return {
        async close() {
            await cleanup();
        },
        async waitForShutdown() {
            await futureShutdown;
        },
    }
}

export interface ClientHandle {
    close(): Promise<void>;
}

export function connectServer<F extends RemoteFacade<keyof F>>(socket: net.Socket, impl: RemoteImpl<F>): [Remote<F>, ClientHandle] {
    let nextId = 0;
    const waitingForResponse: {
        [K in number]: (res: RPResponseError | RPResponseSuccess) => void
    } = {};

    const cleanup = async () => {
        for (const k in waitingForResponse) {
            const waitHandle = waitingForResponse[k];
            delete waitingForResponse[k];
            waitHandle({
                status: "error-server-error",
                error: "server shutdown",
            })
        }
    }

    const sendCall = (call: RPCall) => {
        // FIXME: See above for `sendResponse`
        const encoded = JSON.stringify(call);
        socket.write(encoded);
    }
    const recvResponse = (buffer: Buffer): RPResponse | undefined => {
        // FIXME: See above for `sendResponse`
        const data = buffer.toString();
        const response = JSON.parse(data);
        return validateRPA(response) ? response : undefined;
    }

    socket.on('data', buffer => {
        core.debug(`Message from server: ${buffer}`);
        const response = recvResponse(buffer);
        if (!response) { return }

        const { callid, details } = response;
        const waitHandle = waitingForResponse[callid];
        delete waitingForResponse[callid];
        waitHandle(details);
    });

    socket.on('error', e => core.debug(`error: ${e.message}`))
    socket.on('close', cleanup)

    function wrap<K extends keyof F & string>
    ( procName: K
    , clientImpl: ClientImpl<F[K]>
    ): RedeclareFn<F[K]> {
        type InnerRet = Unpromisify<ReturnType<F[K]>>;
        type PromisedRet = Promise<InnerRet>;
        const handleResponse = async (response: RPResponseError | RPResponseSuccess): PromisedRet => {
            if (response.status === "success") {
                const { returnValidator } = clientImpl;
                if (!returnValidator(response.response)) {
                    throw new Error(`invalid return value from server`);
                }

                return response.response;
            }

            throw new Error(response.error)
        }

        return async (...args) => {
            const callid = nextId;
            nextId++;
            const result = new Promise<InnerRet>((resolve, reject) => {
                waitingForResponse[callid] = resp => handleResponse(resp).then(resolve, reject)
            });
            sendCall({
                type: "remote-procedure-call",
                callid,
                proc: procName,
                args,
            })
            return result;
        }
    }

    let proxy = {} as Remote<F>;

    for (const proc in impl) {
        proxy[proc] = wrap(proc, impl[proc]);
    }

    const clientHandle: ClientHandle = {
        async close() {
            await cleanup();
            socket.end();
        },
    }
    return [proxy, clientHandle];
}
