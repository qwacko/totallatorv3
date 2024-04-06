// import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

// https://vitepress.dev/reference/site-config
export default withMermaid({
	// your existing vitepress config...
	mermaid: {},
	base: process.env.VITEPRESS_BASE,
	title: 'Totallator',
	description: 'Totallator',
	themeConfig: {
		editLink: { pattern: 'https://github.com/qwacko/totallatorv3/edit/master/docs/:path' },
		search: {
			provider: 'local'
		},
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Installation 🚧', link: 'install/installation' }
		],
		sidebar: [
			{
				text: 'Installation 🚧',
				link: 'install/installation',
				items: [
					{
						text: 'Docker 🚧',
						link: 'install/docker'
					},
					{
						text: 'Initial Setup 🚧',
						link: 'install/initial-setup'
					},
					{
						text: 'Environment Variables',
						link: 'install/environment-variables'
					}
				]
			},
			{
				text: 'Users 🚧',
				link: 'users/users'
			},
			{
				text: 'Configuration 🚧',
				link: 'configuration/configuration',
				items: [
					{ text: 'Transactions 🚧', link: 'configuration/transactions' },
					{ text: 'Journal 🚧', link: 'configuration/journals' },
					{
						text: 'Related Items 🚧',
						link: 'configuration/related-items',
						collapsed: true,
						items: [
							{ text: 'Accounts 🚧', link: 'configuration/accounts' },
							{ text: 'Tags 🚧', link: 'configuration/tags' },
							{ text: 'Labels 🚧', link: 'configuration/labels' },
							{ text: 'Categories 🚧', link: 'configuration/categories' },
							{ text: 'Bills 🚧', link: 'configuration/bills' },
							{ text: 'Budgets 🚧', link: 'configuration/budgets' }
						]
					},
					{
						text: 'Filters 🚧',
						link: 'configuration/filters',
						collapsed: true,
						items: [
							{ text: 'Text Filters', link: 'configuration/text-filters' },
							{ text: 'Reusable Filters 🚧', link: 'configuration/reusable-filters' }
						]
					},
					{ text: 'Reports 🚧', link: 'configuration/reports' }
				]
			},
			{
				text: 'Advanced',
				items: [
					{ text: 'Recurring Functions 🚧', link: 'advanced/recurring-functions' },
					{ text: 'Backups 🚧', link: 'advanced/backup' },
					{ text: 'Imports 🚧', link: 'advanced/import' },
					{
						text: 'Automatic Imports',
						link: 'advanced/automatic-import',
						collapsed: true,
						items: [
							{ text: 'Salt Edge', link: '/salt-edge' },
							{ text: 'Akahu', link: '/akahu' }
						]
					}
				]
			},
			{
				text: 'Developers 🚧',
				link: 'development/development',
				items: [
					{ text: 'Contributing 🚧', link: 'development/contribution' },
					{ text: 'Database 🚧', link: 'development/database' },
					{ text: 'Auto Import Development 🚧', link: 'development/develop-auto-import' }
				]
			}
		],
		socialLinks: [{ icon: 'github', link: 'https://github.com/qwacko/totallatorv3' }]
	}
});
