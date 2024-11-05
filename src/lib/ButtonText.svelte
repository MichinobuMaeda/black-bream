<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {Object} [icon]
   * @property {string} label
   * @property {function} onClick
   * @property {boolean} [disabled]
   */

  /** @type {Props} */
  let { id, icon = null, label, onClick, disabled = false } = $props();
</script>

<button
  {id}
  type="button"
  class={"px-1 text-base " +
    (disabled
      ? "opacity-50 text-lightOnSurface dark:text-darkOnSurface"
      : "text-lightPrimary dark:text-darkPrimary")}
  onclick={disabled ? () => {} : () => onClick()}
>
  <span class="flex flex-row gap-0.5">
    {#if icon !== null}
      {@const SvelteComponent = icon}
      <SvelteComponent />
    {/if}
    {label}
  </span>
</button>
