<script lang="ts">
	export let title: string | undefined = undefined;
	export let subtitle: string | undefined = undefined;
	export let size: 'sm' | 'lg' | 'xs' = 'lg';
</script>

<div class="mb-10 flex w-full justify-center px-4 {$$props.class}">
	<div
		class="flex w-full flex-col items-stretch gap-4"
		class:max-w-4xl={size === 'lg'}
		class:max-w-xl={size === 'sm'}
		class:max-w-xs={size === 'xs'}
	>
		{#if title}
			<h3 class="flex justify-center text-4xl font-bold">{title}</h3>
		{/if}
		{#if subtitle}
			<h5 class="flex justify-center text-xl font-bold">{subtitle}</h5>
		{/if}
		<slot />
	</div>
</div>
