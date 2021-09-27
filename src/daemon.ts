import * as core from '@actions/core';

import { listenEnv } from './server';

async function main() {
    core.debug(`stat-helper daemon starting at ${new Date()}`);

    const server = await listenEnv();
    await server.waitForShutdown();

    core.debug(`stat-helper daemon shutting down at ${new Date()}`);
}

main().catch(e => core.setFailed(e.message));
