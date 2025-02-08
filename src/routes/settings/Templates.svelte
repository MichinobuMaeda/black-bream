<script>
  import Template from "./Template.svelte";
  import { t, store } from "../../lib/store.svelte.js";

  let templates = $derived(store.templates);
</script>

<h3>{t().templates()}</h3>
{#each templates as template}
  <Template {template} />
{/each}
<Template />
