<script lang="ts">
	import PrevPageButton from './PrevPageButton.svelte';
	import ArrowLeftIcon from './icons/ArrowLeftIcon.svelte';

	export let title: string | undefined = undefined;
	export let subtitle: string | undefined = undefined;
	export let size: 'sm' | 'lg' | 'xs' | 'xl' = 'lg';
	export let hideBackButton = false;
	export let routeBasedBack = false;
</script>

<div class="mb-10 flex w-full justify-center px-4 {$$props.class}">
	<div
		class="flex w-full flex-col items-stretch gap-4"
		class:max-w-4xl={size === 'lg'}
		class:max-w-xl={size === 'sm'}
		class:max-w-xs={size === 'xs'}
	>
		<div class="flex flex-row gap-2">
			<div class="flex flex-grow basis-0">
				{#if !hideBackButton}
					<PrevPageButton color="light" outline routeBased={routeBasedBack}>
						<ArrowLeftIcon />
					</PrevPageButton>
				{/if}
			</div>
			{#if title}
				<h3 class="flex justify-center text-4xl font-bold">{title}</h3>
			{/if}
			<div class="flex flex-grow basis-0 flex-row gap-2 justify-end">
				<slot name="right" />
			</div>
		</div>
		{#if subtitle}
			<h5 class="flex justify-center text-xl font-bold">{subtitle}</h5>
		{/if}
		<slot />
	</div>
</div>
