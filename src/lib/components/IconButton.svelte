<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {import("svelte").Component} icon
   * @property {function} onClick
   * @property {boolean} [disabled]
   */

  /** @type {Props} */
  let { id, icon, onClick, disabled = false } = $props();

  const SvgIcon = $derived(icon);
</script>

<button
  {id}
  type="button"
  class={disabled
    ? " text-base opacity-50 text-lightOnSurface dark:text-darkOnSurface"
    : " text-base text-lightPrimary dark:text-darkPrimary"}
  onclick={disabled ? () => {} : () => onClick()}
>
  <span class="flex w-6 h-6"><SvgIcon /></span>
</button>
