<script>
  import { pop } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/Content.svelte";
  import Wrap from "../../lib/Wrap.svelte";
  import Fields from "../../lib/Fields.svelte";
  import TextFieldOutlined from "../../lib/components/TextFieldOutlined.svelte";
  import GroupedCheckBox from "../../lib/components/GroupedCheckBox.svelte";
  import Switch from "../../lib/components/Switch.svelte";
  import ActionSave from "../../lib/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import { updateDocument } from "../../lib/firebase.js";
  import { formatISO } from "../../lib/i18n";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let post = store.posts.find((post) => post.id === item);
  let active = $state(false);

  // Fields
  let text = $state(post.text);
  let errorText = $derived(active ? "" : !text ? t().required() : "");
  let targetItems = (store.conf.postTargets ?? []).map((target) => ({
    value: target,
    label: target,
  }));
  let targets = $state(post.targets ?? []);
  let errorTargets = $derived(
    active ? "" : !targets.length ? t().required() : "",
  );
  let schedule = $state(formatISO(post.scheduledFor?.toDate()));
  let errorSchedule = $derived(active ? "" : !schedule ? t().required() : "");
  let deleted = $state(!!post.deletedAt);

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (text !== post.text ||
        targets.length !== post.targets?.length ||
        !targets.every((target) => post.targets?.includes(target)) ||
        new Date(schedule).getTime() !==
          post.scheduledFor?.toDate().getTime() ||
        deleted !== !!post.deletedAt),
  );
  let valid = $derived(!errorText && !errorTargets && !errorSchedule);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    text = post.text;
    targets = post.targets ?? [];
    schedule = formatISO(post.scheduledFor?.toDate());
    pop();
  };

  const onSave = async () => {
    active = true;
    text = text.trim();

    result = await updateDocument("posts", post.id, {
      text,
      scheduledFor: new Date(schedule),
      deletedAt: deleted ? new Date() : null,
    });

    active = false;
    if (!result.err) {
      await onCancel();
    }
  };
</script>

<h3>
  <span class="size-6"><SvgEdit /></span>
  {t().edit()}
</h3>
{#if store.manager || store.operator}
  <Content>
    <Wrap>
      <div class="flex flex-col gap-4">
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
        <GroupedCheckBox
          id="targets"
          items={targetItems}
          bind:value={targets}
        />
      </div>
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
  </Content>
  <Content>
    <Wrap>
      <Fields>
        <div class="flex grow gap-4 items-center">
          <Switch id="deleted" bind:checked={deleted} />
          {t().deleted()}
        </div>
      </Fields>
      <Fields>
        <ActionSave id="save" {changed} {valid} {onCancel} {onSave} {error} />
      </Fields>
    </Wrap>
  </Content>
{/if}
