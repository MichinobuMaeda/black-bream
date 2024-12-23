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
    bg-lightSurfaceVariant dark:bg-darkSurfaceVariant
    transition [-webkit-tap-highlight-color:_transparent]
    has-[:checked]:bg-lightPrimary has-[:checked]:dark:bg-darkPrimary
    border-2 has-[:checked]:border-none
    border-lightOutline dark:border-darkOutline"
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
      bg-lightOnSurfaceVariant dark:bg-darkOnSurfaceVariant
      text-lightOnSurfaceVariant dark:text-darkOnSurfaceVariant
      transition-all peer-checked:start-6
      peer-checked:bg-lightSurface peer-checked:dark:bg-darkSurface
      peer-checked:text-lightPrimary peer-checked:dark:text-darkPrimary"
  >
    <span class="w-6 h-6"><SvgCheck /></span>
  </span>
</label>
