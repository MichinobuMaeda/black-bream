<script>
  import SvgMastodon from "../icons/SvgMastodon.svelte";
  import SvgBluesky from "../icons/SvgBluesky.svelte";
  import SvgThreads from "../icons/SvgThreads.svelte";
  import SvgInstagram from "../icons/SvgInstagram.svelte";

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
{:else if target === "instagram"}
  <SvgInstagram />
{/if}
