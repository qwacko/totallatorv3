<script lang="ts">
	import { enhance } from '$app/forms';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { urlGenerator } from '$lib/routes';
	import { Button, ButtonGroup } from 'flowbite-svelte';

	export let importMappingId: string;

	let loading = false;
</script>

<form
	method="post"
	action="?/updateSampleData"
	use:enhance={customEnhance({
		updateLoading: (newLoading) => {
			loading = newLoading;
		}
	})}
>
	<ButtonGroup>
		<ActionButton
			type="submit"
			message="Update Sample Data"
			loadingMessage="Updating..."
			color="light"
			size="sm"
			{loading}
		/>
		<Button
			href={urlGenerator({
				address: '/(loggedIn)/importMapping/[id]',
				paramsValue: { id: importMappingId }
			}).url}
			color="light"
		>
			View Import Mapping
		</Button>
	</ButtonGroup>
</form>
