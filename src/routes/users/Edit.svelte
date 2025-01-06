<script>
  import { pop } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/components/GroupedCheckBox.svelte";
  import ErrorMessage from "../../lib/ErrorMessage.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import {
    isUniqueUserName,
    updateDocument,
    callFunction,
    groupsOfUser,
  } from "../../lib/firebase.js";
  import { validateEmail } from "../../lib/validator";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  const uid = item;
  let user = store.users.find((user) => user.id === uid);

  // Fields
  let name = $state(user.name);
  let deleted = $state(!!user.deletedAt);
  let restricted = $state(!!user.restrictedAt);
  let email = $state(undefined);
  let authUser = $state(undefined);
  let authUserError = $state("waiting");

  let validateDisplayName = $derived(
    !name
      ? t().required()
      : !isUniqueUserName(store, name, user.id)
        ? t().nameInUse()
        : "",
  );
  let validateAuthEmail = $derived(
    !email || validateEmail(email) ? "" : t().validEmailAddress(),
  );

  (async () => {
    const { err, data } = await callFunction("getAuthUser", { uid });
    authUserError = err;
    authUser = data;
    if (!authUserError) {
      email = authUser?.email || "";
    }
  })();

  let groupItems = store.groups.map((group) => ({
    value: group.id,
    label: group.name,
  }));
  let currentGroups = $derived(
    groupsOfUser(store, user.id).map((group) => group.id),
  );
  let groups = $state(groupsOfUser(store, user.id).map((group) => group.id));
  let isSelectedGroupsChanged = $derived(
    groups.length !== currentGroups.length ||
      !groups.every((id) => currentGroups.includes(id)),
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    name !== user.name ||
      email !== (authUser?.email || "") ||
      deleted !== !!user.deletedAt ||
      restricted !== !!user.restrictedAt ||
      isSelectedGroupsChanged,
  );
  let valid = $derived(!validateDisplayName && !validateAuthEmail);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    name = user.name;
    await pop();
  };

  const onSave = async () => {
    name = name.trim();
    let actions = [];

    if (
      name !== user.name ||
      deleted !== !!user.deletedAt ||
      restricted !== !!user.restrictedAt
    ) {
      result = await updateDocument("users", uid, {
        name,
        deletedAt: deleted ? new Date() : null,
        restrictedAt: restricted ? new Date() : null,
        updatedAt: new Date(),
      });
    }
    if (!result.err && email !== (authUser?.email || "")) {
      if (!authUser) {
        result = await callFunction("addAuthUser", { uid, email });
      } else if (email) {
        result = await callFunction("updateAuthEmail", { uid, email });
      } else {
        result = await callFunction("deleteAuthUser", { uid });
      }
    }
    if (!result.err) {
      actions.concat(
        store.groups
          .filter((group) =>
            groups
              .filter((id) => !currentGroups.includes(id))
              .includes(group.id),
          )
          .map((group) =>
            updateDocument("groups", group.id, {
              users: [...group.users.filter((id) => id !== uid), uid],
              updatedAt: new Date(),
            }),
          ),
      );
      actions.concat(
        store.groups
          .filter((group) =>
            currentGroups
              .filter((id) => !groups.includes(id))
              .includes(group.id),
          )
          .map((group) =>
            updateDocument("groups", group.id, {
              users: group.users.filter((id) => id !== uid),
              updatedAt: new Date(),
            }),
          ),
      );
    }
    result.err = (await Promise.all(actions)).reduce(
      (acc, cur) => (cur?.err ? cur?.err : acc),
      undefined,
    );
    if (!result.err) {
      await onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgEdit /></span>
  {t().edit()}
</h3>
{#if store.manager}
  <Content>
    <Fields>
      <TextFieldOutlined
        id="displayName"
        label={t().displayName()}
        type="text"
        bind:value={name}
        message={t().current(user.name)}
        error={validateDisplayName}
      />
      {#if store.user.id !== user.id}
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-row gap-2 items-center">
            <Switch id="restricted" bind:checked={restricted} />
            {t().restricted()}
          </div>
          <div class="flex flex-row gap-2 items-center">
            <Switch id="deleted" bind:checked={deleted} />
            {t().deleted()}
          </div>
        </div>
      {/if}
    </Fields>
  </Content>
  <h4>{t().authentication()}</h4>
  <Content>
    {#if authUserError === "waiting"}
      Loading...
    {:else if authUserError}
      <ErrorMessage>Error: {authUserError}</ErrorMessage>
    {:else}
      <Wrap>
        <Fields>
          <TextFieldOutlined
            id="authEmail"
            label={t().email()}
            type="email"
            bind:value={email}
            message={t().current(authUser?.email ?? "--")}
            error={validateAuthEmail}
          />
        </Fields>
      </Wrap>
    {/if}
  </Content>
  <h4>{t().memberOf()}</h4>
  <Content>
    <GroupedCheckBox id="groups" items={groupItems} bind:value={groups} />
  </Content>
  <Content>
    <ActionSave
      id="saveUser"
      {changed}
      {valid}
      {onCancel}
      {onSave}
      {error}
      wide
    />
  </Content>
{/if}
