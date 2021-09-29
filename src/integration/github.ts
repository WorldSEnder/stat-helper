import type { Integration } from './';
import * as core from '@actions/core';
import path from 'path';

export const integration: Integration = {
    debug: core.debug,
    info: core.info,
    error: core.error,
    setFailed: core.setFailed,
    exportVariable: core.exportVariable,
    locations: {
        daemon: path.join(__dirname, "../daemon/index.js"),
        get tempDir() {
            const tmpDir = process.env['RUNNER_TEMP'];
            if (!tmpDir) { throw new Error(`expected RUNNER_TEMP to be defined`) }
            return tmpDir;
        },
        registerCli() {
            core.addPath(path.join(__dirname, ".."));
        },
    },
}
