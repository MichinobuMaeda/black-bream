<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {any} icon
   * @property {function} onClick
   * @property {boolean} [disabled]
   */

  /** @type {Props} */
  let { id, icon, onClick, disabled = false } = $props();

  const SvelteComponent = $derived(icon);
</script>

<button
  {id}
  type="button"
  class={disabled
    ? " text-base opacity-50 text-lightOnSurface dark:text-darkOnSurface"
    : " text-base text-lightPrimary dark:text-darkPrimary"}
  onclick={disabled ? () => {} : () => onClick()}
>
  <SvelteComponent />
</button>
