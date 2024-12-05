<script>
  import Content from "../lib/Content.svelte";
  import MarkDown from "../lib/MarkDown.svelte";
  import { getStore } from "../lib/store.svelte";

  const store = getStore();
  let desc = $derived(store.conf?.desc ?? "");
</script>

<Content>
  <MarkDown src={desc} />
</Content>
