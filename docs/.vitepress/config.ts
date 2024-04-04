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
			{ text: 'Installation 🚧', link: '/installation' }
		],
		sidebar: [
			{
				text: 'Install / Config 🚧',
				link: '/installation',
				items: [
					{
						text: 'Environment Variables',
						link: '/environment-variables'
					},
					{
						text: 'Docker 🚧',
						link: '/docker'
					}
				]
			},
			{
				text: 'Advanced',
				items: [
					{
						text: 'Automatic Import',
						link: '/automatic-import',
						collapsed: true,
						items: [
							{ text: 'Salt Edge', link: '/salt-edge' },
							{ text: 'Akahu', link: '/akahu' }
						]
					},
					{ text: 'Recurring Functions 🚧', link: '/recurring-functions' },
					{ text: 'Backups 🚧', link: '/backup' },
					{ text: 'Imports 🚧', link: '/import' }
				]
			},
			{
				text: 'Developers 🚧',
				link: '/development',
				items: [
					{ text: 'Contributing 🚧', link: '/contribution' },
					{ text: 'Database 🚧', link: '/database' },
					{ text: 'Auto Import Development 🚧', link: '/develop-auto-import' }
				]
			}
		],
		socialLinks: [{ icon: 'github', link: 'https://github.com/qwacko/totallatorv3' }]
	}
});
