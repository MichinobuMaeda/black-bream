<script>
  import { pop } from "svelte-spa-router";
  import SvgGroupAdd from "../../lib/icons/SvgGroupAdd.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { createDocument, isUniqueGroupName } from "../../lib/firebase.js";

  let active = $state(false);

  // Fields
  let name = $state("");
  let errorDisplayName = $derived(
    active
      ? ""
      : !name
        ? t().required()
        : !isUniqueGroupName(store, name)
          ? t().nameInUse()
          : "",
  );

  let userItems = store.users.map((user) => ({
    value: user.id,
    label: user.name,
  }));
  let users = $state([]);

  // Actions
  let result = $state(null);
  let changed = $derived(!active);
  let valid = $derived(!errorDisplayName);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    name = "";
    pop();
  };

  const onSave = async () => {
    active = true;
    name = name.trim();

    result = await createDocument("groups", { name, users });

    active = false;
    if (!result.err) {
      await onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgGroupAdd /></span>
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
  <h4>{t().members()}</h4>
  <Content>
    <GroupedCheckBox id="groups" items={userItems} bind:value={users} />
    <Fields>
      <ActionSave id="save" {changed} {valid} {onCancel} {onSave} {error} />
    </Fields>
  </Content>
{/if}
