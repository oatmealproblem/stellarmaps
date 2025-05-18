import { invoke } from '@tauri-apps/api/core';

import debug from './debug';
import { gameStateFilter } from './stellaris/GameState.svelte';

const stellarMapsApi = {
	async loadSaveMetadata(): Promise<[StellarisSaveMetadata, ...StellarisSaveMetadata[]][]> {
		const saves: [StellarisSaveMetadata, ...StellarisSaveMetadata[]][] = await invoke(
			'get_stellaris_save_metadata_cmd',
		);
		return saves
			.map((save) => save.sort((a, b) => b.modified - a.modified))
			.filter((save) => save.length)
			.sort((a, b) => b[0].modified - a[0].modified);
	},
	loadSave(path: string): Promise<unknown> {
		return invoke('get_stellaris_save_cmd', {
			path,
			filter: debug.current ? true : gameStateFilter,
		});
	},
	loadFonts(): Promise<string[]> {
		return invoke('get_fonts_cmd');
	},
	revealFile(path: string): Promise<void> {
		return invoke('reveal_file_cmd', { path });
	},
	loadColors(path: string): Promise<string[]> {
		return invoke('get_stellaris_colors_cmd', { path });
	},
	loadLoc(path: string, language: string): Promise<Record<string, string>> {
		return invoke('get_stellaris_loc_cmd', { path, language });
	},
	loadStellarisInstallDir(): Promise<string> {
		return invoke('get_stellaris_install_dir_cmd');
	},
	loadEmblem(path: string, category: string, file: string): Promise<string> {
		return invoke('get_emblem_cmd', { path, category, file });
	},
};
export default stellarMapsApi;

export interface StellarisSaveMetadata {
	name: string;
	date: string;
	path: string;
	modified: number;
}
