import * as core from './integration';

import { listenEnv } from './server';

async function main() {
    core.debug(`stat-helper daemon starting at ${new Date()}`);
    const serverSocket = process.argv[2];
    if (!serverSocket) {
        throw new Error(`No socket to listen on specified`)
    }
    core.debug(`listening on ${serverSocket}`);

    const server = await listenEnv(serverSocket);
    await server.waitForShutdown();

    core.debug(`stat-helper daemon shutting down at ${new Date()}`);
}

main().catch(e => core.setFailed(e.message));
