module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			[
				'feat',
				'fix',
				'bug',
				'docs',
				'style',
				'refactor',
				'test',
				'perf',
				'chore',
				'merge',
				'conflict'
			]
		],
		'scope-case': [0],
		'subject-case': [0],
		'subject-empty': [2, 'never'],
		'header-max-length': [2, 'always', 100]
	}
};
