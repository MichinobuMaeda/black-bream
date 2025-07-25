<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {Array} items
   * @property {string} value
   */

  /** @type {Props} */
  let { id, items, value = $bindable() } = $props();
</script>

{#each items as item, index (item.value)}
  <label
    for={`${id}-${index}`}
    class="cursor-pointer text-base
      text-light-on-background dark:text-dark-on-background"
  >
    <input
      type="radio"
      id={`${id}-${index}`}
      name={id}
      value={item.value}
      bind:group={value}
      class="size-5 align-text-bottom mr-0.5
        border-light-outline dark:border-dark-outline
        accent-light-primary dark:accent-dark-primary"
    />
    {item.label}
  </label>
{/each}
