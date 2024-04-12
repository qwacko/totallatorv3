<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';

	export let data;

	//Logic to await data.streamed.refresh and call invalidateAll if it returns true
	$: if (browser) {
		if (data.streamed.refresh) {
			data.streamed.refresh.then((refreshed) => {
				if (refreshed) {
					invalidateAll();
				}
			});
		}
	}
</script>

<slot />
