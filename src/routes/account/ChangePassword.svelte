<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import PasswordFieldOutlined from "../../lib/coarse-paper/PasswordFieldOutlined.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { changePassword } from "../../lib/firebase.js";
  import { validatePassword } from "../../lib/validator";

  let active = $state(false);

  // Fields
  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmNewPassword = $state("");

  let validateCurrentPassword = $derived(
    !newPassword || currentPassword ? "" : t().required(),
  );
  let validateNewPassword = $derived(
    !newPassword || validatePassword(newPassword)
      ? ""
      : t().errorPasswordStrength(),
  );
  let validateConfirmNewPassword = $derived(
    !newPassword || newPassword === confirmNewPassword
      ? ""
      : t().errorPasswordConfirmation(),
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active && (!!currentPassword || !!newPassword || !!confirmNewPassword),
  );
  let valid = $derived(
    !validateCurrentPassword &&
      !validateNewPassword &&
      !validateConfirmNewPassword,
  );
  let error = $derived(
    !result?.err
      ? ""
      : result.err?.includes("auth/wrong-password")
        ? t().currentPasswordError()
        : t().errorOnDataSave(),
  );

  const onCancel = () => {
    currentPassword = "";
    newPassword = "";
    confirmNewPassword = "";
  };

  const onSave = async () => {
    active = true;
    result = await changePassword(store, currentPassword, newPassword);
    onCancel();
    active = false;
  };
</script>

<h3>{t().changePassword()}</h3>
<Content>
  <div>
    {t().passwordRequirements()}
  </div>
  <Wrap>
    <Fields>
      <PasswordFieldOutlined
        id="currentPassword"
        label={t().currentPassword()}
        bind:value={currentPassword}
        error={validateCurrentPassword}
      />
      <PasswordFieldOutlined
        id="newPassword"
        label={t().newPassword()}
        bind:value={newPassword}
        error={validateNewPassword}
      />
      <PasswordFieldOutlined
        id="confirmNewPassword"
        label={t().confirmNewPassword()}
        bind:value={confirmNewPassword}
        error={validateConfirmNewPassword}
      />
    </Fields>
    <ActionFields>
      <ActionSave
        id="changePassword"
        {changed}
        {valid}
        {onCancel}
        {onSave}
        {error}
        cancelOnlyChanged
      />
    </ActionFields>
  </Wrap>
</Content>
