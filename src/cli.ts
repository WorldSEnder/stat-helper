#! /usr/bin/env node
import * as core from './integration';
import yargs, { Argv } from "yargs";
import fs, { promises as fsp } from 'fs'
import { stdin } from 'process';
import { promisify } from 'util';

import { ENV_SOCKET_PATH } from './constants.json';
import { main as daemonMain } from './';
import { connectEnv, DaemonClient } from './client';
import { Datapoint, datapointValidator } from './measurement';
import { compile, Validator } from './rpc/validate';
import { main as teardownMain } from './teardown';

async function wrapCommand(f: (client: DaemonClient) => Promise<void>) {

    const [client, handle] = await connectEnv();
    await f(client)
        .finally(async () => {
            await handle.close();
        })
}

const seriesValidator: Validator<Datapoint[]> = compile({
    kind: "array",
    element: { kind: "guard", check: datapointValidator },
});

async function decode(mode: "json", contents: string): Promise<Datapoint[]> {
    switch (mode) {
        case "json": {
            const decoded = JSON.parse(contents);
            if (!seriesValidator(decoded)) { throw new Error("Malformed input data, expected an array of measurements") }
            return decoded;
        }
    }
}

async function main() {
    core.debug(`stat-helper-cli starting`);

    const YARGS: Argv = yargs
    .command('add', "Add measurements", yargs => {
        return yargs.option('format', {
            describe: 'The format of the provided input data',
            choices: ['json'],
            default: 'json',
        }).option('input', {
            describe: 'Input of the measurements',
            normalize: true,
            requiresArg: true,
            type: "string",
        })
    }, addArgs => wrapCommand(async client => {
        let format = addArgs.format as "json";
        const contents = await promisify(fs.readFile)(addArgs.input || stdin.fd, 'utf-8');
        const datapoints = await decode(format, contents);

        for (const d of datapoints) {
            await client.add(d);
        }
    }))
    .command('daemon', "Start the stat-helper daemon", yargs => {
        return yargs.option('ignore-existing', {
            describe: 'Start a daemon even if one already exists',
            boolean: true,
            default: false,
        })
    }, async daemonArgs => {
        const envSocket = process.env[ENV_SOCKET_PATH]
        const hasStarted = envSocket && await fsp.access(envSocket).then(_ => true, _ => false);
        if (!daemonArgs['ignore-existing'] && hasStarted) {
            core.error(`Daemon already running`);
            return;
        }
        await daemonMain();
    })
    .command('teardown', "Stop the daemon and print results", yargs => yargs, async _ => {
        await teardownMain();
    })
    .command('$0', "", yargs => yargs, _ => { YARGS.showHelp() })
    .help()
    .recommendCommands()
    .fail(false)
    .demandCommand(0, 1);

    await YARGS.parseAsync();

    core.debug(`stat-helper-cli executed`);
}

if (require.main === module) {
    main().catch(e => {
        core.setFailed(e.message)
        throw e;
    });
}
