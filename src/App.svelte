<script>
  import { activateI18n } from "./lib/i18n.svelte.js";
  import { activateStore } from "./lib/store.svelte.js";
  import Layout from "./layout/layout.svelte";
  import Routes from "./routes.svelte";

  activateI18n();
  activateStore();
</script>

<Layout>
  <Routes />
</Layout>
