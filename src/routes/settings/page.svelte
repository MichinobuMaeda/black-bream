<script>
  import SvgSettings from "../../lib/icons/SvgSettings.svelte";
  import SiteDescription from "./SiteDescription.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";
</script>

<h2><SvgSettings /> {m.settings()}</h2>
{#if store.admin || store.manager}
  <SiteDescription />
{/if}
