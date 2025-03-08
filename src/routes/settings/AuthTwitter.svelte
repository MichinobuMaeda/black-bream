<script>
  import { nanoid } from "nanoid";
  import TargetIcon from "../../lib/components/TargetIcon.svelte";
  import IconButton from "../../lib/coarse-paper/IconButton.svelte";
  import SvgUnfoldLess from "../../lib/icons/SvgUnfoldLess.svelte";
  import SvgUnfoldMore from "../../lib/icons/SvgUnfoldMore.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import ButtonOutlined from "../../lib/coarse-paper/ButtonOutlined.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";
  import {
    saveTwitterState,
    saveTwitterChallenge,
  } from "../../lib/localstorage";

  let edit = $state(false);
  let active = $state(false);

  // Fields
  let twitterCallBackUrl = $state("");
  let twitterClientId = $state("");
  let twitterClientSecret = $state("");
  let twitterAccessToken = $state("");
  let twitterRefreshToken = $state("");
  let twitterExpiredAt = $state(null);
  let twitterEnabled = $state(false);

  $effect(() => {
    twitterCallBackUrl = store.auth?.twitter?.callBackUrl;
    twitterClientId = store.auth?.twitter?.clientId;
    twitterClientSecret = store.auth?.twitter?.clientSecret;
    twitterAccessToken = store.auth?.twitter?.accessToken;
    twitterRefreshToken = store.auth?.twitter?.refreshToken;
    twitterExpiredAt = store.auth?.twitter?.expiredAt;
    twitterEnabled = !store.auth?.twitter?.deletedAt;
  });

  let errorTwitterService = $derived(
    twitterEnabled && !twitterCallBackUrl ? t().required() : "",
  );
  let errorTwitterIdentifier = $derived(
    twitterEnabled && !twitterClientId ? t().required() : "",
  );
  let errorTwitterPassword = $derived(
    twitterEnabled && !twitterClientSecret ? t().required() : "",
  );

  let twitterAccessTokenIsValid = $derived(
    twitterAccessToken &&
      twitterExpiredAt &&
      twitterExpiredAt.toDate() > new Date(),
  );

  let twitterAccessTokenReady = $derived(
    store.auth?.twitter?.callBackUrl &&
      store.auth?.twitter?.clientId &&
      store.auth?.twitter?.clientSecret,
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (twitterCallBackUrl !== store.auth?.twitter?.callBackUrl ||
        twitterClientId !== store.auth?.twitter?.clientId ||
        twitterClientSecret !== store.auth?.twitter?.clientSecret ||
        twitterEnabled !== !store.auth?.twitter?.deletedAt),
  );
  let valid = $derived(
    !errorTwitterService && !errorTwitterIdentifier && !errorTwitterPassword,
  );
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    twitterCallBackUrl = store.auth?.twitter?.callBackUrl;
    twitterClientId = store.auth?.twitter?.clientId;
    twitterClientSecret = store.auth?.twitter?.clientSecret;
    twitterEnabled = !store.auth?.twitter?.deletedAt;
    edit = false;
  };

  const onSave = async () => {
    active = true;
    twitterCallBackUrl = twitterCallBackUrl.trim();
    twitterClientId = twitterClientId.trim();
    twitterClientSecret = twitterClientSecret.trim();
    result = await updateDocument("service", "auth", {
      twitter: {
        callBackUrl: twitterCallBackUrl,
        clientId: twitterClientId,
        clientSecret: twitterClientSecret,
        updatedAt: new Date(),
        deletedAt: twitterEnabled ? null : new Date(),
      },
    });
    active = false;
  };

  const getTwitterAccessToken = () => {
    const state = nanoid(16);
    saveTwitterState(state);
    const challenge = nanoid(32);
    saveTwitterChallenge(challenge);
    const scope = ["tweet.read", "tweet.write", "users.read", "offline.access"];

    const url =
      "https://x.com/i/oauth2/authorize" +
      "?response_type=code" +
      `&client_id=${twitterClientId}` +
      `&redirect_uri=${twitterCallBackUrl}` +
      `&scope=${scope.join("%20")}` +
      `&state=${state}` +
      `&code_challenge=${challenge}` +
      "&code_challenge_method=plain";

    window.open(url, "_system");
  };
</script>

<h3>
  <span class="flex flex-row items-center gap-2 grow">
    <span class="size-6"><TargetIcon target="twitter" /></span>
    Twitter
  </span>
  {#if edit}
    <IconButton
      id="twitterCancelEdit"
      icon={SvgUnfoldLess}
      onClick={onCancel}
    />
  {:else}
    <IconButton
      id="twitterEdit"
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
          id="twitterClientId"
          label="Client ID"
          type="text"
          bind:value={twitterClientId}
          message={t().current(store.auth?.twitter?.clientId ?? "--")}
          error={errorTwitterIdentifier}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="twitterClientSecret"
          label="Client Secret"
          bind:value={twitterClientSecret}
          message={t().current(store.auth?.twitter?.clientSecret ?? "--")}
          error={errorTwitterPassword}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="twitterCallBackUrl"
          label="Call back URL"
          type="text"
          bind:value={twitterCallBackUrl}
          message={t().current(store.auth?.twitter?.callBackUrl ?? "--")}
          error={errorTwitterService}
        />
      </Fields>
      <Fields>
        {#if twitterAccessTokenIsValid}
          <TextFieldOutlined
            id="twitterAccessToken"
            label="Access Token"
            bind:value={twitterAccessToken}
            message={t().current(store.auth?.twitter?.accessToken ?? "--")}
            readonly
          />
          <TextFieldOutlined
            id="twitterRefreshToken"
            label="Refresh Token"
            bind:value={twitterRefreshToken}
            message={t().current(store.auth?.twitter?.refreshToken ?? "--")}
            readonly
          />
        {:else if twitterAccessTokenReady && !changed}
          <ButtonOutlined
            id="getTwitterAccessToken"
            label={t().getAccessToken()}
            onClick={() => getTwitterAccessToken()}
          />
        {/if}
      </Fields>
    </Wrap>
    <Wrap>
      <div class="flex grow gap-4 items-center">
        <Switch id="twitterDisabled" bind:checked={twitterEnabled} />
        {t().enabled()}
      </div>
      <Fields>
        <ActionSave
          id="updateTwitter"
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
