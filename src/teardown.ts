#! /usr/bin/env node
import * as core from './integration';

import { connectEnv } from './client';

export async function main() {
    core.debug(`stat-helper teardown starting`);

    const [client, handle] = await connectEnv();
    const report = await client.printReport();
    core.info(`${report}`);
    await client.shutdown();
    await handle.close();

    core.debug(`stat-helper teardown done`);
}

if (require.main === module) {
    main().catch(e => {
        core.setFailed(e.message)
        throw e;
    });
}
