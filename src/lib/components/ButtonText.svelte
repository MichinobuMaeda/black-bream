<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {import("svelte").Component?} [icon]
   * @property {string} label
   * @property {function} onClick
   * @property {boolean} [disabled]
   * @property {boolean} [danger]
   */

  /** @type {Props} */
  let {
    id,
    icon = null,
    label,
    onClick,
    disabled = false,
    danger = false,
  } = $props();
</script>

<button
  {id}
  type="button"
  class={"px-1 text-base" +
    (disabled
      ? " text-lightOnSurface dark:text-darkOnSurface" + " opacity-30"
      : danger
        ? " text-lightError dark:text-darkError"
        : " text-lightPrimary dark:text-darkPrimary")}
  onclick={disabled ? () => {} : () => onClick()}
>
  <span class="flex flex-row gap-0.5">
    {#if icon !== null}
      {@const SvgIcon = icon}
      <span class="w-6 h-6"><SvgIcon /></span>
    {/if}
    {label}
  </span>
</button>
