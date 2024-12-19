<script>
  import Content from "../../lib/Content.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
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
  <div>{m().passwordRequirements()}</div>
  <div class="flex flex-row max-w-96">
    <PasswordFieldOutlined
      id="currentPassword"
      label={m().currentPassword()}
      bind:value={currentPassword}
      error={newPassword && !currentPassword ? m().errorRequired() : ""}
    />
  </div>
  <div class="flex flex-row max-w-96">
    <PasswordFieldOutlined
      id="newPassword"
      label={m().newPassword()}
      bind:value={newPassword}
      error={!passwordStrength ? m().errorPasswordStrength() : ""}
    />
  </div>
  <div class="flex flex-col">
    <div class="flex flex-row max-w-96">
      <PasswordFieldOutlined
        id="confirmNewPassword"
        label={m().confirmNewPassword()}
        bind:value={confirmNewPassword}
        error={!passwordConfirmation ? m().errorPasswordConfirmation() : ""}
      />
    </div>
    {#if result}
      <div class="flex mt-2 text-lightError dark:text-darkError">
        {m().errorOnDataSave()}
      </div>
    {/if}
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
        result = await changePassword(currentPassword, newPassword);
        resetPasswordChange();
      }}
      disabled={!currentPassword ||
        !newPassword ||
        newPassword !== confirmNewPassword ||
        !validatePassword(newPassword)}
    />
  </div>
</Content>
