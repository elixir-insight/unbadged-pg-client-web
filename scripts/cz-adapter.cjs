const emojiMap = {
	feat: '✨',
	fix: '🐛',
	bug: '🚨',
	docs: '📝',
	style: '🎨',
	refactor: '♻️',
	test: '✅',
	perf: '⚡',
	chore: '🔧',
	merge: '🔀',
	conflict: '🔥'
};

module.exports = {
	prompter(cz, commit) {
		cz.prompt([
			{
				type: 'list',
				name: 'type',
				message: 'Select the type of change:',
				choices: [
					{ value: 'feat', name: '✨  feat:      A new feature' },
					{ value: 'fix', name: '🐛  fix:       A bug fix' },
					{ value: 'bug', name: '🚨  bug:       Critical bug' },
					{ value: 'docs', name: '📝  docs:      Documentation changes' },
					{ value: 'style', name: '🎨  style:     Code style changes' },
					{ value: 'refactor', name: '♻️   refactor:  Code refactoring' },
					{ value: 'test', name: '✅  test:      Adding tests' },
					{ value: 'perf', name: '⚡  perf:      Performance improvements' },
					{ value: 'chore', name: '🔧  chore:     Build process or tooling' },
					{ value: 'merge', name: '🔀  merge:     Merge branches' },
					{ value: 'conflict', name: '🔥  conflict:  Resolve merge conflict' }
				]
			},
			{
				type: 'input',
				name: 'scope',
				message: 'Enter GitHub issue number (e.g. #13):'
			},
			{
				type: 'input',
				name: 'subject',
				message: 'Enter short description:'
			},
			{
				type: 'input',
				name: 'body',
				message: 'Enter longer description (optional). Use "|" for new line:'
			},
			{
				type: 'confirm',
				name: 'confirmCommit',
				message: (answers) => {
					const emoji = emojiMap[answers.type] || '';
					const scope = answers.scope ? `(${answers.scope})` : '';
					const body = answers.body ? answers.body.split('|').join('\n') : '';
					const head = `${answers.type}${scope}: ${emoji} ${answers.subject}`;

					const divider = '─'.repeat(60);
					console.log(`\n###${divider}###`);
					console.log(head);
					if (body) console.log(`\n${body}`);
					console.log(`###${divider}###\n`);

					return 'Confirm commit?';
				},
				default: true
			}
		]).then((answers) => {
			if (!answers.confirmCommit) {
				console.log('Commit cancelled.');
				process.exit(1);
			}

			const emoji = emojiMap[answers.type] || '';
			const scope = answers.scope ? `(${answers.scope})` : '';
			const body = answers.body ? answers.body.split('|').join('\n') : '';
			const head = `${answers.type}${scope}: ${emoji} ${answers.subject}`;

			commit(head, body);
		});
	}
};
