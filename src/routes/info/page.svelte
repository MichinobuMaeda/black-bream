<script>
  import Content from "../../lib/Content.svelte";
  import SvgInfo from "../../lib/icons/SvgInfo.svelte";
  import MarkDown from "../../lib/MarkDown.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { store } from "../../lib/store.svelte.js";
  import { version, repository } from "../../../package.json";

  let desc = $derived(store.conf?.desc ?? "");
  const url = repository.url.replace(/git\+/, "");
</script>

<h2><SvgInfo /> {m.info()}</h2>
<Content>
  <div>
    <span class="text-2xl">{m.appTitle()}</span>
    <span class="text-sm">Ver.{version}</span>
  </div>
  <a href={url} class="text-sm">{url}</a>
  <MarkDown src={desc} />
</Content>
