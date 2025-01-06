<script>
  import { activateRepository } from "./lib/repository.svelte.js";
  import Layout from "./layout/layout.svelte";
  import Routes from "./routes.svelte";

  activateRepository();
</script>

<Layout>
  <Routes />
</Layout>
