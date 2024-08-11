<script lang="ts">
	import ComboSelect from '$lib/components/ComboSelect.svelte';
	import type {
		CloneJournalUpdateSchemaType,
		UpdateJournalSchemaType
	} from '$lib/schema/journalSchema';
	import { Badge, Button, Checkbox, Heading, P, TabItem, Tabs } from 'flowbite-svelte';
	import { labelDropdownData } from '$lib/stores/dropdownStores.svelte.js';

	import type { SuperForm } from 'sveltekit-superforms';

	const {
		form,
		allLabelIds,
		commonLabelIds
	}: {
		form: SuperForm<UpdateJournalSchemaType> | SuperForm<CloneJournalUpdateSchemaType>;
		allLabelIds: string[];
		commonLabelIds: string[];
	} = $props();

	let currentLabelId = $state<string | undefined>(undefined);

	const formData = form.form;

	const removeLabelToggle = (labelId: string | undefined) => {
		$formData.labels = undefined;
		$formData.clearLabels = false;
		if (labelId) {
			if ($formData.removeLabels) {
				if ($formData.removeLabels.includes(labelId)) {
					$formData.removeLabels = $formData.removeLabels.filter((item) => item !== labelId);
				} else {
					$formData.removeLabels = [...$formData.removeLabels, labelId];
				}
			} else {
				$formData.removeLabels = [labelId];
			}
		}
	};

	const addLabelToggle = (labelId: string | undefined) => {
		$formData.labels = undefined;
		$formData.clearLabels = false;
		if (labelId) {
			if ($formData.addLabels) {
				if ($formData.addLabels.includes(labelId)) {
					$formData.addLabels = $formData.addLabels.filter((item) => item !== labelId);
				} else {
					$formData.addLabels = [...$formData.addLabels, labelId];
				}
			} else {
				$formData.addLabels = [labelId];
			}
		}
	};

	const setLabelToggle = (labelId: string | undefined) => {
		$formData.addLabels = undefined;
		$formData.removeLabels = undefined;
		$formData.clearLabels = false;
		if (labelId) {
			if ($formData.labels) {
				if ($formData.labels.includes(labelId)) {
					$formData.labels = $formData.labels.filter((item) => item !== labelId);
				} else {
					$formData.labels = [...$formData.labels, labelId];
				}
			} else {
				$formData.labels = [labelId];
			}
		}
	};

	$effect(() => {
		if (
			$formData.clearLabels &&
			($formData.labels !== undefined ||
				$formData.addLabels !== undefined ||
				$formData.removeLabels !== undefined)
		) {
			$formData.labels = undefined;
			$formData.addLabels = undefined;
			$formData.removeLabels = undefined;
		}
	});

	const addableLabels = $derived.by(() => {
		if (labelDropdownData.value) {
			return labelDropdownData.value
				.filter((item) => {
					if ($formData.addLabels) {
						return !$formData.addLabels.includes(item.id);
					}
					return true;
				})
				.sort((a, b) => a.title.localeCompare(b.title));
		}
		return undefined;
	});

	const settableLabels = $derived.by(() => {
		if (labelDropdownData.value) {
			return labelDropdownData.value
				.filter((item) => {
					if ($formData.labels) {
						return !$formData.labels.includes(item.id);
					}
					return true;
				})
				.sort((a, b) => a.title.localeCompare(b.title));
		}
		return undefined;
	});
</script>

