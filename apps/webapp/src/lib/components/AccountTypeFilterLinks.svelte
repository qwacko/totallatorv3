<script lang="ts">
  import { Button, ButtonGroup } from "flowbite-svelte";

  import {
    accountTypeEnumSelection,
    type AccountTypeEnumType,
  } from "@totallator/shared";

  const {
    type = $bindable(undefined),
    generateURL,
  }: {
    type: AccountTypeEnumType[] | undefined;
    generateURL: (data: AccountTypeEnumType[] | undefined) => string;
  } = $props();

  const toggleArray = (title: AccountTypeEnumType) => {
    if (type && type.length > 0) {
      if (type.includes(title)) {
        const newType = type.filter((item) => item !== title);
        if (newType.length > 0) {
          return newType;
        }
        return [];
      }
      return [...type, title];
    }
    return [title];
  };
</script>

<ButtonGroup>
  {#each accountTypeEnumSelection as currentType}
    <Button
      color={type?.includes(currentType.value) ? "dark" : "light"}
      href={generateURL(toggleArray(currentType.value))}
    >
      {currentType.name}
    </Button>
  {/each}
  <Button href={generateURL([])} color="alternative">Clear</Button>
</ButtonGroup>
