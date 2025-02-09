<script>
  import SvgNoteAdd from "../icons/SvgNoteAdd.svelte";
  import SvgHourglass from "../icons/SvgHourglass.svelte";
  import SvgSync from "../icons/SvgSync.svelte";
  import SvgTask from "../icons/SvgTask.svelte";
  import SvgScanDelete from "../icons/SvgScanDelete.svelte";
  import SvgError from "../icons/SvgError.svelte";
  import SvgUnknownMed from "../icons/SvgUnknownMed.svelte";

  /**
   * @typedef {Object} Props
   * @property {string} [status]
   */

  /** @type {Props} */
  let { status } = $props();
</script>

{#if status === "requested"}
  <SvgNoteAdd />
{:else if status === "enqueued"}
  <SvgHourglass />
{:else if status === "posting"}
  <SvgSync />
{:else if status === "completed"}
  <SvgTask />
{:else if status === "deleted"}
  <SvgScanDelete />
{:else if status === "failed"}
  <SvgError />
{:else}
  <SvgUnknownMed />
{/if}
