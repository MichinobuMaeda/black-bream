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

  const getTemplateSummary = (item) =>
    (item.title || item.message ? `${item.title}\n${item.message}` : item.text)
      .split("\n")
      .join(" / ");

  let templates = $derived(store.templates ?? []);
  let template = $state(null);
  let active = $state(false);

  // Fields
  let id = $state("");
  let name = $state("");
  let title = $state("");
  let message = $state("");
  let link = $state("");
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
  let errorTitleMessage = $derived(
    title || message ? "" : t().requiredAorB(t().title(), t().message()),
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (name !== template.name ||
        title !== template.title ||
        message !== template.message ||
        link !== template.link ||
        feed !== template.feed ||
        category !== template.category ||
        targets.length !== template.targets?.length ||
        targets.some((target) => !template.targets?.includes(target)) ||
        deleted !== !!template.deletedAt),
  );
  let valid = $derived(!errorName || !errorTitleMessage);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    id = "";
    name = "";
    title = "";
    message = "";
    link = "";
    feed = "";
    category = "";
    targets = [];
    deleted = false;
    template = null;
  };

  const onSave = async () => {
    name = name.trim();
    title = title?.trim() ?? "";
    message = message?.trim() ?? "";
    link = link?.trim() ?? "";
    feed = feed?.trim() ?? "";
    category = category?.trim() ?? "";

    const data = {
      name,
      text: null,
      title,
      message,
      link,
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
        <GroupedCheckBox
          id="targets"
          items={targetItems}
          bind:value={targets}
        />
        <TextFieldOutlined
          id={`title-${id}`}
          label={t().title()}
          type="text"
          bind:value={title}
          message={t().requiredAorB(t().title(), t().message())}
          error={errorTitleMessage}
        />
        <TextFieldOutlined
          id={`message-${id}`}
          label={t().message()}
          type="text"
          bind:value={message}
          lines={6}
          message={t().requiredAorB(t().title(), t().message())}
          error={errorTitleMessage}
        />
        <TextFieldOutlined
          id={`link-${id}`}
          label={t().link()}
          type="text"
          bind:value={link}
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
        title = "";
        message = "";
        link = "";
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
                title = item.title;
                message = item.message || item.text;
                link = item.link;
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
              {getTemplateSummary(item)}
            </span>
          {:else}
            {getTemplateSummary(item)}
          {/if}
        </Fields>
      </Wrap>
    {/each}
  </Content>
{/if}
