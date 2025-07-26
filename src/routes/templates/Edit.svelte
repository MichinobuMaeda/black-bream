<script>
  import { serverTimestamp } from "firebase/firestore";
  import { push } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument, postTargets } from "../../lib/firebase.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let templates = store.templates ?? [];
  let template = templates.find((t) => t.id === item);
  let active = $state(false);

  // Fields
  let name = $state(template.name);
  let title = $state(template.title);
  let message = $state(template.message || template.text);
  let targets = $state(template.targets);
  let link = $state(template.link);
  let deleted = $state(!!template.deletedAt);
  let feed = $state(template.feed);
  let category = $state(template.category);

  let targetItems = postTargets
    .filter((target) => (store.conf.postTargets ?? []).includes(target))
    .map((target) => ({
      value: target,
      label: target,
    }));

  let errorName = $derived(
    !name
      ? t().required()
      : templates
            .filter((o) => o.id !== item)
            .map((o) => o.name)
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
        (targets.length !== template.targets.length &&
          targets.some((item) => !template.targets.includes(item))) ||
        deleted !== !!template.deletedAt),
  );
  let valid = $derived(!errorName && !errorTitleMessage);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    name = template.name;
    title = template.title;
    message = template.message;
    link = template.link;
    feed = template.feed;
    category = template.category;
    targets = [...template.targets];
    deleted = !!template.deletedAt;
    push("/templates");
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
    result = await updateDocument("templates", item, data);
    active = false;
    if (result?.err) {
      console.error(result.err);
      return;
    } else {
      onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgEdit /></span>
  {t().create()}
</h3>
{#if store.operator || store.manager}
  <Content>
    <Content>
      <Wrap>
        <Fields>
          <TextFieldOutlined
            id={`name-${item}`}
            label={t().displayName()}
            type="text"
            bind:value={name}
            message={t().required()}
            error={errorName}
          />
          <GroupedCheckBox
            id={`targets-${item}`}
            items={targetItems}
            bind:value={targets}
          />
          <TextFieldOutlined
            id={`title-${item}`}
            label={t().title()}
            type="text"
            bind:value={title}
            message={t().requiredAorB(t().title(), t().message())}
            error={errorTitleMessage}
          />
          <TextFieldOutlined
            id={`message-${item}`}
            label={t().message()}
            type="text"
            bind:value={message}
            lines={6}
            message={t().requiredAorB(t().title(), t().message())}
            error={errorTitleMessage}
          />
        </Fields>
        <Fields>
          <TextFieldOutlined
            id={`link-${item}`}
            label={t().link()}
            type="text"
            bind:value={link}
          />
          <TextFieldOutlined
            id={`feed-${item}`}
            label="Feed"
            type="text"
            bind:value={feed}
          />
          <TextFieldOutlined
            id={`category-${item}`}
            label="Category"
            type="text"
            bind:value={category}
          />
        </Fields>
        <div class="flex grow gap-4 items-center">
          <Switch id="deleted" bind:checked={deleted} />
          {t().deleted()}
        </div>
        <ActionFields>
          <ActionSave
            id={`save-${item}`}
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
  </Content>
{/if}
