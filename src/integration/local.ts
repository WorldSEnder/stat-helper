import xdg from '@folder/xdg';
import type { Integration } from './';
import { ENV_LOG_DEBUG } from '../constants.json';
import path from 'path';

const useDebugLog = ["1", "yes", "YES", "OK", "true", "TRUE"].indexOf(process.env[ENV_LOG_DEBUG] || "") > 0;

const debugLog =
    useDebugLog
    ? (m: any) => console.info(m)
    : (_: string) => {};

export const integration: Integration = {
    debug: debugLog,
    info: console.info,
    error: console.error,
    setFailed: err => {
        process.exitCode = 1;
        console.error(err);
    },
    exportVariable: (env, value) => console.info(`export ${env}=${value}`),
    locations: {
        daemon: path.join(__dirname, "../daemon.js"),
        get tempDir() {
            return xdg().runtime;
        },
        registerCli() {},
    },
}
