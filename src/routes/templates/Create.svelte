<script>
  import { serverTimestamp } from "firebase/firestore";
  import { push } from "svelte-spa-router";
  import SvgAdd from "../../lib/icons/SvgAdd.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import ActionFields from "../../lib/components/ActionFields.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { createDocument, postTargets } from "../../lib/firebase.js";

  let templates = $derived(store.templates ?? []);
  let active = $state(false);

  // Fields
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
      : templates.map((t) => t.name).includes(name)
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
      (name !== "" ||
        title !== "" ||
        message !== "" ||
        link !== "" ||
        feed !== "" ||
        category !== "" ||
        targets.length !== 0 ||
        deleted !== false),
  );
  let valid = $derived(!errorName && !errorTitleMessage);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    name = "";
    title = "";
    message = "";
    link = "";
    feed = "";
    category = "";
    targets = [];
    deleted = false;
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
    result = await createDocument("templates", data);
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
  <span class="size-6"><SvgAdd /></span>
  {t().create()}
</h3>
{#if store.operator || store.manager}
  <Content>
    <Content>
      <Wrap>
        <Fields>
          <TextFieldOutlined
            id="name-new"
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
            id="title-new"
            label={t().title()}
            type="text"
            bind:value={title}
            message={t().requiredAorB(t().title(), t().message())}
            error={errorTitleMessage}
          />
          <TextFieldOutlined
            id="message-new"
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
            id="link-new"
            label={t().link()}
            type="text"
            bind:value={link}
          />
          <TextFieldOutlined
            id="feed-new"
            label="Feed"
            type="text"
            bind:value={feed}
          />
          <TextFieldOutlined
            id="category-new"
            label="Category"
            type="text"
            bind:value={category}
          />
        </Fields>
        <ActionFields>
          <ActionSave
            id="save-new"
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
