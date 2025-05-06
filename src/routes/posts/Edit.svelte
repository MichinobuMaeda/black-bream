<script>
  import { pop } from "svelte-spa-router";
  import { serverTimestamp, Timestamp } from "firebase/firestore";
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
  import { t, store, dt } from "../../lib/store.svelte.js";
  import {
    updateDocument,
    savePostedImage,
    getSavedImageUrl,
    postTargets,
    imageRequiredTargets,
  } from "../../lib/firebase.js";

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
  let checkedTargets = $state([]);
  let errorTargets = $derived(
    active ? "" : !checkedTargets.length ? t().required() : "",
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
      checkedTargets = Object.keys(post.targets ?? {});
      savedImages = post.files ?? [];
      schedule = dt(post.scheduledFor).formatDateTime();
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
        checkedTargets.length !== orgTargets.length ||
        !checkedTargets.every((target) => orgTargets.includes(target)) ||
        new Date(schedule).getTime() !==
          post?.scheduledFor?.toDate().getTime() ||
        deletedSavedImages ||
        deleted !== !!post?.deletedAt),
  );
  let valid = $derived(!errorText && !errorTargets && !errorSchedule);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    text = post?.text;
    checkedTargets = Object.keys(post?.targets ?? {});
    savedImages = post?.files ?? [];
    schedule = dt(post?.scheduledFor).formatDateTime();
    await pop();
  };

  const onSave = async () => {
    const status = post.status;
    active = true;
    text = text.trim();
    const files = deletedSavedImages
      ? selectedImages && selectedImages[0]
        ? [`1.${selectedImages[0].name.split(".").pop()}`]
        : []
      : savedImages;
    const targets = checkedTargets
      .filter(
        (target) => files.length || !imageRequiredTargets.includes(target),
      )
      .reduce(
        (acc, cur) => ({
          ...acc,
          [cur]: { status, createdAt: serverTimestamp() },
        }),
        {},
      );
    const scheduledFor = Timestamp.fromDate(dt(schedule).dt);

    const data = { text, files, targets, scheduledFor };

    if (!deleted && !!post?.deletedAt) {
      data.deletedAt = null;
    } else if (deleted && !post?.deletedAt) {
      data.deletedAt = serverTimestamp();
    }

    result = await updateDocument("posts", post?.id, data);

    if (!result.err && selectedImages && selectedImages[0]) {
      result = await savePostedImage(post.id, selectedImages[0], document);
    }

    active = false;
    if (!result.err) {
      await onCancel();
    } else {
      await pop();
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
                  schedule = dt(schedule).getPrevSchedule().formatDateTime();
                }}
              />
              <IconButton
                id="prevSchedule"
                icon={SvgArrowForward}
                onClick={() => {
                  schedule = dt(schedule).getNextSchedule().formatDateTime();
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
              bind:value={checkedTargets}
            />
          </Wrap>
        </Fields>
        <Fields>
          {#if !selectedImages?.length && imageRequiredTargets.some( (target) => checkedTargets.includes(target), )}
            <p class="text-light-primary dark:text-dark-primary">
              {t().skipPostingWithoutImage(imageRequiredTargets)}
            </p>
          {/if}
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
