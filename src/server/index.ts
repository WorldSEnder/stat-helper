import * as core from '@actions/core';
import net from 'net';
import { promisify } from 'util';

import { ENV_SOCKET_PATH, SERVER_SOCKET_PATH } from '../constant';
import { Measurement, Datapoint, datapointValidator, formatMeasurement } from '../measurement';
import { bindService, ServerHandle } from '../rpc/impl'
import { compile } from '../rpc/validate';

export interface DaemonService {
    add(m: Datapoint): void;
    printReport(): string;
    shutdown(): void;
}

interface Database {
    [K: string]: Measurement;
};

async function listen(serverSocket: string): Promise<ServerHandle> {
    const server = net.createServer()
    .listen(serverSocket);

    let state: Database = {};

    const handle: ServerHandle = bindService<DaemonService>(server, {
        add: {
            validators: compile({
                kind: 'tuple',
                types: [
                    { kind: 'guard', check: datapointValidator }
                ]
            } as const),
            async run(m) {
                if (m.id in state) {
                    throw new Error(`Measurement for ${m.id} already recorded, no duplicates allowed!`);
                }
                state[m.id] = m;
            }
        },
        printReport: {
            validators: compile({
                kind: 'tuple', types: []
            } as const),
            async run() {
                let report = "";
                for (const k in state) {
                    const m = state[k];
                    report += `${k}=${formatMeasurement(m)}\n`;
                }
                return report;
            }
        },
        shutdown: {
            validators: compile({
                kind: 'tuple',
                types: []
            } as const),
            run() {
                return handle.close()
            }
        }
    });
    // wait for the server to come up
    await promisify(f => server.on('listening', f))();
    return handle;
}

export async function listenEnv(): Promise<ServerHandle> {
    const server = await listen(SERVER_SOCKET_PATH);
    core.exportVariable(ENV_SOCKET_PATH, SERVER_SOCKET_PATH);
    return server;
}
