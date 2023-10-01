<script lang="ts">
	import { Button, Tooltip } from 'flowbite-svelte';
	import CodeIcon from '~icons/mdi/xml';

	export let data: unknown;
</script>

<Button class="content-center p-2"><CodeIcon /></Button>
<Tooltip defaultClass="z-50"><pre>{JSON.stringify(data, null, 2)}</pre></Tooltip>
