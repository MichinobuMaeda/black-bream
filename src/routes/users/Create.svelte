<script>
  import { pop } from "svelte-spa-router";
  import SvgPersonAdd from "../../lib/icons/SvgPersonAdd.svelte";
  import Content from "../../lib/Content.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/components/GroupedCheckBox.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import {
    createDocument,
    updateDocument,
    isUniqueUserName,
  } from "../../lib/firebase.js";

  // Fields
  let name = $state("");
  let groupItems = store.groups.map((group) => ({
    value: group.id,
    label: group.name,
  }));
  let groups = $state([]);

  let errorDisplayName = $derived(
    !name
      ? t().required()
      : !isUniqueUserName(store, name)
        ? t().nameInUse()
        : "",
  );

  // Actions
  let result = $state(null);
  const changed = true;
  let valid = $derived(!errorDisplayName);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    name = "";
    pop();
  };

  const onSave = async () => {
    name = name.trim();

    result = await createDocument("users", { name, auth: false });
    const uid = result?.data;

    if (!result.err) {
      await onCancel();
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
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={t().displayName()}
        type="text"
        bind:value={name}
        message={t().required()}
        error={errorDisplayName}
      />
    </Fields>
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
