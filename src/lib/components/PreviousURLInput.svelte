<script lang="ts">
	import { afterNavigate } from '$app/navigation';

	export let name = 'previousURL';
	export let defaultURL = '/';

	let previousPage = defaultURL;
	afterNavigate(({ from }) => {
		previousPage = from?.url.href || previousPage;
	});
</script>

<input type="hidden" {name} value={previousPage} />
