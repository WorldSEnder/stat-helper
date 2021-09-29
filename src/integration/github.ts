import type { Integration } from './';
import * as core from '@actions/core';

export const integration: Integration = {
    debug: core.debug,
    info: core.info,
    error: core.error,
    setFailed: core.setFailed,
    exportVariable: core.exportVariable,
    get tempDir() {
        const tmpDir = process.env['RUNNER_TEMP'];
        if (!tmpDir) { throw new Error(`expected RUNNER_TEMP to be defined`) }
        return tmpDir;
    },
}
