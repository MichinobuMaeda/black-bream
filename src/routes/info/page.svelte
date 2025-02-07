<script>
  import Content from "../../lib/components/Content.svelte";
  import SvgInfo from "../../lib/icons/SvgInfo.svelte";
  import IconButton from "../../lib/coarse-paper/IconButton.svelte";
  import SvgSync from "../../lib/icons/SvgSync.svelte";
  import MarkDown from "../../lib/components/MarkDown.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { version, repository } from "../../../package.json";

  let desc = $derived(store.conf?.desc ?? "");
  const url = repository.url.replace(/git\+/, "");
</script>

<h2><SvgInfo /> {t().info()}</h2>
<Content>
  <div class="flex flex-row gap-2 items-center">
    <span class="text-2xl">{t().appTitle()}</span>
    <span class="text-sm flex flex-row items-center">
      <IconButton
        id="reload"
        icon={SvgSync}
        onClick={() => window.location.reload()}
      />
      Ver.{version}</span
    >
  </div>
  <a href={url} class="text-sm">{url}</a>
  <MarkDown src={desc} />
</Content>
