import { RawStateWrapper } from './stateUtils.svelte';
import { saveToWindow } from './utils';

const debug = new RawStateWrapper(false);
export default debug;
saveToWindow('debug', debug);
