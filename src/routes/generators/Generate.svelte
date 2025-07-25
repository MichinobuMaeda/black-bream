<script>
  // import { pop } from "svelte-spa-router";
  import { dump, load } from "js-yaml";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import Content from "../../lib/components/Content.svelte";
  import ButtonText from "../../lib/coarse-paper/ButtonText.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import SvgCognition from "../../lib/icons/SvgCognition.svelte";
  // import ActionSave from "../../lib/components/ActionSave.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import {
    generatePosts,
    //   createDocument,
  } from "../../lib/firebase.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  const generator = store.generators.find((g) => g.id === item);
  const source = load(generator?.source);
  const initialMessage =
    source?.input?.type === "file"
      ? t().selectFile((source?.input?.accept || []).join(", "))
      : t().unsupportedInputType();

  // let active = $state(false);

  // Fields
  /** @type {FileList|null} */
  let selectedFiles = $state(null);
  /** @type {string} */
  let message = $state(initialMessage);
  /** @type {string} */
  let text = $state(`
-------- Source --------
${generator?.source}

-------- Prompt --------
${generator.prompt}
`);
  /** @type {object}*/
  let result = $state(null);

  // let title = $state("");
  // let message = $state("");
  // let link = $state("");
  // let errorTitleMessage = $derived(
  //   title || message ? "" : t().requiredAorB(t().title(), t().message()),
  // );
  // let targetItems = postTargets
  //   .filter((target) => (store.conf.postTargets ?? []).includes(target))
  //   .map((target) => ({
  //     value: target,
  //     label: target,
  //   }));
  // let checkedTargets = $state(targetItems.map((item) => item.value));
  // let errorTargets = $derived(
  //   active ? "" : !checkedTargets.length ? t().required() : "",
  // );
  // let schedule = $state(dt().formatDateTime());
  // let errorSchedule = $derived(active ? "" : !schedule ? t().required() : "");
  // let showPreDefinedSchedule = $derived(
  //   store.conf.preDefinedSchedules?.wd.length > 0 &&
  //     store.conf.preDefinedSchedules?.h.length > 0 &&
  //     store.conf.preDefinedSchedules?.m.length > 0,
  // );

  // Actions
  // let result = $state(null);
  // let changed = $derived(!active);
  // let valid = $derived(!errorTitleMessage && !errorTargets && !errorSchedule);
  // let error = $derived(result?.err ? t().errorOnDataSave() : "");

  // const onCancel = async () => {
  // title = "";
  // message = "";
  // link = "";
  // checkedTargets = [];
  // schedule = dt().formatDateTime();
  // pop();
  // };

  // let selectedImages = $state(null);

  // const onSave = async () => {
  // active = true;
  // const status = "requested";
  // title = title?.trim() ?? "";
  // message = message?.trim() ?? "";
  // link = link?.trim() ?? "";
  // const files =
  //   selectedImages && selectedImages[0]
  //     ? [`1.${selectedImages[0].name.split(".").pop()}`]
  //     : [];
  // const targets = checkedTargets
  //   .filter(
  //     (target) => files.length || !imageRequiredTargets.includes(target),
  //   )
  //   .reduce(
  //     (acc, cur) => ({
  //       ...acc,
  //       [cur]: { status, createdAt: serverTimestamp() },
  //     }),
  //     {},
  //   );
  // const scheduledFor = Timestamp.fromDate(dt(schedule).dt);
  // const data = { title, message, link, files, targets, scheduledFor, status };
  // result = await createDocument("posts", data);
  // if (!result.err && result.data.id && selectedImages && selectedImages[0]) {
  //   result = await savePostedImage(
  //     result.data.id,
  //     selectedImages[0],
  //     document,
  //   );
  // }
  // active = false;
  // if (!result.err) {
  //   await onCancel();
  // }
  // };

  $effect(() => {
    if (selectedFiles?.length > 0) {
      message = t().waitWithoutClosing();
      Promise.resolve(
        generatePosts(
          source,
          generator.prompt,
          (value) => (text = value),
          selectedFiles[0],
        ),
      ).then((response) => {
        const { err, data } = response;
        if (err) {
          message = initialMessage;
          text = err.toString();
        } else {
          message = t().reviewResult();
          result = dump(data);
        }
      });
    }
  });
</script>

<h3>
  <span class="size-6"><SvgCognition /></span>
  {t().generator()}
</h3>
<Content>
  {#if (store.operator || store.manager) && store.conf?.aiProvider}
    <div class="flex flex-col gap-2">
      <h4>{generator?.name}</h4>
      <div class="flex flex-row gap-2">
        {#if source.input.type === "file"}
          <ButtonText
            id="open-file"
            icon={SvgNoteAdd}
            label="Word"
            onClick={() => document.getElementById("add-image-field").click()}
          />
          {selectedFiles ? selectedFiles[0].name : "--"}
          <input
            id="add-image-field"
            type="file"
            accept={(source?.input?.accept || []).join(", ")}
            class="hidden"
            bind:files={selectedFiles}
          />
        {/if}
      </div>
      <div>{message}</div>
      {#if result}
        <TextFieldOutlined
          id="result"
          label={t().reviewResult()}
          type="text"
          bind:value={result}
          lines={16}
          readonly
        />
      {:else}
        <div class="font-mono whitespace-pre-wrap">{text}</div>
      {/if}
    </div>
  {/if}
</Content>
