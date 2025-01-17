import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

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
				return { runes: undefined }; // or false, check what works
			}
		},
	},
};
