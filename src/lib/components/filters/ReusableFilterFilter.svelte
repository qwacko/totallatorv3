<script lang="ts">
	import TextInput from '../TextInput.svelte';
	import type { ReusableFilterFilterSchemaType } from '$lib/schema/reusableFilterSchema';
	import BooleanFilterButtons from './BooleanFilterButtons.svelte';

	let { filter = $bindable() }: { filter: ReusableFilterFilterSchemaType } = $props();
</script>

<TextInput bind:value={filter.title} name="title" title="Title" errorMessage="" />
<TextInput
	bind:value={filter.titleNot}
	name="titleNot"
	title="Title Doesn't Contain"
	errorMessage=""
/>
<TextInput bind:value={filter.group} name="group" title="Group" errorMessage="" />
<TextInput
	bind:value={filter.groupNot}
	name="groupNot"
	title="Group Doesn't Contain"
	errorMessage=""
/>
<TextInput bind:value={filter.filterText} name="filterText" title="Filter" errorMessage="" />
<TextInput
	bind:value={filter.filterTextNot}
	name="filterTextNot"
	title="Filter Doesn't Contain"
	errorMessage=""
/>
<TextInput bind:value={filter.changeText} name="changeText" title="Change" errorMessage="" />
<TextInput
	bind:value={filter.changeTextNot}
	name="changeTextNot"
	title="Change Doesn't Contain"
	errorMessage=""
/>
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
