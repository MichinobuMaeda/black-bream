<script>
  import { pop } from "svelte-spa-router";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { createDocument } from "../../lib/firebase.js";
  import { formatISO } from "../../lib/i18n";

  let active = $state(false);

  // Fields
  let text = $state("");
  let services = $state([]);
  let errorText = $derived(active ? "" : !text ? t().required() : "");
  let schedule = $state(formatISO(new Date()));
  let errorSchedule = $derived(active ? "" : !schedule ? t().required() : "");

  // Actions
  let result = $state(null);
  let changed = $derived(!active);
  let valid = $derived(!errorText);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    text = "";
    pop();
  };

  const onSave = async () => {
    active = true;
    text = text.trim();

    result = await createDocument("posts", {
      text,
      services,
      scheduledFor: new Date(schedule),
    });

    active = false;
    if (!result.err) {
      await onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgNoteAdd /></span>
  {t().create()}
</h3>
{#if store.manager}
  <Content>
    <Wrap>
      <Fields>
        <TextFieldOutlined
          id="scheduledFor"
          label={t().schedule()}
          type="datetime-local"
          bind:value={schedule}
          message={t().required()}
          error={errorSchedule}
        />
      </Fields>
      <Fields>
        <TextFieldOutlined
          id="text"
          label={t().text()}
          type="text"
          lines={4}
          bind:value={text}
          message={t().required()}
          error={errorText}
        />
      </Fields>
    </Wrap>
    <Fields>
      <ActionSave id="save" {changed} {valid} {onCancel} {onSave} {error} />
    </Fields>
  </Content>
{/if}
