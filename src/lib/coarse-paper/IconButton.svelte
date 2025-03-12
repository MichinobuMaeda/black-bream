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
      ? " text-light-on-surface dark:text-dark-on-surface opacity-30"
      : danger
        ? " text-light-error dark:text-dark-error"
        : " text-light-primary dark:text-dark-primary")}
  onclick={disabled ? () => {} : () => onClick()}
>
  <span class="flex size-6"><SvgIcon /></span>
</button>
