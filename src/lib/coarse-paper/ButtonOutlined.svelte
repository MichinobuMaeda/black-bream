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

  const SvgIcon = $derived(icon);
</script>

<button
  {id}
  type="button"
  class={(dense
    ? "px-4 py-0.5 border rounded-full h-8 text-base"
    : "px-5 py-1.5 border rounded-full h-10 text-base") +
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
  <span class="flex flex-row gap-0.5">
    {#if icon !== null}
      <span class="w-6 h-6"><SvgIcon /></span>
    {/if}
    {label}
  </span>
</button>
