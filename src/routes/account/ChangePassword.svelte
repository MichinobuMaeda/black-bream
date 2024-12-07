<script>
  import Content from "../../lib/Content.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import IconButton from "../../lib/components/IconButton.svelte";
  import SvgVisibilityOff from "../../lib/icons/SvgVisibilityOff.svelte";
  import SvgVisibilityOn from "../../lib/icons/SvgVisibilityOn.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import SvgCheck from "../../lib/icons/SvgCheck.svelte";
  import ButtonOutlined from "../../lib/components/ButtonOutlined.svelte";
  import SvgClose from "../../lib/icons/SvgClose.svelte";

  import { m } from "../../lib/i18n.svelte";
  import { changePassword } from "../../lib/store.svelte";
  import { validatePassword } from "../../lib/validator";

  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmNewPassword = $state("");
  let currentPasswordVisible = $state(false);
  let newPasswordVisible = $state(false);
  let confirmNewPasswordVisible = $state(false);

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
    currentPasswordVisible = false;
    newPasswordVisible = false;
    confirmNewPasswordVisible = false;
  };
</script>

<h3>{m().changePassword()}</h3>
<Content>
  <div>{m().passwordRequirements()}</div>
  <div class="flex flex-row max-w-96">
    <TextFieldOutlined
      id="currentPassword"
      label={m().currentPassword()}
      type={currentPasswordVisible ? "text" : "password"}
      bind:value={currentPassword}
      error={newPassword && !currentPassword ? m().errorRequired() : ""}
    />
    <div class="flex py-4 px-2">
      <IconButton
        id="currentPasswordVisible"
        icon={currentPasswordVisible ? SvgVisibilityOn : SvgVisibilityOff}
        onClick={() => (currentPasswordVisible = !currentPasswordVisible)}
      />
    </div>
  </div>
  <div class="flex flex-row max-w-96">
    <TextFieldOutlined
      id="newPassword"
      label={m().newPassword()}
      type={newPasswordVisible ? "text" : "password"}
      bind:value={newPassword}
      error={!passwordStrength ? m().errorPasswordStrength() : ""}
    />
    <div class="flex py-4 px-2">
      <IconButton
        id="newPasswordVisible"
        icon={newPasswordVisible ? SvgVisibilityOn : SvgVisibilityOff}
        onClick={() => (newPasswordVisible = !newPasswordVisible)}
      />
    </div>
  </div>
  <div class="flex flex-row max-w-96">
    <TextFieldOutlined
      id="confirmNewPassword"
      label={m().confirmNewPassword()}
      type={confirmNewPasswordVisible ? "text" : "password"}
      bind:value={confirmNewPassword}
      error={!passwordConfirmation ? m().errorPasswordConfirmation() : ""}
    />
    <div class="flex py-4 px-2">
      <IconButton
        id="confirmNewPasswordVisible"
        icon={confirmNewPasswordVisible ? SvgVisibilityOn : SvgVisibilityOff}
        onClick={() => (confirmNewPasswordVisible = !confirmNewPasswordVisible)}
      />
    </div>
  </div>
  <div class="flex flex-row gap-4 lg:gap-6 max-w-96 justify-end">
    <ButtonOutlined
      id="cancelCangePassword"
      icon={SvgClose}
      label={m().cancel()}
      onClick={resetPasswordChange}
      disabled={!currentPassword && !newPassword && !confirmNewPassword}
    />
    <ButtonFilled
      id="changePassword"
      icon={SvgCheck}
      label={m().save()}
      onClick={async () => {
        await changePassword(currentPassword, newPassword);
        resetPasswordChange();
      }}
      disabled={!currentPassword ||
        !newPassword ||
        newPassword !== confirmNewPassword ||
        !validatePassword(newPassword)}
    />
  </div>
</Content>
