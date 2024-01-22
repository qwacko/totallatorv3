<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';

	export let data;

	//Logic to await data.streamed.refresh and call invalidateAll if it returns true
	$: if (browser) {
		if (data.streamed.refresh) {
			console.log('Data Streamed Refresh Exists');
			data.streamed.refresh.then((refreshed) => {
				console.log('Data Streamed Refreshed', refreshed);
				if (refreshed) {
					console.log('Invalidating All');
					invalidateAll();
				}
			});
		}
	}
</script>

<slot />
