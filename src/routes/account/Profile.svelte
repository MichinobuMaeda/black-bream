<script>
  import Content from "../../lib/Content.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import SvgCheck from "../../lib/icons/SvgCheck.svelte";
  import ButtonOutlined from "../../lib/components/ButtonOutlined.svelte";
  import SvgClose from "../../lib/icons/SvgClose.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { store, updateProfile } from "../../lib/store.svelte";

  let displayName = $state(store.user.name);
</script>

<h3>{m().profile()}</h3>
<Content>
  <div class="flex flex-row max-w-96">
    <TextFieldOutlined
      id="displayName"
      label={m().displayName()}
      type="text"
      bind:value={displayName}
      message={`${m().current()}: ${store.user.name}`}
      error={displayName ? "" : m().errorRequired()}
    />
  </div>
  <div class="flex flex-row gap-4 lg:gap-6 max-w-96 justify-end">
    <ButtonOutlined
      id="cancelUpdateProfile"
      icon={SvgClose}
      label={m().cancel()}
      onClick={() => {
        displayName = store.user.name;
      }}
      disabled={displayName === store.user.name}
    />
    <ButtonFilled
      id="updateProfile"
      icon={SvgCheck}
      label={m().save()}
      onClick={async () => {
        await updateProfile({ name: displayName });
      }}
      disabled={!displayName || displayName === store.user.name}
    />
  </div>
</Content>
