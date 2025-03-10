<script>
  import SvgMastodon from "../icons/SvgMastodon.svelte";
  import SvgMisskey from "../icons/SvgMisskey.svelte";
  import SvgBluesky from "../icons/SvgBluesky.svelte";
  import SvgTwitter from "../icons/SvgTwitter.svelte";
  import SvgTumblr from "../icons/SvgTumblr.svelte";
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
{:else if target === "misskey"}
  <SvgMisskey />
{:else if target === "tumblr"}
  <SvgTumblr />
{:else if target === "bluesky"}
  <SvgBluesky />
{:else if target === "twitter"}
  <SvgTwitter />
{:else if target === "threads"}
  <SvgThreads />
{:else if target === "instagram"}
  <SvgInstagram />
{/if}
