export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'scope-enum': [
			2,
			'always',
			[
				'map', // map rendering
				'parser', // save and data parsing
				'data', // data processing
				'export', // image/video export
				'i18n', // translation etc
				'unreleased', // changes that only affects things that haven't been released yet
				'ui',
			],
		],
	},
};