<div class="col-span-1 md:col-span-2">
	<Heading tag="h6" class="pt-2">Labels</Heading>
	<Tabs>
		<TabItem
			open
			title="Add {$formData.addLabels && $formData.addLabels.length > 0
				? `(${$formData.addLabels.length})`
				: ''}"
		>
			<div class="flex flex-col gap-6">
				<div class="flex flex-row gap-2">
					<ComboSelect
						items={addableLabels}
						placeholder="Label Selection..."
						bind:value={currentLabelId}
						title="Label"
						itemToOption={(item) => ({
							label: item.title,
							value: item.id,
							disabled: !item.enabled
						})}
						itemToDisplay={(item) => ({ title: item.title })}
						class=" flex flex-grow"
						onChange={(data) => {
							if (data) {
								addLabelToggle(data);
								currentLabelId = undefined;
							}
						}}
					/>
				</div>

				<P class="flex text-sm font-semibold">Labels To Add</P>
				{#if $formData.addLabels && $formData.addLabels.length > 0 && labelDropdownData.value}
					<div class="flex flex-row flex-wrap gap-2">
						{#each $formData.addLabels as currentLabel}
							{@const labelDetail = labelDropdownData.value.find(
								(item) => item.id === currentLabel
							)}
							{#if labelDetail}
								<div>
									<input type="hidden" name="addLabels" value={labelDetail.id} />
									<Button outline size="xs" on:click={() => addLabelToggle(labelDetail.id)}>
										{labelDetail.title}
									</Button>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<Badge>No Labels Added</Badge>
				{/if}
			</div>
		</TabItem>
		{#if allLabelIds.length > 0 || commonLabelIds.length > 0}
			<TabItem
				title="Remove {$formData.removeLabels && $formData.removeLabels.length > 0
					? `(${$formData.removeLabels.length})`
					: ''}"
			>
				<div class="flex flex-col gap-6">
					{#if allLabelIds.length > 0}
						{@const useAllLabelIds = allLabelIds.filter((item) =>
							$formData.removeLabels ? !$formData.removeLabels.includes(item) : true
						)}
						<P class="flex text-sm font-semibold">Labels On At Least One Journals</P>
						{#if useAllLabelIds.length > 0 && labelDropdownData.value}
							<div class="flex flex-row flex-wrap gap-2">
								{#each useAllLabelIds as currentLabel}
									{@const labelDetail = labelDropdownData.value.find(
										(item) => item.id === currentLabel
									)}
									{#if labelDetail}
										<Button
											size="xs"
											color="light"
											on:click={() => removeLabelToggle(labelDetail.id)}
										>
											{labelDetail.title}
										</Button>
									{/if}
								{/each}
							</div>
						{:else}
							<Badge>No Labels Remain</Badge>
						{/if}
					{/if}

					{#if commonLabelIds.length > 0}
						{@const useCommonLabelIds = commonLabelIds.filter((item) =>
							$formData.removeLabels ? !$formData.removeLabels.includes(item) : true
						)}
						<P class="flex text-sm font-semibold">Labels On All Journals</P>
						{#if useCommonLabelIds.length > 0 && labelDropdownData.value}
							<div class="flex flex-row flex-wrap gap-2">
								{#each useCommonLabelIds as currentLabel}
									{@const labelDetail = labelDropdownData.value.find(
										(item) => item.id === currentLabel
									)}
									{#if labelDetail}
										<Button
											size="xs"
											color="light"
											on:click={() => removeLabelToggle(labelDetail.id)}
										>
											{labelDetail.title}
										</Button>
									{/if}
								{/each}
							</div>
						{:else}
							<Badge>No Labels Remain</Badge>
						{/if}
					{/if}

					<P class="flex text-sm font-semibold">Labels For Removal</P>
					{#if $formData.removeLabels && $formData.removeLabels.length > 0 && labelDropdownData.value}
						<div class="flex flex-row flex-wrap gap-2">
							{#each $formData.removeLabels as currentLabel}
								{@const labelDetail = labelDropdownData.value.find(
									(item) => item.id === currentLabel
								)}
								{#if labelDetail}
									<input type="hidden" name="removeLabels" value={labelDetail.id} />
									<Button
										size="xs"
										color="light"
										on:click={() => removeLabelToggle(labelDetail.id)}
									>
										{labelDetail.title}
									</Button>
								{/if}
							{/each}
						</div>
					{:else}
						<Badge>No Labels For Removal</Badge>
					{/if}
				</div>
			</TabItem>
			<TabItem title="Clear {$formData.clearLabels ? '(Active)' : ''}">
				<Checkbox bind:checked={$formData.clearLabels}>Clear All Labels</Checkbox>
				<input type="hidden" value={$formData.clearLabels} name="clearLabels" />
			</TabItem>
		{/if}
		<TabItem
			title="Set {$formData.labels && $formData.labels.length > 0
				? `(${$formData.labels.length})`
				: ''}"
		>
			<div class="flex flex-col gap-6">
				<div class="flex flex-row gap-2">
					<ComboSelect
						items={settableLabels}
						placeholder="Label Selection..."
						bind:value={currentLabelId}
						title="Label"
						itemToOption={(item) => ({
							label: item.title,
							value: item.id,
							disabled: !item.enabled
						})}
						itemToDisplay={(item) => ({ title: item.title })}
						class=" flex flex-grow"
						onChange={(data) => {
							if (data) {
								setLabelToggle(data);
								currentLabelId = undefined;
							}
						}}
					/>
				</div>

				<P class="flex text-sm font-semibold">Labels To Set All Journals To Have</P>
				{#if $formData.labels && $formData.labels.length > 0 && labelDropdownData.value}
					<div class="flex flex-row flex-wrap gap-2">
						{#each $formData.labels as currentLabel}
							{@const labelDetail = labelDropdownData.value.find(
								(item) => item.id === currentLabel
							)}
							{#if labelDetail}
								<div>
									<input type="hidden" name="labels" value={labelDetail.id} />
									<Button outline size="xs" on:click={() => setLabelToggle(labelDetail.id)}>
										{labelDetail.title}
									</Button>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<Badge>No Labels Added</Badge>
				{/if}
			</div>
		</TabItem>
	</Tabs>
</div>
