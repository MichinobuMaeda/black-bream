<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import PasswordFieldOutlined from "../../lib/coarse-paper/PasswordFieldOutlined.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { changeEmail } from "../../lib/firebase.js";
  import { validateEmail } from "../../lib/validator";

  let active = $state(false);

  // Fields
  let password = $state("");
  let email = $state("");
  let current = $state(store.authUser.email || "--");

  let validatePassword = $derived(!email || password ? "" : t().required());
  let validateNewEmail = $derived(
    !email || validateEmail(email) ? "" : t().validEmailAddress(),
  );

  // Actions
  let result = $state(null);
  let changed = $derived(!active && !!email);
  let valid = $derived(!validatePassword && !validateNewEmail);
  let error = $derived(
    !result?.err
      ? ""
      : result.err?.includes("auth/wrong-password")
        ? t().currentPasswordError()
        : t().errorOnDataSave(),
  );

  const onCancel = () => {
    password = "";
    email = "";
  };

  const onSave = async () => {
    active = true;
    result = await changeEmail(store, password, email);
    onCancel();
    setTimeout(() => {
      store.authUser.reload();
      current = store.authUser.email || "--";
    }, 3000);
    active = false;
  };
</script>

<h3>{t().changeEmail()}</h3>
<Content>
  <div>
    {t().guideChangingEmail()}
  </div>
  <Wrap>
    <Fields>
      <PasswordFieldOutlined
        id="passwordForEmailChange"
        label={t().password()}
        bind:value={password}
        error={validatePassword}
      />
      <TextFieldOutlined
        id="newEmail"
        type="email"
        label={t().email()}
        bind:value={email}
        message={t().current(current)}
        error={validateNewEmail}
      />
    </Fields>
    <ActionFields>
      <ActionSave
        id="changeEmail"
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
