<script lang="ts">
	import { Input } from 'flowbite-svelte';
	import { type ComponentProps } from 'svelte';

	type PassthroughProps = Pick<ComponentProps<Input>, 'type' | 'value' | 'placeholder' | 'class'>;

	type AutocompleteKey = {
		key: string;
		desc: string;
		invertable: boolean;
		type: 'number' | 'text' | 'date' | 'boolean' | 'enum';
		enumValues?: string[];
		examples?: string[];
	};

	type Suggestion = {
		text: string;
		description: string;
		type: 'key' | 'value';
		highlightTerm?: string;
	};

	let {
		type,
		value = $bindable(),
		placeholder,
		class: className,
		keys
	}: PassthroughProps & { keys: AutocompleteKey[] } = $props();

	// State for autocomplete
	let showDropdown = $state(false);
	let suggestions = $state<Suggestion[]>([]);
	let selectedIndex = $state(-1);
	let inputElement: any;
	let dropdownElement = $state<HTMLDivElement|undefined>(undefined);

	// Helper function to highlight matching text
	function highlightText(text: string, searchTerm: string): string {
		if (!searchTerm) return text;
		const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
	}

	// Scroll selected item into view
	function scrollSelectedIntoView() {
		if (selectedIndex >= 0 && dropdownElement) {
			const selectedButton = dropdownElement.children[selectedIndex] as HTMLElement;
			if (selectedButton) {
				selectedButton.scrollIntoView({
					block: 'nearest',
					behavior: 'smooth'
				});
			}
		}
	}

	// Parse input to find current context for suggestions
	function getCurrentContext(inputValue: string, cursorPosition: number): {
		type: 'key' | 'value';
		currentWord: string;
		isNegated: boolean;
	} {
		// Find the current word being typed
		const beforeCursor = inputValue.slice(0, cursorPosition);
		const words = beforeCursor.split(/\s+/);
		const currentWord = words[words.length - 1] || '';

		// Check if we're typing a negated key
		const isNegated = currentWord.startsWith('!');
		const cleanWord = isNegated ? currentWord.slice(1) : currentWord;

		// If the word contains a colon, we're typing a value
		if (cleanWord.includes(':')) {
			return { type: 'value', currentWord: cleanWord, isNegated };
		} else {
			return { type: 'key', currentWord: cleanWord, isNegated };
		}
	}

	// Generate suggestions based on current context
	function generateSuggestions(inputValue: string, cursorPosition: number): Suggestion[] {
		const context = getCurrentContext(inputValue, cursorPosition);
		const suggestions: Suggestion[] = [];

		if (context.type === 'key') {
			// If no current word being typed, show all available keys
			if (context.currentWord === '') {
				for (const key of keys) {
					const keyVariant = key.key.endsWith(':') ? key.key : key.key + ':';
					suggestions.push({
						text: keyVariant,
						description: key.desc,
						type: 'key'
					});
					
					// Also add negated version if invertable
					if (key.invertable) {
						suggestions.push({
							text: '!' + keyVariant,
							description: `NOT ${key.desc}`,
							type: 'key'
						});
					}
				}
			} else {
				// Suggest keys that match the current input (substring search)
				const searchTerm = context.currentWord.toLowerCase();
				for (const key of keys) {
					const keyVariant = key.key.endsWith(':') ? key.key : key.key + ':';
					const searchKey = context.isNegated ? '!' + keyVariant : keyVariant;
					
					// Check if search term matches key or description
					const keyMatches = searchKey.toLowerCase().includes(searchTerm);
					const descMatches = key.desc.toLowerCase().includes(searchTerm);
					
					if (keyMatches || descMatches) {
						suggestions.push({
							text: searchKey,
							description: key.desc,
							type: 'key',
							highlightTerm: searchTerm
						});
					}
					
					// Also suggest the negated version if it's invertable
					if (key.invertable && !context.isNegated) {
						const negatedKey = '!' + keyVariant;
						const negatedKeyMatches = negatedKey.toLowerCase().includes(searchTerm);
						const negatedDescMatches = `NOT ${key.desc}`.toLowerCase().includes(searchTerm);
						
						if (negatedKeyMatches || negatedDescMatches) {
							suggestions.push({
								text: negatedKey,
								description: `NOT ${key.desc}`,
								type: 'key',
								highlightTerm: searchTerm
							});
						}
					}
				}
			}
		} else if (context.type === 'value') {
			// Find the key being used
			const [keyPart] = context.currentWord.split(':');
			const matchingKey = keys.find((k) =>
				k.key.toLowerCase().startsWith(keyPart.toLowerCase() + ':')
			);

			if (matchingKey) {
				if (matchingKey.type === 'enum' && matchingKey.enumValues) {
					// Suggest enum values
					for (const enumValue of matchingKey.enumValues) {
						suggestions.push({
							text: `${keyPart}:${enumValue}`,
							description: `${matchingKey.desc}: ${enumValue}`,
							type: 'value'
						});
					}
				} else if (matchingKey.type === 'boolean') {
					// For boolean types, just suggest the key itself
					suggestions.push({
						text: `${keyPart}:`,
						description: matchingKey.desc,
						type: 'value'
					});
				} else if (matchingKey.examples) {
					// Suggest examples
					for (const example of matchingKey.examples) {
						if (example.startsWith(keyPart + ':')) {
							suggestions.push({
								text: example,
								description: `${matchingKey.desc} (example)`,
								type: 'value'
							});
						}
					}
				}
			}
		}

		return suggestions.slice(0, 15); // Limit to 15 suggestions
	}

	// Handle input changes
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const cursorPosition = target.selectionStart || 0;
		
		suggestions = generateSuggestions(target.value, cursorPosition);
		showDropdown = suggestions.length > 0;
		selectedIndex = -1;
	}

	// Handle key presses
	function handleKeydown(event: KeyboardEvent) {
		if (!showDropdown) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
				scrollSelectedIntoView();
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				scrollSelectedIntoView();
				break;
			case 'Enter':
				if (selectedIndex >= 0) {
					event.preventDefault();
					selectSuggestion(selectedIndex);
				}
				break;
			case 'Escape':
				event.preventDefault();
				showDropdown = false;
				selectedIndex = -1;
				break;
		}
	}

	// Select a suggestion
	function selectSuggestion(index: number) {
		if (index < 0 || index >= suggestions.length) return;

		const suggestion = suggestions[index];
		const cursorPosition = inputElement.selectionStart || 0;
		
		// Find the current word by looking backwards from cursor to find word boundary
		let wordStart = cursorPosition;
		
		// Go backwards until we hit whitespace or start of string
		while (wordStart > 0 && value[wordStart - 1] && !/\s/.test(value[wordStart - 1])) {
			wordStart--;
		}
		
		// Replace from word start to cursor position
		const beforeWord = value.slice(0, wordStart);
		const afterWord = value.slice(cursorPosition);
		
		value = beforeWord + suggestion.text + afterWord;
		showDropdown = false;
		selectedIndex = -1;
		
		// Focus back to input and set cursor position at end of inserted text
		setTimeout(() => {
			inputElement.focus();
			const newCursorPos = beforeWord.length + suggestion.text.length;
			inputElement.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	}

	// Hide dropdown when clicking outside
	function handleBlur() {
		// Use setTimeout to allow click events to fire first
		setTimeout(() => {
			showDropdown = false;
			selectedIndex = -1;
		}, 200);
	}
</script>

<div class="relative {className}">
	<Input
		bind:this={inputElement}
		{type}
		bind:value
		{placeholder}
		class="w-full"
		on:input={handleInput}
		on:keydown={handleKeydown}
		on:blur={handleBlur}
		on:focus={() => {
			const cursorPosition = inputElement.selectionStart || 0;
			suggestions = generateSuggestions(value, cursorPosition);
			showDropdown = suggestions.length > 0;
		}}
	/>
	
	{#if showDropdown && suggestions.length > 0}
		<div 
			bind:this={dropdownElement}
			class="absolute z-50 w-full top-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
		>
			{#each suggestions as suggestion, index}
				<button
					class="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 {selectedIndex === index ? 'bg-blue-100' : ''}"
					onclick={() => selectSuggestion(index)}
				>
					<div class="font-medium text-gray-900">
						{#if suggestion.highlightTerm}
							{@html highlightText(suggestion.text, suggestion.highlightTerm)}
						{:else}
							{suggestion.text}
						{/if}
					</div>
					<div class="text-sm text-gray-500">
						{#if suggestion.highlightTerm}
							{@html highlightText(suggestion.description, suggestion.highlightTerm)}
						{:else}
							{suggestion.description}
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>