<script lang="ts">
	import type { UpdateJournalSchemaSuperType } from '$lib/schema/journalSchema';
	import TextInputForm from '$lib/components/TextInputForm.svelte';

	import type { SuperForm } from 'sveltekit-superforms/client';

	export let form: SuperForm<UpdateJournalSchemaSuperType>;
</script>

<TextInputForm title="Description" {form} field="description" />
