<script>
  import { pop } from "svelte-spa-router";
  import SvgEdit from "../../lib/icons/SvgEdit.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import ButtonText from "../../lib/coarse-paper/ButtonText.svelte";
  import IconButton from "../../lib/coarse-paper/IconButton.svelte";
  import SvgArrowBack from "../../lib/icons/SvgArrowBack.svelte";
  import SvgArrowForward from "../../lib/icons/SvgArrowForward.svelte";
  import SvgAddPhotoAlternate from "../../lib/icons/SvgAddPhotoAlternate.svelte";
  import SvgRemoveSelection from "../../lib/icons/SvgRemoveSelection.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import Switch from "../../lib/coarse-paper/Switch.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import {
    updateDocument,
    savePostImage,
    getSavedImageUrl,
    postTargets,
  } from "../../lib/firebase.js";
  import { formatISO, getNextPreDefinedSchedule } from "../../lib/datetime.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  let post = $derived(store.posts.find((post) => post?.id === item));
  let active = $state(false);

  // Fields
  let text = $state("");
  let errorText = $derived(active ? "" : !text ? t().required() : "");
  let targetItems = postTargets
    .filter((target) => (store.conf.postTargets ?? []).includes(target))
    .map((target) => ({
      value: target,
      label: target,
    }));
  let orgTargets = $derived(Object.keys(post?.targets ?? {}));
  let targets = $state([]);
  let errorTargets = $derived(
    active ? "" : !targets.length ? t().required() : "",
  );
  let schedule = $state(null);
  let savedImages = $state([]);
  let savedImageUrl = $state(null);
  let deletedSavedImages = $state(false);
  let selectedImages = $state(null);
  let errorSchedule = $derived(active ? "" : !schedule ? t().required() : "");
  let deleted = $state(false);
  let showPreDefinedSchedule = $derived(
    store.conf.preDefinedSchedules?.wd.length > 0 &&
      store.conf.preDefinedSchedules?.h.length > 0 &&
      store.conf.preDefinedSchedules?.m.length > 0,
  );

  $effect(() => {
    if (post) {
      text = post.text;
      targets = Object.keys(post.targets ?? {});
      savedImages = post.files ?? [];
      schedule = formatISO(post.scheduledFor?.toDate());
      deleted = !!post.deletedAt;
    }

    savedImageUrl = savedImages?.length
      ? getSavedImageUrl(post.id, savedImages[0])
      : null;
  });

  $effect(() => {
    if (selectedImages?.length) {
      deletedSavedImages = true;
    }
  });

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      (text !== post?.text ||
        targets.length !== orgTargets.length ||
        !targets.every((target) => orgTargets.includes(target)) ||
        new Date(schedule).getTime() !==
          post?.scheduledFor?.toDate().getTime() ||
        deletedSavedImages ||
        deleted !== !!post?.deletedAt),
  );
  let valid = $derived(!errorText && !errorTargets && !errorSchedule);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    text = post?.text;
    targets = Object.keys(post?.targets ?? {});
    savedImages = post?.files ?? [];
    schedule = formatISO(post?.scheduledFor?.toDate());
    pop();
  };

  const onSave = async () => {
    active = true;
    text = text.trim();

    if (!deletedSavedImages) {
      result = await updateDocument("posts", post?.id, {
        text,
        scheduledFor: new Date(schedule),
        deletedAt: deleted ? new Date() : null,
      });
    } else {
      result = await updateDocument("posts", post?.id, {
        text,
        files:
          selectedImages && selectedImages[0]
            ? [`1.${selectedImages[0].name.split(".").pop()}`]
            : [],
        scheduledFor: new Date(schedule),
        deletedAt: deleted ? new Date() : null,
      });
    }

    if (!result.err && selectedImages && selectedImages[0]) {
      result = await savePostImage(post.id, selectedImages[0]);
    }

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
          <div class="flex flex-row gap-2">
            <TextFieldOutlined
              id="scheduledFor"
              label={t().schedule()}
              type="datetime-local"
              bind:value={schedule}
              message={t().required()}
              error={errorSchedule}
            />
            {#if showPreDefinedSchedule}
              <IconButton
                id="prevSchedule"
                icon={SvgArrowBack}
                onClick={() => {
                  schedule = formatISO(
                    getNextPreDefinedSchedule(
                      store.conf.preDefinedSchedules,
                      schedule,
                      -1,
                    ),
                  );
                }}
              />
              <IconButton
                id="prevSchedule"
                icon={SvgArrowForward}
                onClick={() => {
                  schedule = formatISO(
                    getNextPreDefinedSchedule(
                      store.conf.preDefinedSchedules,
                      schedule,
                      1,
                    ),
                  );
                }}
              />
            {/if}
          </div>
        </Fields>
        <Fields>
          <Wrap>
            <GroupedCheckBox
              id="targets"
              items={targetItems}
              bind:value={targets}
            />
          </Wrap>
        </Fields>
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
        <div class="flex flex-row gap-4">
          <ButtonText
            id="add-image"
            icon={SvgAddPhotoAlternate}
            label={t().image()}
            onClick={() => document.getElementById("add-image-field").click()}
          />
          {#if savedImages?.length}
            <ButtonText
              id="remove-image"
              icon={SvgRemoveSelection}
              label={t().delete()}
              danger
              onClick={() => {
                deletedSavedImages = true;
              }}
            />
          {:else if selectedImages}
            <ButtonText
              id="remove-image"
              icon={SvgRemoveSelection}
              label={t().delete()}
              danger
              onClick={() => {
                selectedImages = null;
              }}
            />
          {/if}
        </div>
        <input
          id="add-image-field"
          type="file"
          accept="image/*"
          class="hidden"
          bind:files={selectedImages}
        />
        {#if selectedImages?.length}
          <img
            id="image-selected"
            class="w-96"
            alt="selected"
            src={URL.createObjectURL(selectedImages[0])}
          />
        {:else if !deletedSavedImages && savedImages}
          {#await savedImageUrl}
            <div>Loading...</div>
          {:then url}
            {#if url}
              <img id="image-saved" class="w-96" alt="selected" src={url} />
            {/if}
          {/await}
        {/if}
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
