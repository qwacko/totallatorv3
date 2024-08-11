<script lang="ts">
	// import { urlGenerator } from '$lib/routes';
	// import { e } from 'mathjs';
	// import SuperJSON from 'superjson';
	import { untrack } from 'svelte';

	type TargetType =
		| { type: 'account'; accountId: string | undefined }
		| { type: 'description'; description: string | undefined };

	const {
		target
	}: {
		target: TargetType;
	} = $props();

	// let updating = $state(false);
	// let data = $state<string[]>([]);

	const updateData = (request: TargetType) => {
		// updating = true;
		// if (target.type === 'description') {
		// 	data = [target.description || ''];
		// } else {
		// 	data = [target.accountId || ''];
		// }
		// updating = false;
		// fetch(dataURL)
		// 	.then((response) => response.text())
		// 	.then((newData) => {
		// 		data = SuperJSON.parse(newData) as string[];
		// 		updating = false;
		// 	})
		// 	.catch((error) => {
		// 		console.error('Error:', error);
		// 	})
		// 	.finally(() => {
		// 		updating = false;
		// 	});
	};

	$effect(() => {
		const updateDataFunction = untrack(() => updateData);
		updateDataFunction(target);
	});
</script>

Bulk Reccomendations Go Here
<pre>{JSON.stringify(target)}</pre>
