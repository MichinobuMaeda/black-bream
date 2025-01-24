<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
  import ButtonOutlined from "../../lib/components/ButtonOutlined.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { formatDateTime } from "../../lib/i18n.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let threadsCallBackUrl = $state("");
  let threadsClientId = $state("");
  let threadsClientSecret = $state("");
  let threadsAccessToken = $state("");
  let threadsExpiredAt = $state(null);
  let threadsEnabled = $state(false);

  $effect(() => {
    threadsCallBackUrl = store.auth?.threads?.callBackUrl;
    threadsClientId = store.auth?.threads?.clientId;
    threadsClientSecret = store.auth?.threads?.clientSecret;
    threadsAccessToken = store.auth?.threads?.accessToken;
    threadsExpiredAt = store.auth?.threads?.expiredAt;
    threadsEnabled = !store.auth?.threads?.deletedAt;
  });

  let errorThreadsService = $derived(
    threadsEnabled && !threadsCallBackUrl ? t().required() : "",
  );
  let errorThreadsIdentifier = $derived(
    threadsEnabled && !threadsClientId ? t().required() : "",
  );
  let errorThreadsPassword = $derived(
    threadsEnabled && !threadsClientSecret ? t().required() : "",
  );

  let threadsAccessTokenIsValid = $derived(
    threadsAccessToken &&
      threadsExpiredAt &&
      threadsExpiredAt.toDate() > new Date(),
  );

  let threadsAccessTokenReady = $derived(
    store.auth?.threads?.callBackUrl &&
      store.auth?.threads?.clientId &&
      store.auth?.threads?.clientSecret,
  );

  // Actions
  let url = $derived(
    "https://threads.net/oauth/authorize" +
      `?client_id=${store.auth?.threads?.clientId}` +
      `&redirect_uri=${encodeURIComponent(store.auth?.threads?.callBackUrl)}` +
      "&response_type=code" +
      "&scope=threads_basic,threads_content_publish",
  );
  let result = $state(null);
  let changed = $derived(
    !active &&
      (threadsCallBackUrl !== store.auth?.threads?.callBackUrl ||
        threadsClientId !== store.auth?.threads?.clientId ||
        threadsClientSecret !== store.auth?.threads?.clientSecret ||
        threadsEnabled !== !store.auth?.threads?.deletedAt),
  );
  let valid = $derived(
    !errorThreadsService && !errorThreadsIdentifier && !errorThreadsPassword,
  );
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    threadsCallBackUrl = store.auth?.threads?.callBackUrl;
    threadsClientId = store.auth?.threads?.clientId;
    threadsClientSecret = store.auth?.threads?.clientSecret;
    threadsEnabled = !store.auth?.threads?.deletedAt;
  };

  const onSave = async () => {
    active = true;
    threadsCallBackUrl = threadsCallBackUrl.trim();
    threadsClientId = threadsClientId.trim();
    threadsClientSecret = threadsClientSecret.trim();
    result = await updateDocument("service", "auth", {
      threads: {
        callBackUrl: threadsCallBackUrl,
        clientId: threadsClientId,
        clientSecret: threadsClientSecret,
        updatedAt: new Date(),
        deletedAt: threadsEnabled ? null : new Date(),
      },
    });
    active = false;
  };
</script>

<h3>Threads</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="threadsClientId"
        label="Client ID"
        type="text"
        bind:value={threadsClientId}
        message={t().current(store.auth?.threads?.clientId ?? "--")}
        error={errorThreadsIdentifier}
      />
    </Fields>
    <Fields>
      <PasswordFieldOutlined
        id="threadsClientSecret"
        label="Client Secret"
        bind:value={threadsClientSecret}
        message={t().current(store.auth?.threads?.clientSecret ?? "--")}
        error={errorThreadsPassword}
      />
    </Fields>
    <Fields>
      <TextFieldOutlined
        id="threadsCallBackUrl"
        label="Call back URL"
        type="text"
        bind:value={threadsCallBackUrl}
        message={t().current(store.auth?.threads?.callBackUrl ?? "--")}
        error={errorThreadsService}
      />
    </Fields>
    <Fields>
      {#if threadsAccessTokenIsValid}
        <PasswordFieldOutlined
          id="threadsAccessToken"
          label="Access Token"
          bind:value={threadsAccessToken}
          message={`expired: ${formatDateTime(threadsExpiredAt?.toDate() || "--")}`}
          readonly
        />
      {:else if threadsAccessTokenReady && !changed}
        <ButtonOutlined
          id="getThreadsAccessToken"
          label={t().getAccessToken()}
          onClick={() => window.open(url, "_system")}
        />
      {/if}
    </Fields>
  </Wrap>
  <Wrap>
    <div class="flex grow gap-4 items-center">
      <Switch id="threadsDisabled" bind:checked={threadsEnabled} />
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
