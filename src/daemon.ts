
import path from 'path';
import xpipe from 'xpipe';

import * as core from './integration';
import { listenEnv } from './server';

async function main() {
    core.debug(`stat-helper daemon starting at ${new Date()}`);
    const serverSocketPath = xpipe.eq(path.join(core.locations.tempDir, `stat-helper-${process.pid}.sock`));

    if (process.send) {
        process.send(serverSocketPath)
    }

    core.debug(`listening on ${serverSocketPath}`);

    const server = await listenEnv(serverSocketPath);
    await server.waitForShutdown();

    core.debug(`stat-helper daemon shutting down at ${new Date()}`);
}

if (require.main === module) {
    main().catch(e => {
        core.setFailed(e.message)
        throw e;
    });
}
