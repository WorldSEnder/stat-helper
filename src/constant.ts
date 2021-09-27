import xpipe from 'xpipe';
import process from 'process';

export const ENV_SOCKET_PATH = 'STAT_HELPER_SOCKET';
export const SERVER_SOCKET_PATH = xpipe.eq(`/tmp/stat-helper-${process.pid}.sock`);
