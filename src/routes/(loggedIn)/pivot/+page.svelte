<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';

	export let data;

	
</script>

<PageLayout title="Pivot Table">
	<RawDataModal dev={data.dev} data={data.data} />
</PageLayout>
