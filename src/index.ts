import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import * as core from './integration';
import xpipe from 'xpipe';

import { ENV_SOCKET_PATH, ENV_LOG_DEBUG } from './constants.json';

export async function main() {
    core.debug(`stat-helper setup starting`);

    const serverSocketPath = xpipe.eq(path.join(core.tempDir, `stat-helper-${process.pid}.sock`));
    const err = await fs.open(path.join(core.tempDir, 'stat-helper-err.log'), 'a');
    const out = await fs.open(path.join(core.tempDir, 'stat-helper-out.log'), 'a');
    const daemon_proc = spawn(process.argv[0], [path.join(__dirname, 'daemon.js'), serverSocketPath], {
        detached: true,
        stdio: ['ignore', out.fd, err.fd],
        env: { [ENV_LOG_DEBUG]: "true" },
    });
    core.exportVariable(ENV_SOCKET_PATH, serverSocketPath);
    daemon_proc.unref();
    await err.close();
    await out.close();

    core.debug(`stat-helper setup executed`);
}

if (require.main === module) {
    main().catch(e => core.setFailed(e.message))
}
