<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import type { loginSchemaType } from '$lib/schema/loginSchema';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';

	export let data;
	const { form, errors, constraints, message, enhance } = superForm<loginSchemaType>(data.form, {
		taintedMessage: null
	});
</script>

<CustomHeader pageTitle="Login" />

<PageLayout title="Login" size="xs" class="pt-10">
	<form method="POST" class="flex flex-col space-y-4" autocomplete="off" use:enhance>
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
		<ErrorText message={$message} />
		<Button type="submit" class="w-full">Sign In</Button>
	</form>
</PageLayout>
