export default {
	// messages in the top bar of the app
	top_bar: {
		stellar_maps: 'StellarMaps',
		download_latest_release: 'Download Latest Release',
	},
	// messages in the side bar (save selection and map settings)
	// note: messages for specific settings are in the 'setting' and 'option' sections
	side_bar: {
		save_game: 'Save Game', // header above controls to select save
		refresh_saves_button: 'Refresh',
		select_manually_button: 'Select Manually',
		select_save_placeholder: 'Select a save...',
		load_save_button: 'Load Save',
		map_settings: 'Map Settings',
		save_settings_button: 'Save',
		load_settings_button: 'Load',
		custom_setting_profiles: 'Custom',
		preset_setting_profiles: 'Preset',
		apply_changes_button: 'Apply Changes',
	},
	// messages in the main map section
	map: {
		select_save: 'Select a save in the top left',
		loading: 'This could take a few seconds',
		error: 'Something has gone wrong',
		click_to_view_system: 'Click to open map',
		tooltip: {
			colonies: 'Colonies',
		},
	},
	// various generic messages
	generic: {
		NEVER: 'THIS IS A BUG', // this message will never be displayed
		enabled: 'Enabled',
		disabled: 'Disabled',
		back_button: 'Back',
		cancel_button: 'Cancel',
		close_button: 'Close',
		loading: 'Loading...',
		confirmation: 'Are you sure?',
	},
	// various confirmation popups
	confirmation: {
		unsaved_setting_profile:
			'You have customized map settings that have not been saved. These changes will be lost.',
		delete_setting_profile: 'You are about to delete "{name}". This cannot be undone.',
	},
	// various prompt popups
	prompt: {
		enter_settings_profile_name: 'Enter a name',
		select_save_file: 'Select Save',
		select_save_file_filter_name: 'Stellaris Save',
		select_stellaris_install: 'Select Stellaris Install Folder',
	},
	// input validation messages
	validation: {
		required: 'Required',
		min: 'Min: {min, number}',
		max: 'Max: {max, number}',
		min_max: 'Min: {min, number}, Max: {max, number}',
	},
	// various notification popups
	notification: {
		settings_profile_saved: '"{name}" settings saved',
		failed_to_load_save_list: 'Failed to load Stellaris saves',
		failed_to_load_save_file: 'Failed to load {filePath}',
		export_success: 'Export Successful',
		export_failed: 'Export Failed',
		open_folder_button: 'Open',
		failed_to_load_stellaris_data: {
			title: 'Failed to load Stellaris data',
			description:
				'Please try manually selecting your install location. This should be the folder that contains the "common", "flags", and "localisation" folders (among others).',
			action: 'Select Install',
		},
	},
	// messages for the export button and popup
	export: {
		button: 'Export',
		header: 'Export Image',
		image_size: 'Image Size',
		lock_aspect_ratio: 'Lock Aspect Ratio',
		zoom: 'Zoom',
		center: 'Center',
		center_hint: '(The galaxy is about 1000 units across.)',
		preview: 'Preview:',
		click_to_center: '(Click to center)',
		reset_button: 'Reset',
		export_svg_button: 'Export SVG',
		export_png_button: 'Export PNG',
		processing: 'Processing...',
	},
	// messages in the app settings popup
	app_settings: {
		title: 'Settings',
		description: 'All changes are automatically saved and applied.',
		select_translator_mode_file: 'Select Translation File',
		translator_mode_no_file: 'No file selected',
		translator_mode_file: 'Watching {filePath}',
		translator_mode_untranslated_messages: 'Untranslated messages: {number, number}',
		translator_mode_extra_messages: 'Invalid message IDs: {number, number}',
	},
	// labels for various types of setting controls
	// (shared by multiple settings)
	control: {
		color: {
			label: 'Color',
			adjustment: {
				header: 'Color Adjustments',
				add_button: '+ Add Adjustment',
				placeholder: 'Select type...',
			},
		},
		icon: {
			label: 'Icon',
			size: 'Size',
			advanced_options: {
				header: 'Advanced Options',
				position: 'Position',
				priority: 'Priority',
			},
		},
		stroke: {
			width: 'Width',
			more_styles: {
				header: 'More Styles',
				smoothed: 'Smoothed',
				glow: 'Glow',
				dashed: 'Dashed',
				dash_pattern: 'Pattern',
				dash_pattern_tooltip:
					'A space-separated list determining the length of dashes and gaps. For example, "3 1" is a 3-length dash followed by a 1-length gap. You can use longer lists for complex patterns.',
			},
		},
	},
	// dropdown options for various settings
	option: {
		color: {
			group: {
				dynamic: 'Dynamic Colors',
				stellaris: 'Stellaris Colors',
				stellar_maps: 'StellarMaps Colors',
			},
			primary: 'Primary',
			secondary: 'Secondary',
			border: 'Border',
			planet: 'Planet',
			planet_complement: "Planet's Complement",
		},
		color_adjustment: {
			LIGHTEN: 'Lighten',
			DARKEN: 'Darken',
			MIN_LIGHTNESS: 'Min Lightness',
			MAX_LIGHTNESS: 'Max Lightness',
			MIN_CONTRAST: 'Min Contrast',
			OPACITY: 'Opacity',
		},
		icon: {
			group: {
				basic_shape: 'Basic Shapes',
				stars: 'Stars',
				other_shapes: 'Other Shapes',
				stellaris: 'Stellaris',
			},
			triangle: 'Triangle',
			triangle_flat: 'Triangle (flat top)',
			triangle_narrow: 'Triangle (narrow)',
			diamond: 'Diamond',
			square: 'Square',
			pentagon: 'Pentagon',
			pentagon_flat: 'Pentagon (flat top)',
			hexagon: 'Hexagon',
			hexagon_flat: 'Hexagon (flat top)',
			heptagon: 'Heptagon',
			heptagon_flat: 'Heptagon (flat top)',
			octagon: 'Octagon',
			octagon_flat: 'Octagon (flat top)',
			circle: 'Circle',
			star_3_pointed: '3-Pointed Star',
			star_4_pointed: '4-Pointed Star',
			star_5_pointed: '5-Pointed Star',
			star_6_pointed: '6-Pointed Star',
			star_7_pointed: '7-Pointed Star',
			star_8_pointed: '8-Pointed Star',
			cross: 'Cross',
			wormhole: 'Wormhole',
			gateway: 'Gateway',
			l_gate: 'L-Gate',
			shroud_tunnel: 'Shroud Tunnel (unofficial)',
		},
		icon_position: {
			center: 'Center',
			left: 'Left',
			right: 'Right',
			top: 'Top',
			bottom: 'Bottom',
		},
		galaxy_border_style: {
			blobs: 'Blobs',
			circular: 'Circular',
			snail_shell: 'Snail Shell',
		},
		glyph: {
			none: 'None',
			star_4_pointed: '✦ 4-Pointed Star',
			star_4_pointed_outline: '✧ 4-Pointed Star (outline)',
			star_5_pointed: '★ 5-Pointed Star',
			star_5_pointed_outline: '☆ 5-Pointed Star (outline)',
			star_5_pointed_circled: '✪ 5-Pointed Star (circled)',
			star_5_pointed_pinwheel: '✯ 5-Pointed Star (pinwheel)',
			star_6_pointed: '✶ 6-Pointed Star',
			star_8_pointed: '✴ 8-Pointed Star',
		},
		union: {
			joined_borders: 'Same Color, Joined Borders',
			separate_borders: 'Same Color, Separate Borders',
			off: 'Off',
		},
		union_federations_color: {
			founder: 'Founder',
			leader: 'Current Leader',
		},
		country_names_type: {
			country_only: 'Country Name Only',
			player_only: 'Player Name Only',
			country_then_player: 'Country then Player Name',
			player_then_country: 'Player then Country Name',
		},
		labels_avoid_holes: {
			all: 'All',
			owned: 'Owned',
			none: 'None',
		},
		country: {
			player: 'Player',
		},
		terra_incognita_style: {
			flat: 'Flat',
			striped: 'Striped',
			cloudy: 'Cloudy',
		},
		system_names: {
			none: 'None',
			country_capitals: 'Country Capitals',
			sector_capitals: 'Country and Sector Capitals',
			colonized: 'Colonized Systems',
			all: 'All Systems',
		},
		system_map_label_position: {
			top: 'Top',
			bottom: 'Bottom',
			right: 'Right',
			left: 'Left',
			orbit: 'Orbit',
		},
	},
	// labels and tooltips for various settings
	setting: {
		group: {
			borders: 'Borders',
			unions: 'Union Mode',
			occupation: 'Occupation',
			countryLabels: 'Country Labels',
			systemLabels: 'System Labels',
			systemIcons: 'System Icons',
			hyperlanes: 'Hyperlanes',
			bypassLinks: 'Bypass Links',
			terraIncognita: 'Terra Incognita',
			misc: 'Miscellaneous',
			advancedBorder: 'Advanced Border Settings',
			starscape: 'Starscape',
			legend: 'Legend',
			solarSystemMap: 'Solar System Maps',
		},
		mapMode: 'Map Mode',
		mapModePointOfView: 'Point of View',
		mapModePointOfView_tooltip: `<ul>
			<li><strong>WARNING</strong>: changing this can reveal information you normally could not see. Avoid if you want a "pure" experience.</li>
			<li>Tip: <strong>shift+click</strong> a country on the map to change to their Point of View.</li>
		</ul>`,
		mapModeSpecies: 'Species',
		borderStroke: 'Country Borders',
		borderColor: 'Country Border Color',
		borderFillColor: 'Country Fill Color',
		borderFillFade: 'Country Fill Fade',
		borderFillFade_tooltip: `<ul>
			<li>Adds a fade-out effect at near the border.</li>
			<li>Starts at 100% opacity at the border.</li>
			<li>Works best if Country Fill Color has low opacity.</li>
		</ul>`,
		frontierBubbleThreshold: 'Frontier Bubble Threshold',
		frontierBubbleThreshold_tooltip: `<ul>
			<li>Frontier bubbles are drawn as if part of an adjacent sector.</li>
			<li>Frontier bubbles are small clusters of hyperlane-connected sector-less systems.</li>
			<li>This setting determines the maximum number of systems in a frontier bubble.</li>
			<li>Leave blank or set to zero to disable.</li>
		</ul>`,
		sectorTypeBorderStyles: 'Distinct Sector Type Styles',
		sectorTypeBorderStyles_tooltip:
			'Adds separate style settings for Core and Frontier sector borders.',
		sectorBorderStroke: 'Sector Borders',
		sectorBorderColor: 'Sector Border Color',
		sectorCoreBorderStroke: 'Core Sector Borders',
		sectorCoreBorderColor: 'Core Sector Border Color',
		sectorFrontierBorderStroke: 'Frontier Sector Borders',
		sectorFrontierBorderColor: 'Frontier Sector Border Color',
		unionBorderStroke: 'Union Joined Borders',
		unionBorderColor: 'Union Joined Border Color',
		unionMode: 'Union Mode',
		unionSubjects: 'Subjects',
		unionHegemonies: 'Hegemony Federations',
		unionFederations: 'Other Federations',
		unionFederationsColor: 'Federation Member Color',
		unionLeaderSymbol: 'Union Leader Symbol',
		unionLeaderSymbolSize: 'Union Leader Symbol Size',
		unionLeaderUnderline: 'Underline Union Leader Name',
		occupation: 'Occupation',
		occupationColor: 'Occupation Color',
		countryNames: 'Names',
		countryNamesType: 'Name Type',
		countryNamesMinSize: 'Name Min Size',
		countryNamesMinSize_tooltip: 'If this size does not fit, the name is not drawn.',
		countryNamesMaxSize: 'Name Max Size',
		countryNamesMaxSize_tooltip:
			'The name will not be drawn bigger than this, even if there is room.',
		countryNamesSecondaryRelativeSize: 'Secondary Name Relative Size',
		countryNamesFont: 'Font',
		countryEmblems: 'Emblems',
		countryEmblemsMinSize: 'Emblem Min Size',
		countryEmblemsMinSize_tooltip: 'If this size does not fit, the emblem is not drawn.',
		countryEmblemsMaxSize: 'Emblem Max Size',
		countryEmblemsMaxSize_tooltip:
			'The emblem will not be drawn bigger than this, even if there is room.',
		labelsAvoidHoles: 'Avoid Holes in Border',
		systemNames: 'System Names',
		systemNamesFont: 'Font',
		systemNamesFontSize: 'Font Size',
		countryCapitalIcon: 'Country Capital',
		sectorCapitalIcon: 'Sector Capital',
		populatedSystemIcon: 'Populated System',
		unpopulatedSystemIcon: 'Other System',
		wormholeIcon: 'Wormhole',
		gatewayIcon: 'Gateway',
		lGateIcon: 'L-Gate',
		shroudTunnelIcon: 'Shroud Tunnel',
		hyperlaneStroke: 'Hyperlanes',
		hyperlaneColor: 'Hyperlane Color',
		unownedHyperlaneColor: 'Unowned Hyperlane Color',
		hyperRelayStroke: 'Hyper Relays',
		hyperRelayColor: 'Hyper Relay Color',
		unownedHyperRelayColor: 'Unowned Hyper Relay Color',
		hyperlaneMetroStyle: 'Metro-style Hyperlanes',
		hyperlaneMetroStyle_tooltip: `<ul>
			<li>Draw hyperlanes in the style of metro/subway maps.</li>
			<li>Automatically enables "Align Solar Systems to Grid".</li>
		</ul>`,
		wormholeStroke: 'Wormhole Links',
		wormholeStrokeColor: 'Wormhole Links Color',
		lGateStroke: 'L-Gate Links',
		lGateStrokeColor: 'L-Gate Links Color',
		shroudTunnelStroke: 'Shroud Tunnel Links',
		shroudTunnelStrokeColor: 'Shroud Tunnel Links Color',
		terraIncognita: 'Terra Incognita',
		terraIncognitaPerspectiveCountry: 'Perspective Country',
		terraIncognitaStyle: 'Style',
		terraIncognitaBrightness: 'Brightness',
		backgroundColor: 'Background Color',
		alignStarsToGrid: 'Align Solar Systems to Grid',
		galaxyBorderStyle: 'Galaxy Border Style',
		galaxyBorderStyle_tooltip: `<ul>
			<li>Sets the overall shape formed by all borders in the galaxy.</li>
			<li>Snail shell works best with Stellaris "Starburst" galaxies.</li>
		</ul>`,
		borderGap: 'Border Gap',
		borderGap_tooltip: 'Adds blank space between country borders',
		hyperlaneSensitiveBorders: 'Hyperlane Sensitive Borders',
		hyperlaneSensitiveBorders_tooltip: `<ul>
			<li>When enabled, borders will follow hyperlanes.</li>
			<li>When disabled, only solar systems affect borders.</li>
			<li>Not supported if the following are enabled:
				<ul>
					<li>Metro-style Hyperlanes</li>
					<li>Align Solar Systems to Grid</li>
				</ul>
			</li>
		</ul>`,
		voronoiGridSize: 'Voronoi Grid Size',
		voronoiGridSize_tooltip: `<ul>
			<li>Higher values make borders "looser".</li>
			<li>Lower values make borders "tighter".</li>
			<li>Lower values take longer to process.</li>
			<li><strong>WARNING</strong>: values below 10 can take a very long time to process.</li>
		</ul>`,
		claimVoidMaxSize: 'Claim Bordering Void Max Size',
		claimVoidMaxSize_tooltip: `<ul>
			<li>Empty "void" between systems can be claimed by neighboring country borders.</li>
			<li>Only void smaller than this size can be claimed.</li>
			<li>Set to 0 or leave empty to disable this behavior entirely.</li>
		</ul>`,
		claimVoidBorderThreshold: 'Claim Bordering Void Threshold',
		claimVoidBorderThreshold_tooltip: `<ul>
			<li>Empty pockets of "void" between systems can be claimed by neighboring country borders.</li>
			<li>To claim void, a country much control at least this much of the void's border.</li>
			<li>Set to full so only fully enclosed void is claimed.</li>
			<li>Set to empty so all void bordering at least one country is claimed.</li>
		</ul>`,
		starScapeDust: 'Dust',
		starScapeDustColor: 'Dust Color',
		starScapeNebula: 'Nebulas',
		starScapeNebulaColor: 'Nebula Color',
		starScapeNebulaAccentColor: 'Nebula Accent Color',
		starScapeCore: 'Core',
		starScapeCoreColor: 'Core Color',
		starScapeCoreAccentColor: 'Core Accent Color',
		starScapeStars: 'Stars',
		starScapeStarsColor: 'Stars Color',
		starScapeStarsCount: 'Star Count',
		legend: 'Legend',
		legendFontSize: 'Font Size',
		legendBorderStroke: 'Border',
		legendBorderColor: 'Border Color',
		legendBackgroundColor: 'Background Color',
		systemMapOrbitStroke: 'Orbit Lines',
		systemMapOrbitColor: 'Orbit Lines Color',
		systemMapOrbitDistanceExponent: 'Exponential Orbit Scale',
		systemMapOrbitDistanceExponent_tooltip:
			'Exponentially scales the distances between between objects and the things they orbit, so, for example, the outer planets are spaced further apart from each than the inner planets.',
		systemMapStarScale: 'Star Scale',
		systemMapPlanetScale: 'Planet Scale',
		systemMapMoonScale: 'Moon Scale',
		systemMapPlanetRingColor: 'Planet Ring Color',
		systemMapPlanetShadowSelf: 'Planets/Moons Cast Shadows on Self',
		systemMapPlanetShadowPlanetarySystem: 'Planets/Moons Cast Shadows on Each Other',
		systemMapPlanetShadowRings: 'Planets/Moons Cast Shadows on Rings',
		systemMapPlanetShadowOverlap: 'Planet/Moons Shadow Overlap',
		systemMapLabelPlanetsFont: 'Planet Name Font',
		systemMapLabelPlanetsFontSize: 'Planet Name Font Size',
		systemMapLabelPlanetsPosition: 'Planet Name Position',
		systemMapLabelPlanetsFallbackPosition: 'Planet Name Fallback Position',
		systemMapLabelColoniesEnabled: 'Colony Names Enabled',
		systemMapLabelStarsEnabled: 'Star Names Enabled',
		systemMapLabelPlanetsEnabled: 'Planet Names Enabled',
		systemMapLabelMoonsEnabled: 'Moon Names Enabled',
		systemMapLabelAsteroidsEnabled: 'Asteroid Names Enabled',
		systemMapHyperlanesEnabled: 'Hyperlane Connections Enabled',
		systemMapCivilianFleetIcon: 'Civilian Fleet Icon',
		systemMapCivilianStationIcon: 'Civilian Station Icon',
		systemMapMilitaryFleetIcon: 'Military Fleet Icon',
		systemMapMilitaryStationIcon: 'Military Station Icon',
		systemMapLabelFleetsEnabled: 'Fleet/Station Names',
		systemMapLabelFleetsFontSize: 'Fleet/Station Name Font Size',
		systemMapLabelFleetsPosition: 'Fleet/Station Name Position',
		appLocale: 'StellarMaps Language',
		appLocale_tooltip:
			'Join the Discord server (link in the top bar) if you want to help translate!',
		appStellarisLanguage: 'Stellaris Language',
		appStellarisLanguage_tooltip:
			'Language used for text from Stellaris files (eg country, system, and planet names).',
		appTranslatorMode: 'Translator Mode',
		appTranslatorMode_tooltip: `
		<strong>For StellarMaps translators:</strong>
		<ul>
			<li>Hold Alt to view message IDs.</li>
			<li>Select a translation file to use for messages.</li>
			<li>Reloads messages when the file is edited.</li>
			<li>Shows warnings about missing and extra messages.</li>
			<li>You need to reselect the file if you reload the application.</li>
		</ul>`,
	},
	map_mode: {
		common: {
			selected_country: 'Selected Country',
		},
		default: {
			name: 'Empires',
		},
		unions: {
			name: 'Unions',
		},
		wars: {
			name: 'Wars',
			tooltip_label: 'War Status',
			hostile: 'Hostile',
			ally: 'Ally in Active War',
			at_war: 'At War (Uninvolved)',
			at_peace: 'At Peace',
		},
		population: {
			name_total: 'Total Population',
			name_by_country: 'Population by Country',
			name_species: 'Species Population',
			tooltip_label: 'Population',
			total: 'Total Population',
			country: 'Population (Colored by Country)',
			free_species: 'Free {species}',
			enslaved_species: 'Enslaved {species}',
			other_species: 'Other Species',
		},
		fleet_power: {
			name_allied_and_hostile: 'Allied and Hostile Fleet Power',
			tooltip_label: 'Fleet Power',
			own_fleet: 'Own Fleet',
			own_station: 'Own Station',
			allied_fleet: 'Allied Fleet',
			allied_station: 'Allied Station',
			hostile_fleet: 'Hostile Fleet',
			hostile_station: 'Hostile Station',
		},
		trade_routes: {
			name: 'Trade Routes',
			tooltip_label: 'Trade Value',
			collected: 'Collected Value',
			pass_through: 'Passed Through Value',
			pirated: 'Pirated Value',
		},
		authority: {
			name: 'Authority',
			tooltip_label: 'Authority',
		},
		relations: {
			name: 'Relations',
			tooltip_label: 'Relations',
		},
	},
	legend: {
		fully_occupied: 'Fully Occupied',
		partially_occupied: 'Partially Occupied',
	},
};
