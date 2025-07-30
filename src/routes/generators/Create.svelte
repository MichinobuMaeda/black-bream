<script>
  import { serverTimestamp } from "firebase/firestore";
  import { push } from "svelte-spa-router";
  import SvgAdd from "../../lib/icons/SvgAdd.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import Targets from "../../lib/components/Targets.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import {
    createDocument,
    postTargets,
    generatorSourceTemplates,
    generatorPromptTemplates,
  } from "../../lib/firebase.js";

  let generators = $derived(store.generators ?? []);
  let active = $state(false);

  // Fields
  let name = $state("");
  let source = $state(generatorSourceTemplates[0].value);
  let prompt = $state(generatorPromptTemplates[0].value);
  let deleted = $state(false);

  let targets = $state(
    postTargets.filter((target) =>
      (store.conf.postTargets ?? []).includes(target),
    ),
  );

  let errorName = $derived(
    !name
      ? t().required()
      : generators.map((t) => t.name).includes(name)
        ? t().nameInUse()
        : "",
  );
  let errorSource = $derived(source ? "" : t().required());
  let errorPrompt = $derived(prompt ? "" : t().required());

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (name !== "" ||
        source !== "" ||
        prompt !== "" ||
        targets.length !== 0 ||
        deleted !== false),
  );
  let valid = $derived(!errorName && !errorSource && !errorPrompt);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    name = "";
    source = "";
    prompt = "";
    targets = [];
    deleted = false;
    push("/generators");
  };

  const onSave = async () => {
    name = name.trim();
    source = source?.trim() ?? "";
    prompt = prompt?.trim() ?? "";

    const data = {
      name,
      source,
      prompt: prompt,
      targets,
      deletedAt: deleted ? serverTimestamp() : null,
    };

    active = true;
    result = await createDocument("generators", data);
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
        </Fields>
        <Fields>
          <Targets id="targets" bind:value={targets} />
        </Fields>
      </Wrap>
      <TextFieldOutlined
        id="source-new"
        label={t().dataSource()}
        type="text"
        bind:value={source}
        lines={16}
        message={t().requiredAorB(t().dataSource(), t().prompt())}
        error={errorSource}
      />
      <TextFieldOutlined
        id="prompt-new"
        label={t().prompt()}
        type="text"
        bind:value={prompt}
        lines={16}
        message={t().requiredAorB(t().dataSource(), t().prompt())}
        error={errorPrompt}
      />
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
