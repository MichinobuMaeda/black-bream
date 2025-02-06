<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import GroupedCheckBox from "../../lib/components/GroupedCheckBox.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { socialLoginProviders, updateDocument } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let socialLogins = $state(store.conf.socialLogins ?? []);
  let socialLoginItems = socialLoginProviders.map((item) => ({
    value: item.id,
    label: item.label,
  }));

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (socialLogins.length !== (store.conf.socialLogins ?? []).length ||
        socialLogins.some((v) => !socialLogins.includes(v))),
  );
  let valid = true;
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    socialLogins = store.conf.socialLogins ?? [];
  };

  const onSave = async () => {
    active = true;
    result = await updateDocument("service", "conf", {
      socialLogins,
    });
    active = false;
  };
</script>

<h3>{t().socialLogin()}</h3>
<Content>
  <Wrap>
    <Fields>
      <Wrap>
        <GroupedCheckBox
          id="socialLogins"
          items={socialLoginItems}
          bind:value={socialLogins}
        />
      </Wrap>
    </Fields>
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
