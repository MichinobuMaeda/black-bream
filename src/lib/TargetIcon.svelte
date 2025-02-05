<script>
  import SvgMastodon from "../lib/icons/SvgMastodon.svelte";
  import SvgBluesky from "../lib/icons/SvgBluesky.svelte";
  import SvgThreads from "../lib/icons/SvgThreads.svelte";

  /**
   * @typedef {Object} Props
   * @property {string} target
   */

  /** @type {Props} */
  let { target } = $props();
</script>

{#if target === "mastodon"}
  <SvgMastodon />
{:else if target === "bluesky"}
  <SvgBluesky />
{:else if target === "threads"}
  <SvgThreads />
{/if}
