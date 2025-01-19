import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { app, BrowserWindow, ipcMain, nativeImage, net, protocol, session, shell } from 'electron';
import { z } from 'zod';

import icon from '../../resources/icon.png?inline';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const args = z
	.object({
		PORT: z.coerce.number().int().min(1),
		INVOKE_KEY: z.string(),
		ORIGIN: z.string().url(),
	})
	.parse(
		parseArgs({
			args: process.argv,
			options: {
				PORT: { type: 'string' },
				INVOKE_KEY: { type: 'string' },
				ORIGIN: { type: 'string' },
			},
			allowPositionals: true,
		}).values,
	);

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 900,
		webPreferences: {
			preload: path.join(import.meta.dirname, 'preload.js'),
		},
		title: 'StellarMaps',
		icon: nativeImage.createFromDataURL(icon),
	});
	mainWindow.removeMenu();
	mainWindow.maximize();

	// load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadURL('app://bundle/');
	}

	// open _blank links in system default browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	// open dev tools on F12 / Ctrl+Shfit+I / Cmd+Opt+I
	mainWindow.webContents.on('before-input-event', (_, input) => {
		if (
			input.type === 'keyDown' &&
			(input.key === 'F12' ||
				(input.control && input.shift && input.key === 'I') ||
				(input.meta && input.alt && input.key === 'I'))
		) {
			mainWindow.webContents.toggleDevTools();
		}
	});

	// open dev tools in dev mode
	if (!app.isPackaged) {
		mainWindow.webContents.openDevTools();
	}
};

// this needs to happen before ready
protocol.registerSchemesAsPrivileged([
	{
		scheme: 'app',
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
		},
	},
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	// handle custom URL scheme for frontend bundle
	const bundlePath = path.resolve(import.meta.dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`);
	protocol.handle('app', (req) => {
		const { host, pathname } = new URL(req.url);
		if (host === 'bundle') {
			if (pathname === '/') {
				return net.fetch(pathToFileURL(path.join(bundlePath, 'index.html')).toString());
			}

			// check for paths that escape the bundle, e.g. app://bundle/../../secret_file.txt
			const pathToServe = path.join(bundlePath, pathname);
			const relativePath = path.relative(bundlePath, pathToServe);
			const isSafe =
				relativePath != '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
			if (!isSafe) {
				return new Response(`forbidden path: ${pathname}`, {
					status: 403,
					headers: { 'content-type': 'text/html' },
				});
			}

			return net.fetch(pathToFileURL(pathToServe).toString());
		} else {
			return new Response(`bad host: ${host}`, {
				status: 400,
				headers: { 'content-type': 'text/html' },
			});
		}
	});

	// set up get-args ipc, which is used by preload script
	ipcMain.handle('get-args', () => args);

	// fake the origin for tauri invoke requests
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['Origin'] = args.ORIGIN;
		callback({ requestHeaders: details.requestHeaders });
	});

	// wildcard cors for tauri invoke requests
	session.defaultSession.webRequest.onHeadersReceived(
		{ urls: [`http://localhost:${args.PORT}/*`] },
		(details, callback) => {
			callback({
				responseHeaders: {
					...details.responseHeaders,
					'Access-Control-Allow-Origin': ['*'],
				},
			});
		},
	);

	// finally, create the window
	createWindow();
});

// when closed, send electron_closed command to tauri
app.on('window-all-closed', async () => {
	await fetch(`http://localhost:${args.PORT}/main/electron_closed`, {
		method: 'POST',
		body: '{}',
		headers: {
			'Content-Type': 'application/json',
			'Tauri-Callback': '12345',
			'Tauri-Error': '12345',
			'Tauri-Invoke-Key': args.INVOKE_KEY,
			Origin: args.ORIGIN,
		},
	});
	app.quit();
});
