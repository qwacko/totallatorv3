<script lang="ts">
  import { getCurrencyFormatter } from "@totallator/shared";

  import { currencyFormat } from "$lib/stores/userInfoStore";

  const {
    amount,
    positiveGreen = false,
  }: {
    amount: number | undefined;
    positiveGreen?: boolean;
  } = $props();

  const formatter = $derived(getCurrencyFormatter($currencyFormat));
  const negative = $derived(amount && amount < 0);
  const positive = $derived(!negative && positiveGreen);
</script>

<div class:text-red-600={negative} class:text-green-400={positive}>
  {#if positive}+{/if}{formatter.format(amount || 0)}
</div>
