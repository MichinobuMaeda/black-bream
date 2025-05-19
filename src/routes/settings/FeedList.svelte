<script>
  import Content from "../../lib/components/Content.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let feeds = $state((store.conf.feeds || []).join("\n"));

  // Actions
  let changed = $derived(
    !active && feeds !== (store.conf.feeds || []).join("\n"),
  );

  const onCancel = () => {
    feeds = (store.conf.feeds || []).join("\n");
  };

  const onSave = async () => {
    feeds = feeds
      .trim()
      .split("\n")
      .map((feed) => feed.trim())
      .filter((feed) => feed)
      .join("\n");
    active = true;
    await updateDocument("service", "conf", {
      feeds: feeds.split("\n"),
    });
    active = false;
  };
</script>

<h3>{t().feeds()}</h3>
<Content>
  <TextFieldOutlined
    id="feeds"
    label={t().urlOfFeeds()}
    type="text"
    bind:value={feeds}
    lines={4}
    message={t().oneItemPerLine()}
  />
  <ActionSave
    id="feeds"
    {changed}
    valid={true}
    {onCancel}
    {onSave}
    cancelOnlyChanged
    wide
  />
</Content>
