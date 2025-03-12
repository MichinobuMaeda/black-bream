<script>
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
  let instagramClientId = $state("");
  let instagramAccessToken = $state("");
  let instagramEnabled = $state(false);

  $effect(() => {
    instagramClientId = store.auth?.instagram?.clientId;
    instagramAccessToken = store.auth?.instagram?.accessToken;
    instagramEnabled = !store.auth?.instagram?.deletedAt;
  });
  let errorInstagramClientId = $derived(
    instagramEnabled && !instagramClientId ? t().required() : "",
  );

  let errorInstagramAccessToken = $derived(
    instagramEnabled && !instagramAccessToken ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (instagramClientId !== store.auth?.instagram?.clientId ||
        instagramAccessToken !== store.auth?.instagram?.accessToken ||
        instagramEnabled !== !store.auth?.instagram?.deletedAt),
  );
  let valid = $derived(!errorInstagramClientId && !errorInstagramAccessToken);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    instagramClientId = store.auth?.instagram?.clientId;
    instagramAccessToken = store.auth?.instagram?.accessToken;
    instagramEnabled = !store.auth?.instagram?.deletedAt;
    edit = false;
  };

  const onSave = async () => {
    active = true;
    instagramAccessToken = instagramAccessToken.trim();
    instagramClientId = instagramClientId.trim();
    result = await updateDocument("service", "auth", {
      instagram: {
        clientId: instagramClientId,
        accessToken: instagramAccessToken,
        updatedAt: new Date(),
        deletedAt: instagramEnabled ? null : new Date(),
      },
    });
    active = false;
  };
</script>

<h3>
  <span class="flex flex-row items-center gap-2 grow">
    <span class="size-6"><TargetIcon target="instagram" /></span>
    Instagram
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
          id="instagramClientId"
          label="Client ID"
          type="text"
          bind:value={instagramClientId}
          message={t().current(store.auth?.instagram?.clientId ?? "--")}
          error={errorInstagramClientId}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="instagramAccessToken"
          label="Access Token"
          type="text"
          bind:value={instagramAccessToken}
          message={t().current(store.auth?.instagram?.accessToken ?? "--")}
          error={errorInstagramAccessToken}
        />
      </Fields>
    </Wrap>
    <Wrap>
      <div class="flex grow gap-4 items-center">
        <Switch id="instagramDisabled" bind:checked={instagramEnabled} />
        {t().enabled()}
      </div>
      <Fields>
        <ActionSave
          id="updateInstagram"
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
