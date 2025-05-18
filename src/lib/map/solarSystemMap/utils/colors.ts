import type { Planet } from '../../../stellaris/GameState.svelte';
import { isBlackHole } from './planets';

export function getPlanetColor(planet: Planet, colors: Record<string, string>): string | undefined {
	let pc = planet.planet_class;
	if (pc.includes('_station')) {
		pc = pc.substring(0, pc.indexOf('_station'));
	}
	switch (pc) {
		// standard habitable
		case 'pc_desert':
		case 'pc_arid':
		case 'pc_savanna':
		case 'mem_pc_death': // mem
			return colors.swamp_green;
		case 'pc_tropical':
		case 'pc_continental':
		case 'pc_ocean':
			return colors.intense_blue;
		case 'pc_tundra':
		case 'pc_arctic':
		case 'pc_alpine':
			return colors.ice_turquoise;
		// standard uninhabitable
		case 'pc_gas_giant':
			return colors.beige;
		case 'pc_asteroid':
			return colors.brown;
		case 'pc_ice_asteroid':
			return colors.faded_blue;
		case 'pc_rare_crystal_asteroid':
		case 'pc_crystal_asteroid':
			return colors.wave_blue;
		case 'pc_molten':
			return colors.intense_orange;
		case 'pc_barren':
		case 'pc_hollow': // RS (habitable)
		case 'pc_sterile': // RS (habitable)
		case 'pc_tidally_locked': // RS (habitable)
			return colors.khaki_brown;
		case 'pc_barren_cold':
			return colors.faded_blue;
		case 'pc_toxic':
			return colors.toxic_green;
		case 'pc_frozen':
			return colors.off_white;
		// special
		case 'pc_nuked':
		case 'pc_gpm_precursor_tomb': // gpm
			return colors.grey;
		case 'pc_gaia':
			return colors.ocean_turquoise;
		case 'pc_hive':
		case 'pc_infested':
			return colors.sick_green;
		case 'pc_shielded':
			return colors.blue;
		case 'pc_astral_scar':
		case 'pc_shrouded':
			return colors.intense_purple;
		case 'pc_broken':
		case 'pc_egg_cracked':
		case 'pc_shattered':
		case 'pc_shattered_2':
		case 'pc_mem_destroyed_barren': // mem
		case 'pc_mem_broken_city': // mem
			return colors.brown;
		// artificial
		case 'pc_ai':
		case 'pc_city':
		case 'pc_cosmogenesis_world':
		case 'pc_crystal_habitat':
		case 'pc_cybrex':
		case 'pc_gray_goo':
		case 'pc_habitat_shielded':
		case 'pc_habitat':
		case 'pc_machine_broken':
		case 'pc_machine':
		case 'pc_nanotech':
		case 'pc_ringworld_habitable_damaged':
		case 'pc_ringworld_habitable':
		case 'pc_ringworld_seam_damaged':
		case 'pc_ringworld_seam':
		case 'pc_ringworld_shielded':
		case 'pc_ringworld_tech_damaged':
		case 'pc_ringworld_tech':
		case 'pc_shattered_ring_habitable':
		case 'pc_warden_guardian':
			return colors.ship_steel;
		case 'pc_relic':
			return colors.beige;
		// stars (many of these are from RS)
		case 'pc_o_star':
		case 'pc_o_super_star':
		case 'pc_o_hyper_star':
		case 'pc_giga_o_star': // giga
			return colors.cloud_purple;
		case 'pc_b_star':
		case 'pc_b_super_star':
			return colors.light_blue;
		case 'pc_a_star':
		case 'pc_a_super_star':
			return colors.white;
		case 'pc_f_star':
		case 'pc_f_super_star':
			return colors.desert_yellow;
		case 'pc_g_star':
		case 'pc_g_giant_star':
		case 'pc_g_super_star':
			return colors.bright_yellow;
		case 'pc_k_star':
		case 'pc_k_giant_star':
		case 'pc_k_super_star':
		case 'pc_s_giant_star': // RS zirconium star
		case 'pc_fu_star': // RS FU Orionis
			return colors.light_orange;
		case 'pc_m_star':
		case 'pc_m_giant_star':
		case 'pc_m_super_star':
		case 'pc_m_hyper_star':
		case 'pc_c_giant_star': // RS carbon star
		case 'pc_gigaignited_star': // gaga
			return colors.cerise_red;
		case 'pc_l_star': // RS brown dwarf
		case 'pc_t_star': // brown dwarf
		case 'pc_t_star_big': // giga brown dwarf
		case 'pc_y_star': // RS brown dwarf
			return colors.brown;
		case 'pc_black_hole':
		case 'pc_mem_micro_black_hole': // mem
		case 'pc_black_hole_giga': // giga
		case 'pc_pouchkinn_black_hole': // giga
		case 'pc_ehod_black_hole': // giga
			return colors.true_black;
		case 'pc_neutron_star':
		case 'pc_pulsar':
		case 'pc_d_star': // RS
		case 'pc_collapsar': // RS
		case 'pc_protostar': // RS
		case 'pc_magnetar': // RS
		case 'pc_microquasar_1': // RS
		case 'pc_microquasar_2': // RS
		case 'pc_ae_star': // RS
		case 'pc_mem_synthetic_sun': // mem
		case 'pc_whc_star': // giga
		case 'pc_wh_star': // giga
		case 'pc_whdyson_star': // giga
			return colors.white;
		case 'pc_w_azure_star': // RS
		case 'pc_lbv_blue_star': // RS
			return colors.light_blue;
		case 'pc_w_red_star': // RS
		case 'pc_lbv_red_star': // RS
		case 'pc_tt_red_star': // RS
			return colors.cerise_red;
		case 'pc_tt_orange_star': // RS
			return colors.light_orange;
		case 'pc_w_green_star': // RS
		case 'pc_lbv_green_star': // RS
			return colors.sun_green;
		case 'pc_w_purple_star': // RS
			return colors.cloud_purple;
		case 'pc_tt_white_star': // RS
			return colors.white;
		case 'pc_toxoid_star':
			return colors.sun_green;
		case 'pc_rift_star':
			return colors.intense_purple;
		// RS stations that don't correspond planet classes
		case 'pc_cracking':
			return colors.brown;
		case 'pc_methane':
		case 'pc_greenhouse':
		case 'pc_sulfur':
			return colors.toxic_green;
		case 'pc_scorched':
		case 'pc_hot_giant':
			return colors.intense_orange;
		case 'pc_ice_giant':
			return colors.ice_turquoise;
		// fallback
		default:
			console.warn(`Unhandled planet class: ${pc}; assuming megastructure`);
			return colors.ship_steel;
	}
}

export function getStarGlowColor(star: Planet, colors: Record<string, string>) {
	return isBlackHole(star) ? '#FFFFFF' : getPlanetColor(star, colors);
}

export function getBeltColor(beltType: string, colors: Record<string, string>) {
	switch (beltType) {
		case 'icy_asteroid_belt':
			return colors.ice_turquoise;
		case 'crystal_asteroid_belt':
			return colors.wave_blue;
		case 'debris_asteroid_belt':
			return colors.ship_steel;
		default:
			return colors.brown;
	}
}
