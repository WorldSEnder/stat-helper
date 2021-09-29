import xdg from '@folder/xdg';
import type { Integration } from './';
import { ENV_LOG_DEBUG } from '../constants.json';

const debugLog =
    ["1", "yes", "YES", "OK", "true", "TRUE"].indexOf(process.env[ENV_LOG_DEBUG] || "") > 0
    ? console.log
    : (_: string) => {};

export const integration: Integration = {
    debug: debugLog,
    info: console.log,
    error: console.error,
    setFailed: err => {
        process.exitCode = 1;
        console.error(err);
    },
    exportVariable: (env, value) => console.log(`export ${env}=${value}`),
    get tempDir() {
        return xdg().runtime;
    }
}
