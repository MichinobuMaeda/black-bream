<script>
  import { serverTimestamp } from "firebase/firestore";
  import TargetIcon from "../../lib/components/TargetIcon.svelte";
  import IconButton from "../../lib/coarse-paper/IconButton.svelte";
  import SvgUnfoldLess from "../../lib/icons/SvgUnfoldLess.svelte";
  import SvgUnfoldMore from "../../lib/icons/SvgUnfoldMore.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let edit = $state(false);
  let active = $state(false);

  // Fields
  let misskeyToken = $state("");
  let misskeyUrl = $state("");
  let misskeyEnabled = $state(false);

  $effect(() => {
    misskeyToken = store.auth?.misskey?.token;
    misskeyUrl = store.auth?.misskey?.url;
    misskeyEnabled = !store.auth?.misskey?.deletedAt;
  });

  let errorMisskeyToken = $derived(
    misskeyEnabled && !misskeyToken ? t().required() : "",
  );
  let errorMisskeyUrl = $derived(
    misskeyEnabled && !misskeyUrl ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (misskeyToken !== store.auth?.misskey?.token ||
        misskeyUrl !== store.auth?.misskey?.url ||
        misskeyEnabled !== !store.auth?.misskey?.deletedAt),
  );
  let valid = $derived(!errorMisskeyToken && !errorMisskeyUrl);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    misskeyToken = store.auth?.misskey?.token;
    misskeyEnabled = !store.auth?.misskey?.deletedAt;
    edit = false;
  };

  const onSave = async () => {
    active = true;
    misskeyToken = misskeyToken.trim();
    misskeyUrl = misskeyUrl.trim();
    result = await updateDocument("service", "auth", {
      misskey: {
        token: misskeyToken,
        url: misskeyUrl,
        updatedAt: serverTimestamp(),
        deletedAt: misskeyEnabled ? null : serverTimestamp(),
      },
    });
    active = false;
  };
</script>

<h3>
  <span class="flex flex-row items-center gap-2 grow">
    <span class="size-6"><TargetIcon target="misskey" /></span>
    Misskey
  </span>
  {#if edit}
    <IconButton
      id="instagramCancelEdit"
      icon={SvgUnfoldLess}
      onClick={onCancel}
    />
  {:else}
    <IconButton
      id="instagramEdit"
      icon={SvgUnfoldMore}
      onClick={() => (edit = true)}
    />
  {/if}
</h3>
{#if edit}
  <Content>
    <Wrap>
      <Fields>
        <TextFieldOutlined
          id="misskeyToken"
          label="Access token"
          type="text"
          bind:value={misskeyToken}
          message={t().current(store.auth?.misskey?.token ?? "--")}
          error={errorMisskeyToken}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="misskeyUrl"
          label="URL"
          type="text"
          bind:value={misskeyUrl}
          message={t().current(store.auth?.misskey?.url ?? "--")}
          error={errorMisskeyUrl}
        />
      </Fields>
      <div class="flex grow gap-4 items-center">
        <Switch id="misskeyDisabled" bind:checked={misskeyEnabled} />
        {t().enabled()}
      </div>
      <Fields>
        <ActionSave
          id="updateMisskey"
          {changed}
          {valid}
          {onCancel}
          {onSave}
          {error}
        />
      </Fields>
    </Wrap>
  </Content>
{/if}
