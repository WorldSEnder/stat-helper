import { fork } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';

import * as core from './integration';
import { ENV_SOCKET_PATH, ENV_LOG_DEBUG } from './constants.json';

export async function main() {
    core.debug(`stat-helper setup starting`);

    const err = await fs.open(path.join(core.locations.tempDir, 'stat-helper-err.log'), 'a');
    const out = await fs.open(path.join(core.locations.tempDir, 'stat-helper-out.log'), 'a');
    const daemonPath = core.locations.daemon;
    core.debug(`Launching daemon ${daemonPath}.`);
    const daemonProc = fork(daemonPath, [], {
        detached: true,
        stdio: ['ignore', out.fd, err.fd, 'ipc'],
        env: { ...process.env, [ENV_LOG_DEBUG]: "true" },
    });
    const serverSocketPath = await promisify<string>(f => {
        daemonProc.on('error', e => f(e, "<error>"));
        daemonProc.on('message', m => f(undefined, m as string))
    })();
    core.debug(`Daemon on ${serverSocketPath} launched successfully`);
    daemonProc.disconnect();
    daemonProc.channel?.unref();
    core.exportVariable(ENV_SOCKET_PATH, serverSocketPath);
    daemonProc.unref();
    await err.close();
    await out.close();

    core.locations.registerCli();

    core.debug(`stat-helper setup executed`);
}

if (require.main === module) {
    main().catch(e => {
        core.setFailed(e.message)
        throw e;
    });
}
