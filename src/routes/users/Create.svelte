<script>
  import SvgPersonAdd from "../../lib/icons/SvgPersonAdd.svelte";
  import Content from "../../lib/Content.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import { m } from "../../lib/i18n.svelte";
  // import { store } from "../../lib/store.svelte";

  let name = $state("");
</script>

<h3 class="flex flex-row gap-2 h-11 items-center">
  <span class="size-6"><SvgPersonAdd /></span>
  {m().create()}
</h3>
<Content>
  <TextFieldOutlined id="name" bind:value={name} label={m().displayName()} />
</Content>
