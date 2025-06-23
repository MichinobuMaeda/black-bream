<script>
  import { pop } from "svelte-spa-router";
  import { serverTimestamp, Timestamp } from "firebase/firestore";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import Content from "../../lib/components/Content.svelte";
  import Wrap from "../../lib/components/Wrap.svelte";
  import Fields from "../../lib/components/Fields.svelte";
  import ButtonText from "../../lib/coarse-paper/ButtonText.svelte";
  import SvgAddPhotoAlternate from "../../lib/icons/SvgAddPhotoAlternate.svelte";
  import SvgRemoveSelection from "../../lib/icons/SvgRemoveSelection.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import IconButton from "../../lib/coarse-paper/IconButton.svelte";
  import SvgArrowBack from "../../lib/icons/SvgArrowBack.svelte";
  import SvgArrowForward from "../../lib/icons/SvgArrowForward.svelte";
  import GroupedCheckBox from "../../lib/coarse-paper/GroupedCheckBox.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store, dt } from "../../lib/store.svelte.js";
  import {
    createDocument,
    savePostedImage,
    postTargets,
    titleRequiredTargets,
    imageRequiredTargets,
  } from "../../lib/firebase.js";
  let active = $state(false);

  let templates = $state((store.templates ?? []).filter((t) => !t.deletedAt));
  let showTemplates = $state(templates.length > 0);
  const getTemplateSummary = (template) =>
    (template.title || template.message
      ? `${template.title}\n${template.message}`
      : template.text
    )
      .split("\n")
      .join(" / ");

  // Fields
  let title = $state("");
  let message = $state("");
  let link = $state("");
  let errorTitleMessage = $derived(
    title || message ? "" : t().requiredAorB(t().title(), t().message()),
  );
  let targetItems = postTargets
    .filter((target) => (store.conf.postTargets ?? []).includes(target))
    .map((target) => ({
      value: target,
      label: target,
    }));
  let checkedTargets = $state(targetItems.map((item) => item.value));
  let errorTargets = $derived(
    active ? "" : !checkedTargets.length ? t().required() : "",
  );
  let schedule = $state(dt().formatDateTime());
  let errorSchedule = $derived(active ? "" : !schedule ? t().required() : "");
  let showPreDefinedSchedule = $derived(
    store.conf.preDefinedSchedules?.wd.length > 0 &&
      store.conf.preDefinedSchedules?.h.length > 0 &&
      store.conf.preDefinedSchedules?.m.length > 0,
  );

  // Actions
  let result = $state(null);
  let changed = $derived(!active);
  let valid = $derived(!errorTitleMessage && !errorTargets && !errorSchedule);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    title = "";
    message = "";
    link = "";
    checkedTargets = [];
    schedule = dt().formatDateTime();
    pop();
  };

  let selectedImages = $state(null);

  const onSave = async () => {
    active = true;
    const status = "requested";
    title = title?.trim() ?? "";
    message = message?.trim() ?? "";
    link = link?.trim() ?? "";
    const files =
      selectedImages && selectedImages[0]
        ? [`1.${selectedImages[0].name.split(".").pop()}`]
        : [];
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

    const data = { title, message, link, files, targets, scheduledFor, status };
    result = await createDocument("posts", data);

    if (!result.err && result.data.id && selectedImages && selectedImages[0]) {
      result = await savePostedImage(
        result.data.id,
        selectedImages[0],
        document,
      );
    }

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
{#if store.operator}
  <Content>
    {#if showTemplates}
      <Fields>
        <ButtonText
          id="no-template"
          label={t().noTemplate()}
          onClick={() => {
            showTemplates = false;
          }}
        />
      </Fields>
      {#each templates as template (template.id)}
        <Wrap>
          <Fields>
            <ButtonText
              id={template.id}
              label={template.name}
              onClick={() => {
                showTemplates = false;
                title = template.title;
                message = template.message || template.text;
                link = template.link;
              }}
            />
          </Fields>
          <Fields>
            {getTemplateSummary(template)}
          </Fields>
        </Wrap>
      {/each}
    {:else}
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
            {#if !title && titleRequiredTargets.some( (target) => checkedTargets.includes(target), )}
              <p class="text-light-primary dark:text-dark-primary">
                {t().skipPostingWithoutTitle(titleRequiredTargets)}
              </p>
            {/if}
            {#if !selectedImages?.length && imageRequiredTargets.some( (target) => checkedTargets.includes(target), )}
              <p class="text-light-primary dark:text-dark-primary">
                {t().skipPostingWithoutImage(imageRequiredTargets)}
              </p>
            {/if}
          </Fields>
          <TextFieldOutlined
            id="title"
            label={t().title()}
            type="text"
            bind:value={title}
            message={t().requiredAorB(t().title(), t().message())}
            error={errorTitleMessage}
          />
          <TextFieldOutlined
            id="message"
            label={t().message()}
            type="text"
            lines={6}
            bind:value={message}
            message={t().requiredAorB(t().title(), t().message())}
            error={errorTitleMessage}
          />
          <TextFieldOutlined
            id="link"
            label={t().link()}
            type="text"
            bind:value={link}
          />
        </div>
        <Fields>
          <div class="flex flex-row gap-4">
            <ButtonText
              id="add-image"
              icon={SvgAddPhotoAlternate}
              label={t().image()}
              onClick={() => document.getElementById("add-image-field").click()}
            />
            {#if selectedImages}
              <ButtonText
                id="remove-image"
                icon={SvgRemoveSelection}
                label={t().delete()}
                danger
                onClick={() => (selectedImages = null)}
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
          {#if selectedImages}
            <img
              id="image-selected"
              class="w-96"
              alt="selected"
              src={URL.createObjectURL(selectedImages[0])}
            />
          {/if}
        </Fields>
      </Wrap>
      <Fields>
        <ActionSave id="save" {changed} {valid} {onCancel} {onSave} {error} />
      </Fields>
    {/if}
  </Content>
{/if}
