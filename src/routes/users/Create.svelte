<script>
  import { pop } from "svelte-spa-router";
  import SvgPersonAdd from "../../lib/icons/SvgPersonAdd.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store, isUniqueUserName } from "../../lib/store.svelte.js";
  import {
    createDocument,
    updateDocument,
    callFunction,
  } from "../../lib/firebase.js";
  import { validateEmail } from "../../lib/validator";
  let active = $state(false);

  // Fields
  let name = $state("");
  let email = $state(undefined);
  let groupItems = store.groups.map((group) => ({
    value: group.id,
    label: group.name,
  }));
  let groups = $state([]);

  let validateDisplayName = $derived(
    active
      ? ""
      : !name
        ? t().required()
        : !isUniqueUserName(name)
          ? t().nameInUse()
          : "",
  );
  let validateAuthEmail = $derived(
    !email || validateEmail(email) ? "" : t().validEmailAddress(),
  );

  // Actions
  let result = $state(null);
  let changed = $derived(!active);
  let valid = $derived(!validateDisplayName && !validateAuthEmail);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    name = "";
    pop();
  };

  const onSave = async () => {
    active = true;
    name = name.trim();

    result = await createDocument("users", { name, auth: false });
    const uid = result.data?.id;

    if (!result.err && email) {
      result = await callFunction("addAuthUser", { uid, email });
    }

    if (!result.err) {
      let actions = [];
      actions.concat(
        store.groups
          .filter((group) => groups.includes(group.id))
          .map((group) =>
            updateDocument("groups", group.id, {
              users: [...group.users.filter((id) => id !== uid), uid],
            }),
          ),
      );
      result.err = (await Promise.all(actions)).reduce(
        (acc, cur) => (cur?.err ? cur?.err : acc),
        undefined,
      );
    }

    active = false;
    if (!result.err) {
      await onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgPersonAdd /></span>
  {t().create()}
</h3>
{#if store.manager}
  <Content>
    <Wrap>
      <Fields>
        <TextFieldOutlined
          id="displayName"
          label={t().displayName()}
          type="text"
          bind:value={name}
          message={t().required()}
          error={validateDisplayName}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="authEmail"
          label={t().email()}
          type="email"
          bind:value={email}
          error={validateAuthEmail}
        />
      </Fields>
    </Wrap>
  </Content>
  <h4>{t().memberOf()}</h4>
  <Content>
    <GroupedCheckBox id="groups" items={groupItems} bind:value={groups} />
  </Content>
  <Content>
    <Fields>
      <ActionSave
        id="updateProfile"
        {changed}
        {valid}
        {onCancel}
        {onSave}
        {error}
      />
    </Fields>
  </Content>
{/if}
