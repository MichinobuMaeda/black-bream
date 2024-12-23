<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {Array} items
   * @property {Array} value
   */

  /** @type {Props} */
  let { id, items, value = $bindable() } = $props();
</script>

{#each items as item, index}
  <label
    for={`${id}-${index}`}
    class="cursor-pointer items-start gap-2 text-base
      text-lightOnBackground dark:text-darkOnBackground"
  >
    <input
      type="checkbox"
      id={`${id}-${index}`}
      name={id}
      value={item.value}
      bind:group={value}
      class="size-5 rounded align-text-bottom mr-0.5
        border-lightOutline dark:border-darkOutline
        accent-lightPrimary dark:accent-darkPrimary"
    />
    {item.label}
  </label>
{/each}
