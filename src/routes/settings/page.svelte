<script>
  import SvgSettings from "../../lib/icons/SvgSettings.svelte";
  import SiteDescription from "./SiteDescription.svelte";
  import { store, m } from "../../lib/store.svelte.js";
</script>

<h2><SvgSettings /> {m().settings()}</h2>
{#if store.admin || store.manager}
  <SiteDescription />
{/if}
