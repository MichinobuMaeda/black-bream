<script>
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import ButtonText from "../../lib/coarse-paper/ButtonText.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { createDocument, updateDocument } from "../../lib/firebase.js";

  let templates = $derived(store.templates ?? []);
  let template = $state(null);
  let active = $state(false);

  // Fields
  let id = $state("");
  let name = $state("");
  let text = $state("");
  let deleted = $state(false);

  let errorName = $derived(
    !name
      ? t().required()
      : templates
            .filter((t) => t.id !== id)
            .map((t) => t.name)
            .includes(name)
        ? t().nameInUse()
        : "",
  );
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
    id = "";
    name = "";
    text = "";
    deleted = false;
    template = null;
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

<h3>{t().templates()}</h3>
{#if template}
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
          wide
        />
      </ActionFields>
    </Wrap>
  </Content>
{:else}
  <Content>
    <ButtonText
      id="new"
      icon={SvgNoteAdd}
      label={t().create()}
      onClick={() => {
        template = { id: "", name: "", text: "", deletedAt: null };
        id = "";
        name = "";
        text = "";
        deleted = false;
      }}
    />
    {#each templates as item (item.id)}
      <div class="flex flex-row gap-4">
        <ButtonText
          id={item.id}
          icon={SvgEdit}
          label={item.name}
          onClick={() => {
            template = item;
            id = item.id;
            name = item.name;
            text = item.text;
            deleted = !!item.deletedAt;
          }}
        />
        {#if item.deletedAt}
          <span class="line-through text-lightError dark:text-darkError">
            {item.text.split("\n").join(" / ")}
          </span>
        {:else}
          {item.text.split("\n").join(" / ")}
        {/if}
      </div>
    {/each}
  </Content>
{/if}
