<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Badge, Button, P } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { reusableFilterModifcationTypeItems } from '$lib/schema/reusableFilterSchema';
	import BooleanFilterButtons from '$lib/components/filters/BooleanFilterButtons.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';

	const { data } = $props();

	const form = $derived(superForm(data.form));

	const enhance = $derived(form.enhance);
	const formData = $derived(form.form);
	const formErrors = $derived(form.errors);
	const updateTitle = $derived((newTitle: string) => {
		$formData.title = newTitle;
	});
	const message = $derived(form.message);
</script>

<CustomHeader pageTitle="Create Reusable Filter" />

<PageLayout title="Create Reusable Filter" size="lg" routeBasedBack>
	<RawDataModal {data} dev={data.dev} />
	{#if $message}<Badge color="red">{$message}</Badge>{/if}
	<form use:enhance method="POST" class="flex flex-col gap-4">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<PreviousUrlInput name="prevPage" routeBased />
			<input type="hidden" name="filter" value={$formData.filter} />
			{#if $formData.change}<input type="hidden" name="change" value={$formData.change} />{/if}
			<div class="col-span-1 flex flex-row gap-2 md:col-span-2">
				<div class="flex-grow">
					<TextInput
						name="title"
						bind:value={$formData.title}
						errorMessage={$formErrors.title}
						title="Title"
						required={true}
					/>
				</div>
				<Button
					on:click={() => {
						const newTitle = data.filterText.join(' and ');
						updateTitle(newTitle);
					}}
					class="self-end whitespace-nowrap"
					disabled={$formData.title === data.filterText.join(' and ')}
					outline
				>
					Reset
				</Button>
			</div>
			<div class="col-span-1 flex flex-row gap-2 md:col-span-2">
				<div class="flex-grow">
					<TextInput
						name="group"
						bind:value={$formData.group}
						errorMessage={$formErrors.group}
						title="Group"
					/>
				</div>
			</div>
			<BooleanFilterButtons
				bind:value={$formData.listed}
				title="In Journal Filter Dropdown"
				onTitle="Yes"
				offTitle="No"
				name="listed"
				hideClear
			/>
			{#if $formData.listed}
				<SelectInput
					name="modificationType"
					errorMessage=""
					title="Dropdown Modification Type"
					bind:value={$formData.modificationType}
					required={true}
					items={reusableFilterModifcationTypeItems}
				/>
			{/if}
			<BooleanFilterButtons
				bind:value={$formData.applyAutomatically}
				title="Automatically Apply Related Change"
				onTitle="Yes"
				offTitle="No"
				name="applyAutomatically"
				hideClear
			/>
			<BooleanFilterButtons
				bind:value={$formData.applyFollowingImport}
				title="Apply Change Following Import"
				onTitle="Yes"
				offTitle="No"
				name="applyFollowingImport"
				hideClear
			/>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="flex flex-col gap-2">
				<P class="self-center" weight="semibold">Filter</P>
				<div class="flex flex-col items-center gap-6 self-center">
					<Badge color="dark">Filter Can Be Modified After Saving</Badge>

					<div class="flex flex-col gap-1">
						{#each data.filterText as currentFilterText}
							<div class="flex">{currentFilterText}</div>
						{/each}
						<div class="flex text-gray-400">{data.numberResults} matching journals</div>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<P class="self-center" weight="semibold">Related Change</P>
				<div class="flex flex-row items-center gap-6 self-center">
					<Badge color="dark">Change Can Be Modified After Saving</Badge>

					<div class="flex flex-col gap-1">
						{#if data.changeText}
							{#each data.changeText as currentChangeText}
								<div class="flex">
									{currentChangeText}
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
		<Button type="submit">Save</Button>
	</form>
</PageLayout>
