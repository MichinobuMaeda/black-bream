<script>
  import { activateStore } from "./lib/store.svelte.js";
  import Layout from "./layout/layout.svelte";
  import Routes from "./routes.svelte";

  activateStore();
</script>

<Layout>
  <Routes />
</Layout>
