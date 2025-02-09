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
  import { formatDateTime } from "../../lib/datetime.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let twitterClientId = $state("");
  let twitterClientSecret = $state("");
  let twitterAccessToken = $state("");
  let twitterExpiredAt = $state(null);
  let twitterEnabled = $state(false);

  $effect(() => {
    twitterClientId = store.auth?.twitter?.clientId;
    twitterClientSecret = store.auth?.twitter?.clientSecret;
    twitterAccessToken = store.auth?.twitter?.accessToken;
    twitterExpiredAt = store.auth?.twitter?.expiredAt;
    twitterEnabled = !store.auth?.twitter?.deletedAt;
  });

  let errorTwitterClientId = $derived(
    twitterEnabled && !twitterClientId ? t().required() : "",
  );
  let errorTwitterClientSecret = $derived(
    twitterEnabled && !twitterClientSecret ? t().required() : "",
  );
  let errorTwitterAccessToken = $derived(
    twitterEnabled && !twitterAccessToken ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (twitterClientId !== store.auth?.twitter?.clientId ||
        twitterClientSecret !== store.auth?.twitter?.clientSecret ||
        twitterEnabled !== !store.auth?.twitter?.deletedAt),
  );
  let valid = $derived(
    !errorTwitterClientId &&
      !errorTwitterClientSecret &&
      !errorTwitterAccessToken,
  );
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    twitterClientId = store.auth?.twitter?.clientId;
    twitterClientSecret = store.auth?.twitter?.clientSecret;
    twitterAccessToken = store.auth?.twitter?.accessToken;
    twitterEnabled = !store.auth?.twitter?.deletedAt;
  };

  const onSave = async () => {
    active = true;
    twitterClientId = twitterClientId.trim();
    twitterClientSecret = twitterClientSecret.trim();
    twitterAccessToken = twitterAccessToken.trim();
    result = await updateDocument("service", "auth", {
      twitter: {
        clientId: twitterClientId,
        clientSecret: twitterClientSecret,
        accessToken: twitterAccessToken,
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
        id="twitterAccessToken"
        label="Access Token"
        bind:value={twitterAccessToken}
        message={`expired: ${formatDateTime(twitterExpiredAt?.toDate() || "--")}`}
        error={errorTwitterAccessToken}
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
