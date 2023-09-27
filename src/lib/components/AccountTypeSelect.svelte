<script lang="ts">
	import {
		accountTypeEnumSelection,
		type AccountTypeEnumType
	} from '$lib/schema/accountTypeSchema';
	import { MultiSelect } from 'flowbite-svelte';

	export let type: AccountTypeEnumType[] | undefined = undefined;

	$: console.log('Account Type Options : ', accountTypeEnumSelection);
</script>

<MultiSelect bind:value={type} items={accountTypeEnumSelection} {...$$restProps} />
