<script>
  import TargetIcon from "../../lib/components/TargetIcon.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let mastodonToken = $state("");
  let mastodonUrl = $state("");
  let mastodonEnabled = $state(false);

  $effect(() => {
    mastodonToken = store.auth?.mastodon?.token;
    mastodonUrl = store.auth?.mastodon?.url;
    mastodonEnabled = !store.auth?.mastodon?.deletedAt;
  });

  let errorMastodonToken = $derived(
    mastodonEnabled && !mastodonToken ? t().required() : "",
  );
  let errorMastodonUrl = $derived(
    mastodonEnabled && !mastodonUrl ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (mastodonToken !== store.auth?.mastodon?.token ||
        mastodonUrl !== store.auth?.mastodon?.url ||
        mastodonEnabled !== !store.auth?.mastodon?.deletedAt),
  );
  let valid = $derived(!errorMastodonToken && !errorMastodonUrl);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    mastodonToken = store.auth?.mastodon?.token;
    mastodonEnabled = !store.auth?.mastodon?.deletedAt;
  };

  const onSave = async () => {
    active = true;
    mastodonToken = mastodonToken.trim();
    mastodonUrl = mastodonUrl.trim();
    result = await updateDocument("service", "auth", {
      mastodon: {
        token: mastodonToken,
        url: mastodonUrl,
        updatedAt: new Date(),
        deletedAt: mastodonEnabled ? null : new Date(),
      },
    });
    active = false;
  };
</script>

<h3>
  <span class="size-6"><TargetIcon target="mastodon" /></span>
  Mastodon
</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="mastodonToken"
        label="Access token"
        type="text"
        bind:value={mastodonToken}
        message={t().current(store.auth?.mastodon?.token ?? "--")}
        error={errorMastodonToken}
      />
    </Fields>
    <Fields>
      <TextFieldOutlined
        id="mastodonUrl"
        label="URL"
        type="text"
        bind:value={mastodonUrl}
        message={t().current(store.auth?.mastodon?.url ?? "--")}
        error={errorMastodonUrl}
      />
    </Fields>
    <div class="flex grow gap-4 items-center">
      <Switch id="mastodonDisabled" bind:checked={mastodonEnabled} />
      {t().enabled()}
    </div>
    <Fields>
      <ActionSave
        id="updateMastodon"
        {changed}
        {valid}
        {onCancel}
        {onSave}
        {error}
        cancelOnlyChanged
      />
    </Fields>
  </Wrap>
</Content>
