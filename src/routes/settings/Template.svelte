<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import { t } from "../../lib/store.svelte.js";
  import { createDocument, updateDocument } from "../../lib/firebase.js";

  /**
   * @typedef {Object} Props
   * @property {object} [template]
   */

  /** @type {Props} */
  let { template = { id: null, name: "", text: "", deletedAt: null } } =
    $props();
  let active = $state(false);

  // Fields
  let id = $state(template.id);
  let name = $state(template.name);
  let text = $state(template.text);
  let deleted = $state(!!template.deletedAt);

  let errorName = $derived(name ? "" : t().required());
  let errorText = $derived(text ? "" : t().required());

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (name !== template.name ||
        text !== template.text ||
        deleted !== !!template.deletedAt),
  );
  let valid = $derived(!errorName || !errorText);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    name = template.name;
    text = template.text;
    deleted = !!template.deletedAt;
  };

  const onSave = async () => {
    name = name.trim();
    text = text.trim();
    const deletedAt = deleted ? new Date() : null;
    active = true;
    result = await (id
      ? updateDocument("templates", id, { name, text, deletedAt })
      : createDocument("templates", { name, text, deletedAt }));
    onCancel();
    active = false;
  };
</script>

<Content>
  <Wrap>
    <Fields>
      <TextFieldOutlined
        id={`name-${id}`}
        label={t().displayName()}
        type="text"
        bind:value={name}
        message={t().required()}
        error={errorName}
      />
      <TextFieldOutlined
        id={`text-${id}`}
        label={t().text()}
        type="text"
        bind:value={text}
        lines={4}
        message={t().required()}
        error={errorText}
      />
    </Fields>
    <ActionFields>
      {#if id}
        <div class="flex items-end">
          <div class="flex grow gap-4 items-center w-48">
            <Switch id={`deleted-${id}`} bind:checked={deleted} />
            {t().deleted()}
          </div>
        </div>
      {/if}
      <ActionSave
        id={`save-${id}`}
        {changed}
        {valid}
        {onCancel}
        {onSave}
        {error}
        cancelOnlyChanged
        wide
      />
    </ActionFields>
  </Wrap>
</Content>
