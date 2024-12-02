<script>
  /**
   * @typedef {Object} Props
   * @property {string} title
   */

  /** @type {Props} */
  let { title } = $props();
</script>

<h2
  class="flex sticky top-0 px-2 sm:px-4 lg:px-8 py-1 sm:py-1.5 lg:py-3 text-lg
    bg-lightTertiaryContainer dark:bg-darkTertiaryContainer
    text-lightOnTertiaryContainer dark:text-darkOnTertiaryContainer"
>
  {title}
</h2>
