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
    " bg-light-form dark:bg-dark-form" +
    (disabled
      ? " border-light-outline dark:border-dark-outline" +
        " text-light-on-surface dark:text-dark-on-surface" +
        " opacity-30"
      : danger
        ? " border-light-error dark:border-dark-error" +
          " text-light-error dark:text-dark-error"
        : " border-light-outline dark:border-dark-outline" +
          " text-light-primary dark:text-dark-primary")}
  onclick={disabled ? () => {} : () => onClick()}
>
  <span class="flex size-6"><SvgIcon /></span>
</button>
