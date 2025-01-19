import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	// Consult https://svelte.dev/docs#compile-time-svelte-preprocess
	// for more information about preprocessors
	preprocess: [vitePreprocess({})],
	compilerOptions: {
		runes: true,
	},
	vitePlugin: {
		dynamicCompileOptions({ filename }) {
			if (filename.includes('node_modules/@skeletonlabs')) {
				return { runes: undefined };
			}
		},
	},
	kit: {
		adapter: adapter({ pages: '.vite/renderer/main_window', fallback: 'index.html' }),
	},
};
