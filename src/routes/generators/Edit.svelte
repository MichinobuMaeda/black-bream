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
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument, postTargets } from "../../lib/firebase.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let generator = store.generators.find((o) => o.id === item);
  let active = $state(false);

  // Fields
  let name = $state(generator.name);
  let source = $state(generator.source);
  let prompt = $state(generator.prompt);
  let targets = $state(generator.targets || []);
  let deleted = $state(!!generator.deletedAt);

  let targetItems = postTargets
    .filter((target) => (store.conf.postTargets ?? []).includes(target))
    .map((target) => ({
      value: target,
      label: target,
    }));

  let errorName = $derived(
    !name
      ? t().required()
      : store.generators
            .filter((o) => o.id !== item)
            .map((o) => o.name)
            .includes(name)
        ? t().nameInUse()
        : "",
  );
  let errorSource = $derived(source ? "" : t().required());
  let errorPrompt = $derived(prompt ? "" : t().required());

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (name !== generator.name ||
        source !== generator.source ||
        prompt !== generator.prompt ||
        targets.length !== generator.targets.length ||
        targets.some((item) => !(generator.targets || []).includes(item)) ||
        deleted !== !!generator.deletedAt),
  );
  let valid = $derived(!errorName && !errorSource && !errorPrompt);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    name = generator.name;
    source = generator.source;
    prompt = generator.prompt;
    targets = generator.targets || [];
    deleted = !!generator.deletedAt;
    push("/generators");
  };

  const onSave = async () => {
    name = name.trim();
    source = source?.trim() ?? "";
    prompt = prompt?.trim() ?? "";

    const data = {
      name,
      source,
      prompt,
      targets,
      deletedAt: deleted ? serverTimestamp() : null,
    };

    active = true;
    result = await updateDocument("generators", item, data);
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
            id="name-new"
            label={t().displayName()}
            type="text"
            bind:value={name}
            message={t().required()}
            error={errorName}
          />
        </Fields>
        <Fields>
          <GroupedCheckBox
            id="targets"
            items={targetItems}
            bind:value={targets}
          />
        </Fields>
      </Wrap>
      <TextFieldOutlined
        id="source-new"
        label={t().dataSource()}
        type="text"
        bind:value={source}
        lines={16}
        monospace
        message={t().required()}
        error={errorSource}
      />
      <TextFieldOutlined
        id="prompt-new"
        label={t().prompt()}
        type="text"
        bind:value={prompt}
        lines={16}
        monospace
        message={t().required()}
        error={errorPrompt}
      />
      <div class="flex grow gap-4 items-center">
        <Switch id="deleted" bind:checked={deleted} />
        {t().deleted()}
      </div>
      <ActionSave
        id="save-new"
        {changed}
        {valid}
        {onCancel}
        {onSave}
        {error}
        wide
      />
    </Content>
  </Content>
{/if}
