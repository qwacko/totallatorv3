<script lang="ts">
	import PrevPageButton from './PrevPageButton.svelte';
	import ArrowLeftIcon from './icons/ArrowLeftIcon.svelte';

	export let title: string | undefined = undefined;
	export let subtitle: string | undefined = undefined;
	export let size: 'sm' | 'lg' | 'xs' | 'xl' = 'lg';
	export let hideBackButton = false;
</script>

<div class="mb-10 flex w-full justify-center px-4 {$$props.class}">
	<div
		class="flex w-full flex-col items-stretch gap-4"
		class:max-w-4xl={size === 'lg'}
		class:max-w-xl={size === 'sm'}
		class:max-w-xs={size === 'xs'}
	>
		<div class="flex flex-row gap-2">
			{#if !hideBackButton}
				<div class="flex flex-grow basis-0">
					<PrevPageButton color="light" outline><ArrowLeftIcon /></PrevPageButton>
				</div>{/if}
			{#if title}
				<h3 class="flex justify-center text-4xl font-bold">{title}</h3>
			{/if}
			{#if !hideBackButton}
				<div class="flex flex-grow basis-0" />
			{/if}
		</div>
		{#if subtitle}
			<h5 class="flex justify-center text-xl font-bold">{subtitle}</h5>
		{/if}
		<slot />
	</div>
</div>
