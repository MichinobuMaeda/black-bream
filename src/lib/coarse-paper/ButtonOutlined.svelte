<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {import("svelte").Component?} [icon]
   * @property {string} label
   * @property {function} onClick
   * @property {boolean} [disabled]
   * @property {boolean} [danger]
   * @property {boolean} [dense]
   */

  /** @type {Props} */
  let {
    id,
    icon = null,
    label,
    onClick,
    disabled = false,
    danger = false,
    dense = false,
  } = $props();
</script>

<button
  {id}
  type="button"
  class={(dense
    ? "px-4 py-0.5 border rounded-full h-8 text-base"
    : "px-5 py-1.5 border rounded-full h-10 text-base") +
    " bg-lightForm dark:bg-darkForm" +
    (disabled
      ? " border-lightOutline dark:border-darkOutline" +
        " text-lightOnSurface dark:text-darkOnSurface" +
        " opacity-30"
      : danger
        ? " border-lightError dark:border-darkError" +
          " text-lightError dark:text-darkError"
        : " border-lightOutline dark:border-darkOutline" +
          " text-lightPrimary dark:text-darkPrimary")}
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
