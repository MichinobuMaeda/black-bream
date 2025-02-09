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
  let twitterClientId = $state("");
  let twitterClientSecret = $state("");
  let twitterBearerToken = $state("");
  let twitterEnabled = $state(false);

  $effect(() => {
    twitterClientId = store.auth?.twitter?.clientId;
    twitterClientSecret = store.auth?.twitter?.clientSecret;
    twitterBearerToken = store.auth?.twitter?.accessToken;
    twitterEnabled = !store.auth?.twitter?.deletedAt;
  });

  let errorTwitterClientId = $derived(
    twitterEnabled && !twitterClientId ? t().required() : "",
  );
  let errorTwitterClientSecret = $derived(
    twitterEnabled && !twitterClientSecret ? t().required() : "",
  );
  let errorTwitterBearerToken = $derived(
    twitterEnabled && !twitterBearerToken ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (twitterClientId !== store.auth?.twitter?.clientId ||
        twitterClientSecret !== store.auth?.twitter?.clientSecret ||
        errorTwitterBearerToken !== store.auth?.twitter?.bearerToken ||
        twitterEnabled !== !store.auth?.twitter?.deletedAt),
  );
  let valid = $derived(
    !errorTwitterClientId &&
      !errorTwitterClientSecret &&
      !errorTwitterBearerToken,
  );
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    twitterClientId = store.auth?.twitter?.clientId;
    twitterClientSecret = store.auth?.twitter?.clientSecret;
    twitterBearerToken = store.auth?.twitter?.accessToken;
    twitterEnabled = !store.auth?.twitter?.deletedAt;
  };

  const onSave = async () => {
    active = true;
    twitterClientId = twitterClientId.trim();
    twitterClientSecret = twitterClientSecret.trim();
    twitterBearerToken = twitterBearerToken.trim();
    result = await updateDocument("service", "auth", {
      twitter: {
        clientId: twitterClientId,
        clientSecret: twitterClientSecret,
        bearerToken: twitterBearerToken,
        updatedAt: new Date(),
        deletedAt: twitterEnabled ? null : new Date(),
      },
    });
    active = false;
  };
</script>

<h3>
  <span class="size-6"><TargetIcon target="twitter" /></span>
  Twitter
</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="twitterClientId"
        label="Client ID"
        type="text"
        bind:value={twitterClientId}
        message={t().current(store.auth?.twitter?.clientId ?? "--")}
        error={errorTwitterClientId}
      />
    </Fields>
    <Fields>
      <PasswordFieldOutlined
        id="twitterClientSecret"
        label="Client Secret"
        bind:value={twitterClientSecret}
        message={t().current(store.auth?.twitter?.clientSecret ?? "--")}
        error={errorTwitterClientSecret}
      />
    </Fields>
    <Fields>
      <TextFieldOutlined
        id="twitterBearerToken"
        label="Bearer Token"
        bind:value={twitterBearerToken}
        message={t().current(store.auth?.twitter?.bearerToken ?? "--")}
        error={errorTwitterBearerToken}
      />
    </Fields>
  </Wrap>
  <Wrap>
    <div class="flex grow gap-4 items-center">
      <Switch id="twitterDisabled" bind:checked={twitterEnabled} />
      {t().enabled()}
    </div>
    <Fields>
      <ActionSave
        id="updateThreads"
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
