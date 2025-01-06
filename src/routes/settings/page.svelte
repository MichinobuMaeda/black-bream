<script>
  import SvgSettings from "../../lib/icons/SvgSettings.svelte";
  import SiteDescription from "./SiteDescription.svelte";
  import { t, store } from "../../lib/store.svelte.js";
</script>

<h2><SvgSettings /> {t().settings()}</h2>
{#if store.admin || store.manager}
  <SiteDescription />
{/if}
