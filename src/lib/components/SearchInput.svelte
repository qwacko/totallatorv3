<script lang="ts">
	import { Input } from 'flowbite-svelte';
	import { untrack, type ComponentProps } from 'svelte';

	type PassthroughProps = Pick<ComponentProps<Input>, 'type' | 'value' | 'placeholder' | 'class'>;

    type AutocompleteKey = {"key": string, "desc": string, "invertable": boolean, type: "number"|"text"|"date"}



	let { type, value = $bindable(), placeholder, class: className, keys }: PassthroughProps & {keys: AutocompleteKey[]} = $props();

	// const handleKeyPress = (event: KeyboardEvent) => {
	// 	event.preventDefault();
	// 	console.log('Key pressed:', event.key);
	// };

	let previousValue = value
	$effect(() => {
		value
	untrack(() => {
			let cursorPosition = 0;
			if(value !== previousValue){
				console.log('Value changed:', value);
				previousValue = value
			}
		})
	})

	$inspect("Search Input", keys)
</script>

<Input {type} bind:value {placeholder} class={className} />
