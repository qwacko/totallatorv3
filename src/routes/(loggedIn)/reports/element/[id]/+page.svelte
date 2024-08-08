<script>
	import ReportElementContents from '$lib/components/report/contents/ReportElementContents.svelte';
	import ReportGridWrapper from '$lib/components/report/ReportGridWrapper.svelte';
	import ReportGridItem from '$lib/components/report/ReportGridItem.svelte';
	import { urlGenerator } from '$lib/routes';

	const { data } = $props();
</script>

<ReportGridWrapper size="xl">
	<ReportGridItem cols={6} rows={1} highlightOnHover={false} title={data.elementData.title}>
		<ReportElementContents
			data={data.elementConfigWithData}
			showLayout={true}
			itemLinkGenerator={(itemInfo) => {
				if (itemInfo)
					return urlGenerator({
						address: '/(loggedIn)/reports/element/[id]/[item]',
						paramsValue: {
							id: data.elementData.id,
							item: itemInfo.id
						}
					}).url;

				return undefined;
			}}
		/>
	</ReportGridItem>
</ReportGridWrapper>
