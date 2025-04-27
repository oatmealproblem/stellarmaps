import { rm } from 'node:fs/promises';

import concurrently from 'concurrently';

// since electron starts when /tmp/stellarmaps-electron-dev exists (ie created by tauri), delete any pre-existing file
await rm('/tmp/stellarmaps-electron-dev', { force: true });

const { result } = concurrently([
	{ name: 'tauri', command: 'tauri dev -c src-tauri/tauri.electron-dev.conf.json' },
	{
		// TODO restart electron when tauri restarts
		name: 'electron',
		command:
			'while [ ! -f /tmp/stellarmaps-electron-dev ]; do sleep 1; done && bash /tmp/stellarmaps-electron-dev',
	},
]);
await result;
