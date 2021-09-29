import net from 'net';
import { promisify } from 'util';

import { ClientHandle, connectServer, Remote } from '../rpc/impl';
import { compile } from '../rpc/validate';
import type { DaemonService } from '../server';
import { ENV_SOCKET_PATH } from '../constants.json';

export type DaemonClient = Remote<DaemonService>;

export async function connect(socketPath: string): Promise<[DaemonClient, ClientHandle]> {
    const socket = net.createConnection(socketPath);
    const connection = connectServer<DaemonService>(socket, {
        add: {
            returnValidator: compile({
                kind: "any",
            } as const)
        },
        printReport: {
            returnValidator: compile({
                kind: "string",
            } as const)
        },
        shutdown: {
            returnValidator: compile({
                kind: "any",
            } as const)
        }
    });
    await promisify(res => {
        socket.on('ready', () => res(undefined, undefined))
        socket.on('error', err => res(err, undefined))
    })();
    return connection;
}

export async function connectEnv(): Promise<[DaemonClient, ClientHandle]> {
    const SOCKET_PATH = process.env[ENV_SOCKET_PATH];
    if (!SOCKET_PATH) {
        throw Error(`${ENV_SOCKET_PATH} has not been set to tell stat-helper-cli which server to connect to`);
    }
    return connect(SOCKET_PATH);
}
