<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { m } from "../../lib/i18n.svelte.js";
  import { changePassword } from "../../lib/repository.svelte.js";
  import { validatePassword } from "../../lib/validator";

  // Fields
  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmNewPassword = $state("");

  let validateCurrentPassword = $derived(
    !newPassword || currentPassword ? "" : m.required(),
  );
  let validateNewPassword = $derived(
    !newPassword || validatePassword(newPassword)
      ? ""
      : m.errorPasswordStrength(),
  );
  let validateConfirmNewPassword = $derived(
    !newPassword || newPassword === confirmNewPassword
      ? ""
      : m.errorPasswordConfirmation(),
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !!currentPassword || !!newPassword || !!confirmNewPassword,
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
        ? m.currentPasswordError()
        : m.errorOnDataSave(),
  );

  const onCancel = () => {
    currentPassword = "";
    newPassword = "";
    confirmNewPassword = "";
  };

  const onSave = async () => {
    result = await changePassword(currentPassword, newPassword);
    onCancel();
  };
</script>

<h3>{m.changePassword()}</h3>
<Content>
  <div>
    {m.passwordRequirements()}
  </div>
  <Wrap>
    <Fields>
      <PasswordFieldOutlined
        id="currentPassword"
        label={m.currentPassword()}
        bind:value={currentPassword}
        error={validateCurrentPassword}
      />
      <PasswordFieldOutlined
        id="newPassword"
        label={m.newPassword()}
        bind:value={newPassword}
        error={validateNewPassword}
      />
      <PasswordFieldOutlined
        id="confirmNewPassword"
        label={m.confirmNewPassword()}
        bind:value={confirmNewPassword}
        error={validateConfirmNewPassword}
      />
    </Fields>
    <Fields>
      <ActionSave
        id="changePassword"
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
