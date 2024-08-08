<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { superForm } from 'sveltekit-superforms';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';

	const { data } = $props();
	const { form, errors, constraints, message, enhance } = superForm(data.form);
</script>

<CustomHeader pageTitle="Create First User" />

<PageLayout title="Create First User" size="lg" class="pt-10" hideBackButton>
	<form method="POST" class="flex flex-col space-y-4" autocomplete="off" use:enhance>
		<TextInput
			title="Name"
			errorMessage={$errors.name}
			id="name"
			name="name"
			type="text"
			data-invalid={$errors.name}
			bind:value={$form.name}
			{...$constraints.name}
		/>
		<TextInput
			title="Username"
			errorMessage={$errors.username}
			id="username"
			name="username"
			type="text"
			data-invalid={$errors.username}
			bind:value={$form.username}
			{...$constraints.username}
		/>
		<TextInput
			title="Password"
			errorMessage={$errors.password}
			type="password"
			id="password"
			name="password"
			data-invalid={$errors.password}
			bind:value={$form.password}
			{...$constraints.password}
		/>
		<TextInput
			title="Confirm Password"
			errorMessage={$errors.confirmPassword}
			type="password"
			id="confirmPassword"
			name="confirmPassword"
			data-invalid={$errors.confirmPassword}
			bind:value={$form.confirmPassword}
			{...$constraints.confirmPassword}
		/>
		<ErrorText message={$message} />
		<Button type="submit" class="w-full">Create First Admin User</Button>
	</form>
</PageLayout>
