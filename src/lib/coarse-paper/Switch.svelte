<script>
  import SvgCheck from "../icons/SvgCheck.svelte";

  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {boolean} checked
   */

  /** @type {Props} */
  let { id, checked = $bindable() } = $props();
</script>

<label
  for={id}
  class="relative inline-block h-8 w-14 cursor-pointer rounded-full
    bg-light-surface-variant dark:bg-dark-surface-variant
    transition [-webkit-tap-highlight-color:_transparent]
    has-[:checked]:bg-light-primary has-[:checked]:dark:bg-dark-primary
    border-2 has-[:checked]:border-none
    border-light-outline dark:border-dark-outline"
>
  <input
    type="checkbox"
    {id}
    bind:checked
    class="peer sr-only
      [&:$checked_+_span_svg[data-checked-icon]]:block
      [&:$checked_+_span_svg[data-unchecked-icon]]:hidden"
  />

  <span
    class="absolute inset-y-0 start-0 z-10 inline-flex
      m-1.5 peer-checked:m-1
      size-4 peer-checked:size-6
      items-center justify-center rounded-full
      bg-light-on-surface-variant dark:bg-dark-on-surface-variant
      text-light-on-surface-variant dark:text-dark-on-surface-variant
      transition-all peer-checked:start-6
      peer-checked:bg-light-surface peer-checked:dark:bg-dark-surface
      peer-checked:text-light-primary peer-checked:dark:text-dark-primary"
  >
    <span class="w-6 h-6"><SvgCheck /></span>
  </span>
</label>
