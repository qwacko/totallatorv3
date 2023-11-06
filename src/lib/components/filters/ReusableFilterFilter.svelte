<script lang="ts">
	import TextInput from '../TextInput.svelte';
	import type { ReusableFilterFilterSchemaType } from '$lib/schema/reusableFilterSchema';
	import BooleanFilterButtons from './BooleanFilterButtons.svelte';

	export let filter: ReusableFilterFilterSchemaType;
</script>

<TextInput bind:value={filter.title} name="title" title="Title" errorMessage="" />
<TextInput bind:value={filter.group} name="group" title="Group" errorMessage="" />
<TextInput bind:value={filter.filterText} name="filterText" title="Filter" errorMessage="" />
<TextInput bind:value={filter.changeText} name="changeText" title="Change" errorMessage="" />
<BooleanFilterButtons
	bind:value={filter.applyAutomatically}
	onTitle="Y"
	offTitle="N"
	title="Apply Automatically"
/>
<BooleanFilterButtons bind:value={filter.listed} onTitle="Y" offTitle="N" title="In Dropdown" />
<BooleanFilterButtons
	bind:value={filter.applyFollowingImport}
	onTitle="Y"
	offTitle="N"
	title="Apply Following Import"
/>
