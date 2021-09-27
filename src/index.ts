import { spawn, SpawnOptions } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import * as core from '@actions/core';

async function setup(): Promise<SpawnOptions> {
    const err = await fs.open('./err.log', 'a');
    const out = await fs.open('./out.log', 'a');

    return {
        detached: true,
        stdio: ['ignore', out.fd, err.fd],
    };
}

async function main() {
    core.debug(`stat-helper setup starting`);
    const options = await setup();
    const daemon_proc = spawn(process.argv[0], [path.join(__dirname, 'daemon.js')], options);
    daemon_proc.unref();
}

main().catch(e => core.setFailed(e.message));
