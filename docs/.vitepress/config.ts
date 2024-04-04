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
				text: 'Install / Config 🚧',
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
				text: 'Advanced',
				items: [
					{
						text: 'Automatic Import',
						link: 'advanced/automatic-import',
						collapsed: true,
						items: [
							{ text: 'Salt Edge', link: '/salt-edge' },
							{ text: 'Akahu', link: '/akahu' }
						]
					},
					{ text: 'Recurring Functions 🚧', link: 'advanced/recurring-functions' },
					{ text: 'Backups 🚧', link: 'advanced/backup' },
					{ text: 'Imports 🚧', link: 'advanced/import' }
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
