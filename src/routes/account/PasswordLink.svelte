<script>
  import Content from "../../lib/Content.svelte";
  import { m } from "../../lib/store.svelte.js";
</script>

<Content>
  <div>{m().descPasswordLink()}</div>
  <div>{m().allowEmailsFrom()}</div>
  <div>{m().sentPasswordLink()}</div>
</Content>
