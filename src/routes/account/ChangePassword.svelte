<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { m } from "../../lib/i18n.svelte";
  import { changePassword } from "../../lib/store.svelte";
  import { validatePassword } from "../../lib/validator";

  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmNewPassword = $state("");
  let result = $state(undefined);

  let passwordStrength = $derived(
    !newPassword || validatePassword(newPassword),
  );
  let passwordConfirmation = $derived(
    !newPassword || newPassword === confirmNewPassword,
  );

  const resetPasswordChange = () => {
    currentPassword = "";
    newPassword = "";
    confirmNewPassword = "";
  };
</script>

<h3>{m().changePassword()}</h3>
<Content>
  <div>
    {m().passwordRequirements()}
  </div>
  <Wrap>
    <Fields>
      <PasswordFieldOutlined
        id="currentPassword"
        label={m().currentPassword()}
        bind:value={currentPassword}
        error={newPassword && !currentPassword ? m().required() : ""}
      />
      <PasswordFieldOutlined
        id="newPassword"
        label={m().newPassword()}
        bind:value={newPassword}
        error={!passwordStrength ? m().errorPasswordStrength() : ""}
      />
      <PasswordFieldOutlined
        id="confirmNewPassword"
        label={m().confirmNewPassword()}
        bind:value={confirmNewPassword}
        error={!passwordConfirmation ? m().errorPasswordConfirmation() : ""}
      />
    </Fields>
    <Fields>
      <ActionSave
        id="changePassword"
        changed={!!currentPassword || !!newPassword || !!confirmNewPassword}
        valid={!!currentPassword &&
          newPassword === confirmNewPassword &&
          validatePassword(newPassword)}
        onSave={async () => {
          result = await changePassword(currentPassword, newPassword);
          resetPasswordChange();
        }}
        onCancel={resetPasswordChange}
        error={result ? m().errorOnDataSave() : ""}
        cancelOnlyChanged
      />
    </Fields>
  </Wrap>
</Content>
