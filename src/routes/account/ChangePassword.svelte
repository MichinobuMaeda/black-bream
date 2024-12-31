<script>
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import PasswordFieldOutlined from "../../lib/components/PasswordFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import ButtonFilled from "../../lib/components/ButtonFilled.svelte";
  import SuccessMessage from "../../lib/SuccessMessage.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import {
    store,
    m,
    changePassword,
    sendPasswordResetLink,
  } from "../../lib/store.svelte.js";
  import { validatePassword } from "../../lib/validator";

  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmNewPassword = $state("");
  let result = $state(undefined);
  let sent = $state(undefined);
  let timeoutId = undefined;

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
  <div class="flex flex-col md:flex-row gap-4">
    <div>
      {m().descPasswordLink()}{m().allowEmailsFrom({
        email: store.conf.autoSendEmail,
      })}
    </div>
    <div class="flex w-48 md:justify-end md:items-end">
      <ButtonFilled
        id={"sendPasswordResetLink"}
        label={m().send()}
        onClick={async () => {
          if (clearTimeout) {
            clearTimeout(timeoutId);
          }
          sent = await sendPasswordResetLink();
          if (sent === null) {
            timeoutId = setTimeout(
              () => {
                sent = undefined;
              },
              3 * 60 * 1000,
            );
          }
        }}
      />
    </div>
  </div>
  {#if sent === null}
    <SuccessMessage>{m().sentPasswordLink()}</SuccessMessage>
  {:else if !!sent}
    <ErrorMessage>{m().errorOnDataSave()}</ErrorMessage>
  {/if}
</Content>
