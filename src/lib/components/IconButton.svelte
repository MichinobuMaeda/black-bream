<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {import("svelte").Component} icon
   * @property {function} onClick
   * @property {boolean} [disabled]
   * @property {boolean} [danger]
   */

  /** @type {Props} */
  let { id, icon, onClick, disabled = false, danger = false } = $props();

  const SvgIcon = $derived(icon);
</script>

<button
  {id}
  type="button"
  class={"text-base" +
    (disabled
      ? " text-lightOnSurface dark:text-darkOnSurface opacity-30"
      : danger
        ? " text-lightError dark:text-darkError"
        : " text-lightPrimary dark:text-darkPrimary")}
  onclick={disabled ? () => {} : () => onClick()}
>
  <span class="flex size-6"><SvgIcon /></span>
</button>
