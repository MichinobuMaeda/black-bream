<script>
  import { pop } from "svelte-spa-router";
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
  import { t, store } from "../../lib/store.svelte.js";
  import {
    createDocument,
    savePostImage,
    postTargets,
  } from "../../lib/firebase.js";
  import { formatISO, getNextPreDefinedSchedule } from "../../lib/datetime.js";

  let active = $state(false);

  let templates = $state((store.templates ?? []).filter((t) => !t.deletedAt));
  let showTemplates = $state(templates.length > 0);

  // Fields
  let text = $state("");
  let errorText = $derived(active ? "" : !text ? t().required() : "");
  let targetItems = postTargets
    .filter((target) => (store.conf.postTargets ?? []).includes(target))
    .map((target) => ({
      value: target,
      label: target,
    }));
  let targets = $state([]);
  let errorTargets = $derived(
    active ? "" : !targets.length ? t().required() : "",
  );
  let schedule = $state(formatISO(new Date()));
  let errorSchedule = $derived(active ? "" : !schedule ? t().required() : "");
  let showPreDefinedSchedule = $derived(
    store.conf.preDefinedSchedules?.wd.length > 0 &&
      store.conf.preDefinedSchedules?.h.length > 0 &&
      store.conf.preDefinedSchedules?.m.length > 0,
  );

  // Actions
  let result = $state(null);
  let changed = $derived(!active);
  let valid = $derived(!errorText && !errorTargets && !errorSchedule);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = async () => {
    text = "";
    targets = [];
    schedule = formatISO(new Date());
    pop();
  };

  let selectedImages = $state(null);

  const onSave = async () => {
    active = true;
    text = text.trim();
    const status = "requested";

    result = await createDocument(
      "posts",
      {
        text,
        files:
          selectedImages && selectedImages[0]
            ? [`1.${selectedImages[0].name.split(".").pop()}`]
            : [],
        targets: targets.reduce(
          (acc, cur) => ({ ...acc, [cur]: { status, createdAt: new Date() } }),
          {},
        ),
        scheduledFor: new Date(schedule),
        status,
      },
      true,
    );

    if (!result.err && result.data.id && selectedImages && selectedImages[0]) {
      result = await savePostImage(result.data.id, selectedImages[0]);
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
        {#each templates as template}
          <div class="flex flex-row gap-4">
            <ButtonText
              id={template.id}
              label={template.name}
              onClick={() => {
                showTemplates = false;
                text = template.text;
              }}
            />
            {template.text.split("\n").join(" / ")}
          </div>
        {/each}
      </Fields>
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
            lines={6}
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
