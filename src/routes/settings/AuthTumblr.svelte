<script>
  import { nanoid } from "nanoid";
  import { serverTimestamp } from "firebase/firestore";
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
  import { localstorage } from "../../lib/localstorage";

  let edit = $state(false);
  let active = $state(false);

  // Fields
  let tumblrCallBackUrl = $state("");
  let tumblrClientId = $state("");
  let tumblrClientSecret = $state("");
  let tumblrBlogId = $state("");
  let tumblrAccessToken = $state("");
  let tumblrRefreshToken = $state("");
  let tumblrExpiredAt = $state(null);
  let tumblrEnabled = $state(false);

  $effect(() => {
    tumblrCallBackUrl = store.auth?.tumblr?.callBackUrl;
    tumblrClientId = store.auth?.tumblr?.clientId;
    tumblrClientSecret = store.auth?.tumblr?.clientSecret;
    tumblrBlogId = store.auth?.tumblr?.blogId;
    tumblrAccessToken = store.auth?.tumblr?.accessToken;
    tumblrRefreshToken = store.auth?.tumblr?.refreshToken;
    tumblrExpiredAt = store.auth?.tumblr?.expiredAt;
    tumblrEnabled = !store.auth?.tumblr?.deletedAt;
  });

  let errorTumblrService = $derived(
    tumblrEnabled && !tumblrCallBackUrl ? t().required() : "",
  );
  let errorTumblrClientId = $derived(
    tumblrEnabled && !tumblrClientId ? t().required() : "",
  );
  let errorTumblrClientSecret = $derived(
    tumblrEnabled && !tumblrClientSecret ? t().required() : "",
  );
  let errorTumblrBlogId = $derived(
    tumblrEnabled && !tumblrBlogId ? t().required() : "",
  );

  let tumblrAccessTokenIsValid = $derived(
    tumblrAccessToken &&
      tumblrExpiredAt &&
      tumblrExpiredAt.toDate().getTime() > new Date().getTime(),
  );

  let tumblrAccessTokenReady = $derived(
    store.auth?.tumblr?.callBackUrl &&
      store.auth?.tumblr?.clientId &&
      store.auth?.tumblr?.clientSecret,
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (tumblrCallBackUrl !== store.auth?.tumblr?.callBackUrl ||
        tumblrClientId !== store.auth?.tumblr?.clientId ||
        tumblrClientSecret !== store.auth?.tumblr?.clientSecret ||
        tumblrEnabled !== !store.auth?.tumblr?.deletedAt),
  );
  let valid = $derived(
    !errorTumblrService && !errorTumblrClientId && !errorTumblrClientSecret,
  );
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    tumblrCallBackUrl = store.auth?.tumblr?.callBackUrl;
    tumblrClientId = store.auth?.tumblr?.clientId;
    tumblrClientSecret = store.auth?.tumblr?.clientSecret;
    tumblrBlogId = store.auth?.tumblr?.blogId;
    tumblrEnabled = !store.auth?.tumblr?.deletedAt;
    edit = false;
  };

  const onSave = async () => {
    active = true;
    tumblrCallBackUrl = tumblrCallBackUrl.trim();
    tumblrClientId = tumblrClientId.trim();
    tumblrClientSecret = tumblrClientSecret.trim();
    result = await updateDocument("service", "auth", {
      tumblr: {
        callBackUrl: tumblrCallBackUrl,
        clientId: tumblrClientId,
        clientSecret: tumblrClientSecret,
        blogId: tumblrBlogId,
        updatedAt: serverTimestamp(),
        deletedAt: tumblrEnabled ? null : serverTimestamp(),
      },
    });
    active = false;
  };

  const getTumblrAccessToken = () => {
    const state = nanoid(16);
    localstorage.tumblr.state.save(state);
    const scope = ["basic", "write", "offline_access"];

    const url =
      "https://www.tumblr.com/oauth2/authorize" +
      `?client_id=${tumblrClientId}` +
      "&response_type=code" +
      `&scope=${scope.join("%20")}` +
      `&redirect_uri=${tumblrCallBackUrl}` +
      `&state=${state}`;

    window.open(url, "_system");
  };
</script>

<h3>
  <span class="flex flex-row items-center gap-2 grow">
    <span class="size-6"><TargetIcon target="tumblr" /></span>
    Tumblr
  </span>
  {#if edit}
    <IconButton id="tumblrCancelEdit" icon={SvgUnfoldLess} onClick={onCancel} />
  {:else}
    <IconButton
      id="tumblrEdit"
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
          id="tumblrClientId"
          label="Consumer Key"
          type="text"
          bind:value={tumblrClientId}
          message={t().current(store.auth?.tumblr?.clientId ?? "--")}
          error={errorTumblrClientId}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="tumblrClientSecret"
          label="Consumer Secret"
          bind:value={tumblrClientSecret}
          message={t().current(store.auth?.tumblr?.clientSecret ?? "--")}
          error={errorTumblrClientSecret}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="tumblrCallBackUrl"
          label="Call back URL"
          type="text"
          bind:value={tumblrCallBackUrl}
          message={t().current(store.auth?.tumblr?.callBackUrl ?? "--")}
          error={errorTumblrService}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="tumblrBlogId"
          label="Blog ID"
          type="text"
          bind:value={tumblrBlogId}
          message={t().current(store.auth?.tumblr?.blogId ?? "--")}
          error={errorTumblrBlogId}
        />
      </Fields>
      <Fields>
        {#if tumblrAccessTokenIsValid}
          <TextFieldOutlined
            id="tumblrAccessToken"
            label="Access Token"
            bind:value={tumblrAccessToken}
            message={t().current(store.auth?.tumblr?.accessToken ?? "--")}
            readonly
          />
          <TextFieldOutlined
            id="tumblrRefreshToken"
            label="Refresh Token"
            bind:value={tumblrRefreshToken}
            message={t().current(store.auth?.tumblr?.refreshToken ?? "--")}
            readonly
          />
        {:else if tumblrAccessTokenReady && !changed}
          <ButtonOutlined
            id="getTumblrAccessToken"
            label={t().getAccessToken()}
            onClick={() => getTumblrAccessToken()}
          />
        {/if}
      </Fields>
    </Wrap>
    <Wrap>
      <div class="flex grow gap-4 items-center">
        <Switch id="tumblrDisabled" bind:checked={tumblrEnabled} />
        {t().enabled()}
      </div>
      <Fields>
        <ActionSave
          id="updateTumblr"
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
