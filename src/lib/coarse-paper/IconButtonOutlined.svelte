<script>
  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {import("svelte").Component} icon
   * @property {function} onClick
   * @property {boolean} [disabled]
   * @property {boolean} [danger]
   * @property {boolean} [dense]
   */

  /** @type {Props} */
  let {
    id,
    icon,
    onClick,
    disabled = false,
    danger = false,
    dense = false,
  } = $props();

  const SvgIcon = $derived(icon);
</script>

<button
  {id}
  type="button"
  class={"flex border rounded-full text-base justify-center items-center" +
    (dense ? " size-8" : " size-10") +
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
  <span class="flex size-6"><SvgIcon /></span>
</button>
