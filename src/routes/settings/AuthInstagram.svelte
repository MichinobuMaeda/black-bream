<script>
  import TargetIcon from "../../lib/components/TargetIcon.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import PasswordFieldOutlined from "../../lib/coarse-paper/PasswordFieldOutlined.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let instagramClientId = $state("");
  let instagramClientSecret = $state("");
  let instagramAccessToken = $state("");
  let instagramEnabled = $state(false);

  $effect(() => {
    instagramClientId = store.auth?.instagram?.clientId;
    instagramClientSecret = store.auth?.instagram?.clientSecret;
    instagramAccessToken = store.auth?.instagram?.accessToken;
    instagramEnabled = !store.auth?.instagram?.deletedAt;
  });
  let errorInstagramIdentifier = $derived(
    instagramEnabled && !instagramClientId ? t().required() : "",
  );
  let errorInstagramPassword = $derived(
    instagramEnabled && !instagramClientSecret ? t().required() : "",
  );

  let errorInstagramAccessToken = $derived(
    instagramEnabled && !instagramAccessToken ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (instagramClientId !== store.auth?.instagram?.clientId ||
        instagramClientSecret !== store.auth?.instagram?.clientSecret ||
        instagramAccessToken !== store.auth?.instagram?.accessToken ||
        instagramEnabled !== !store.auth?.instagram?.deletedAt),
  );
  let valid = $derived(
    !errorInstagramIdentifier &&
      !errorInstagramPassword &&
      !errorInstagramAccessToken,
  );
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    instagramClientId = store.auth?.instagram?.clientId;
    instagramClientSecret = store.auth?.instagram?.clientSecret;
    instagramAccessToken = store.auth?.instagram?.accessToken;
    instagramEnabled = !store.auth?.instagram?.deletedAt;
  };

  const onSave = async () => {
    active = true;
    instagramAccessToken = instagramAccessToken.trim();
    instagramClientId = instagramClientId.trim();
    instagramClientSecret = instagramClientSecret.trim();
    result = await updateDocument("service", "auth", {
      instagram: {
        accessToken: instagramAccessToken,
        clientId: instagramClientId,
        clientSecret: instagramClientSecret,
        updatedAt: new Date(),
        deletedAt: instagramEnabled ? null : new Date(),
      },
    });
    active = false;
  };
</script>

<h3>
  <span class="size-6"><TargetIcon target="instagram" /></span>
  Instagram
</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="instagramClientId"
        label="Client ID"
        type="text"
        bind:value={instagramClientId}
        message={t().current(store.auth?.instagram?.clientId ?? "--")}
        error={errorInstagramIdentifier}
      />
    </Fields>
    <Fields>
      <PasswordFieldOutlined
        id="instagramClientSecret"
        label="Client Secret"
        bind:value={instagramClientSecret}
        message={t().current(store.auth?.instagram?.clientSecret ?? "--")}
        error={errorInstagramPassword}
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
        cancelOnlyChanged
      />
    </Fields>
  </Wrap>
</Content>
