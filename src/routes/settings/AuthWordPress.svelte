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
  let wordpressService = $state("");
  let wordpressIdentifier = $state("");
  let wordpressPassword = $state("");
  let wordpressEnabled = $state(false);

  $effect(() => {
    wordpressService = store.auth?.wordpress?.service;
    wordpressIdentifier = store.auth?.wordpress?.identifier;
    wordpressPassword = store.auth?.wordpress?.password;
    wordpressEnabled = !store.auth?.wordpress?.deletedAt;
  });

  let errorWordPressService = $derived(
    wordpressEnabled && !wordpressService ? t().required() : "",
  );
  let errorWordPressIdentifier = $derived(
    wordpressEnabled && !wordpressIdentifier ? t().required() : "",
  );
  let errorWordPressPassword = $derived(
    wordpressEnabled && !wordpressPassword ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (wordpressService !== store.auth?.wordpress?.service ||
        wordpressIdentifier !== store.auth?.wordpress?.identifier ||
        wordpressPassword !== store.auth?.wordpress?.password ||
        wordpressEnabled !== !store.auth?.wordpress?.deletedAt),
  );
  let valid = $derived(
    !errorWordPressService &&
      !errorWordPressIdentifier &&
      !errorWordPressPassword,
  );
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    wordpressService = store.auth?.wordpress?.service;
    wordpressIdentifier = store.auth?.wordpress?.identifier;
    wordpressPassword = store.auth?.wordpress?.password;
    wordpressEnabled = !store.auth?.wordpress?.deletedAt;
    edit = false;
  };

  const onSave = async () => {
    active = true;
    wordpressService = wordpressService.trim();
    wordpressIdentifier = wordpressIdentifier.trim();
    wordpressPassword = wordpressPassword.trim();
    result = await updateDocument("service", "auth", {
      wordpress: {
        service: wordpressService,
        identifier: wordpressIdentifier,
        password: wordpressPassword,
        updatedAt: serverTimestamp(),
        deletedAt: wordpressEnabled ? null : serverTimestamp(),
      },
    });
    active = false;
  };
</script>

<h3>
  <span class="flex flex-row items-center gap-2 grow">
    <span class="size-6"><TargetIcon target="wordpress" /></span>
    WordPress
  </span>
  {#if edit}
    <IconButton
      id="wordpressCancelEdit"
      icon={SvgUnfoldLess}
      onClick={onCancel}
    />
  {:else}
    <IconButton
      id="wordpressEdit"
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
          id="wordpressService"
          label="Service"
          type="text"
          bind:value={wordpressService}
          message={t().current(store.auth?.wordpress?.service ?? "--")}
          error={errorWordPressService}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="wordpressIdentifier"
          label="Identifier"
          type="text"
          bind:value={wordpressIdentifier}
          message={t().current(store.auth?.wordpress?.identifier ?? "--")}
          error={errorWordPressIdentifier}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="wordpressPassword"
          label="Password"
          bind:value={wordpressPassword}
          message={t().current(store.auth?.wordpress?.password ?? "--")}
          error={errorWordPressPassword}
        />
      </Fields>
    </Wrap>
    <Wrap>
      <div class="flex grow gap-4 items-center">
        <Switch id="wordpressDisabled" bind:checked={wordpressEnabled} />
        {t().enabled()}
      </div>
      <Fields>
        <ActionSave
          id="updateWordPress"
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
