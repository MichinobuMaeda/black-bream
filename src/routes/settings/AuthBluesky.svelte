<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let blueskyService = $state("");
  let blueskyIdentifier = $state("");
  let blueskyPassword = $state("");
  let blueskyEnabled = $state(false);

  $effect(() => {
    blueskyService = store.auth?.bluesky?.service;
    blueskyIdentifier = store.auth?.bluesky?.identifier;
    blueskyPassword = store.auth?.bluesky?.password;
    blueskyEnabled = !store.auth?.bluesky?.deletedAt;
  });

  let errorBlueskyService = $derived(
    blueskyEnabled && !blueskyService ? t().required() : "",
  );
  let errorBlueskyIdentifier = $derived(
    blueskyEnabled && !blueskyIdentifier ? t().required() : "",
  );
  let errorBlueskyPassword = $derived(
    blueskyEnabled && !blueskyPassword ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (blueskyService !== store.auth?.bluesky?.service ||
        blueskyIdentifier !== store.auth?.bluesky?.identifier ||
        blueskyPassword !== store.auth?.bluesky?.password ||
        blueskyEnabled !== !store.auth?.bluesky?.deletedAt),
  );
  let valid = $derived(
    !errorBlueskyService && !errorBlueskyIdentifier && !errorBlueskyPassword,
  );
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    blueskyService = store.auth?.bluesky?.service;
    blueskyIdentifier = store.auth?.bluesky?.identifier;
    blueskyPassword = store.auth?.bluesky?.password;
    blueskyEnabled = !store.auth?.bluesky?.deletedAt;
  };

  const onSave = async () => {
    active = true;
    blueskyService = blueskyService.trim();
    blueskyIdentifier = blueskyIdentifier.trim();
    blueskyPassword = blueskyPassword.trim();
    result = await updateDocument("service", "auth", {
      bluesky: {
        service: blueskyService,
        identifier: blueskyIdentifier,
        password: blueskyPassword,
        updatedAt: new Date(),
        deletedAt: blueskyEnabled ? null : new Date(),
      },
    });
    active = false;
  };
</script>

<h3>Bluesky</h3>
<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id="blueskyService"
        label="Service"
        type="text"
        bind:value={blueskyService}
        message={t().current(store.auth?.bluesky?.service ?? "--")}
        error={errorBlueskyService}
      />
    </Fields>
    <Fields>
      <TextFieldOutlined
        id="blueskyIdentifier"
        label="Identifier"
        type="text"
        bind:value={blueskyIdentifier}
        message={t().current(store.auth?.bluesky?.identifier ?? "--")}
        error={errorBlueskyIdentifier}
      />
    </Fields>
    <Fields>
      <PasswordFieldOutlined
        id="blueskyPassword"
        label="Password"
        bind:value={blueskyPassword}
        message={t().current(store.auth?.bluesky?.password ?? "--")}
        error={errorBlueskyPassword}
      />
    </Fields>
  </Wrap>
  <Wrap>
    <div class="flex grow gap-4 items-center">
      <Switch id="blueskyDisabled" bind:checked={blueskyEnabled} />
      {t().enabled()}
    </div>
    <Fields>
      <ActionSave
        id="updateBluesky"
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
