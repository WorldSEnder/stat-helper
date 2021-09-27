#! /usr/bin/env node
import * as core from '@actions/core';

import { connectEnv } from './client';

async function main() {
    core.debug(`stat-helper teardown starting`);

    const [client, handle] = await connectEnv();
    const report = await client.printReport();
    core.info(`${report}`);
    await client.shutdown();
    await handle.close();

    core.debug(`stat-helper teardown done`);
}
main().catch(e => core.setFailed(e.message));
