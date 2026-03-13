<script lang="ts">
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';

	import {
		journalDownloadTypeEnum,
		type JournalDownloadTypeEnumType,
		journalDownloadTypeToString
	} from '@totallator/shared';

	import DownloadIcon from './icons/DownloadIcon.svelte';

	const { urlGenerator }: { urlGenerator: (dType: JournalDownloadTypeEnumType) => string } =
		$props();
</script>

<Button size="sm" class="flex p-2" color="blue" outline>
	<DownloadIcon />
</Button>
<Dropdown data-sveltekit-preload-data="off" simple>
	{#each journalDownloadTypeEnum as currentDownloadType}
		<DropdownItem href={urlGenerator(currentDownloadType)}>
			{journalDownloadTypeToString(currentDownloadType)}
		</DropdownItem>
	{/each}
</Dropdown>
