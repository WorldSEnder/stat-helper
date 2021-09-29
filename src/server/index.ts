import * as core from '../integration';
import net from 'net';
import { promisify } from 'util';
import logger from 'not-a-log';

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
                core.debug(`Running report`);
                let report: any = {};
                for (const [k, m] of Object.entries(state)) {
                    report[k] = formatMeasurement(m);
                }
                return logger.table(report)
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

export async function listenEnv(serverSocket: string): Promise<ServerHandle> {
    const server = await listen(serverSocket);
    return server;
}
