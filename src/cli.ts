#! /usr/bin/env node
import * as core from '@actions/core';
import yargs from "yargs";
import fs from 'fs';

import { connectEnv, DaemonClient } from './client';
import { stdin } from 'process';
import { promisify } from 'util';
import { Datapoint, datapointValidator } from './measurement';
import { compile, Validator } from './rpc/validate';

async function wrapCommand(f: (client: DaemonClient) => Promise<void>) {
    core.debug(`stat-helper-cli starting`);

    const [client, handle] = await connectEnv();
    await f(client)
        .finally(async () => {
            await handle.close();
        })
        .catch(e => core.setFailed(e.message))

    core.debug(`stat-helper-cli executed`);
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
    await yargs
    .command('add', "Add measurements", yargs => {
        return yargs.option('format', {
            describe: 'The format of the provided input data',
            choices: ['json'],
            default: 'json',
        }).option('input', {
            describe: 'Input of the measurements',
            normalize: true,
            requiresArg: true,
        })
    }, addArgs => wrapCommand(async client => {
        let format = addArgs.format as "json";
        const contents = await promisify(fs.readFile)(addArgs.input || stdin.fd, 'utf-8');
        const datapoints = await decode(format, contents);

        for (const d of datapoints) {
            await client.add(d);
        }
    }))
    .help()
    .recommendCommands()
    .showHelpOnFail(true)
    .demandCommand()
    .parseAsync();
}

main()
