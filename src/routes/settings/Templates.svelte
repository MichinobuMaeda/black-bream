<script>
  import { serverTimestamp } from "firebase/firestore";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import ButtonText from "../../lib/coarse-paper/ButtonText.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import SvgRssFeed from "../../lib/icons/SvgRssFeed.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import {
    createDocument,
    updateDocument,
    postTargets,
  } from "../../lib/firebase.js";

  let templates = $derived(store.templates ?? []);
  let template = $state(null);
  let active = $state(false);

  // Fields
  let id = $state("");
  let name = $state("");
  let text = $state("");
  let deleted = $state(false);
  let feed = $state("");
  let category = $state("");

  let targetItems = postTargets
    .filter((target) => (store.conf.postTargets ?? []).includes(target))
    .map((target) => ({
      value: target,
      label: target,
    }));
  let targets = $state(targetItems.map((item) => item.value));

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
        feed !== template.feed ||
        category !== template.category ||
        targets.length !== template.targets?.length ||
        targets.some((target) => !template.targets?.includes(target)) ||
        deleted !== !!template.deletedAt),
  );
  let valid = $derived(!errorName || !errorText);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    id = "";
    name = "";
    text = "";
    feed = "";
    category = "";
    targets = [];
    deleted = false;
    template = null;
  };

  const onSave = async () => {
    name = name.trim();
    text = text.trim();
    feed = feed.trim();
    category = category.trim();

    const data = {
      name,
      text,
      feed,
      category,
      targets,
      deletedAt: deleted ? serverTimestamp() : null,
    };

    active = true;
    result = await (id
      ? updateDocument("templates", id, data)
      : createDocument("templates", data));
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
          id={`feed-${id}`}
          label="Feed"
          type="text"
          bind:value={feed}
        />
        <TextFieldOutlined
          id={`category-${id}`}
          label="Category"
          type="text"
          bind:value={category}
        />
        <GroupedCheckBox
          id="targets"
          items={targetItems}
          bind:value={targets}
        />
        <TextFieldOutlined
          id={`text-${id}`}
          label={t().text()}
          type="text"
          bind:value={text}
          lines={6}
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
        feed = "";
        category = "";
        targets = [];
        deleted = false;
      }}
    />
    {#each templates as item (item.id)}
      <Wrap>
        <Fields>
          <div class="flex flex-row gap-2">
            <ButtonText
              id={item.id}
              icon={SvgEdit}
              label={item.name}
              onClick={() => {
                template = item;
                id = item.id;
                name = item.name;
                text = item.text;
                feed = item.feed;
                category = item.category;
                targets = item.targets ?? [];
                deleted = !!item.deletedAt;
              }}
            />
            {#if item.feed}
              <span
                class="w-6 h-6 text-light-secondary dark:text-dark-secondary"
              >
                <SvgRssFeed />
              </span>
            {/if}
          </div>
        </Fields>
        <Fields>
          {#if item.deletedAt}
            <span class="line-through text-light-error dark:text-dark-error">
              {item.text.split("\n").join(" / ")}
            </span>
          {:else}
            {item.text.split("\n").join(" / ")}
          {/if}
        </Fields>
      </Wrap>
    {/each}
  </Content>
{/if}
