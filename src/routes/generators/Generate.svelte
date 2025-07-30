<script>
  import { serverTimestamp, Timestamp } from "firebase/firestore";
  import { load } from "js-yaml";
  import Content from "../../lib/components/Content.svelte";
  import ButtonText from "../../lib/coarse-paper/ButtonText.svelte";
  import TextFieldOutlined from "../../lib/coarse-paper/TextFieldOutlined.svelte";
  import Targets from "../../lib/components/Targets.svelte";
  import ActionSave from "../../lib/components/ActionSave.svelte";
  import SvgNoteAdd from "../../lib/icons/SvgNoteAdd.svelte";
  import SvgCognition from "../../lib/icons/SvgCognition.svelte";
  import { t, store } from "../../lib/store.svelte.js";
  import {
    generatePosts,
    imageRequiredTargets,
    createDocument,
  } from "../../lib/firebase.js";

  /**
   * @typedef {Object} Props
   * @param {string} item
   */

  /** @type {Props} */
  let { item } = $props();

  const generator = store.generators.find((g) => g.id === item);
  const source = load(generator?.source);
  const initialStatus =
    source?.input?.type === "file"
      ? t().selectFile((source?.input?.accept || []).join(", "))
      : t().unsupportedInputType();

  /** @type {FileList|null} */
  let selectedFiles = $state(null);
  /** @type {string} */
  let status = $state(initialStatus);
  /** @type {string} */
  let details = $state(`
-------- Source --------
${generator?.source}

-------- Prompt --------
${generator.prompt}
`);
  /** @type {Array<object>}*/
  let posts = $state([]);
  let selected = $state(-1);

  let active = $state(false);

  // Fields
  let title = $state("");
  let message = $state("");
  let link = $state("");
  let files = $state([]);
  let checkedTargets = $state([]);
  let date = $state("");

  let errorTitleMessage = $derived(
    title || message ? "" : t().requiredAorB(t().title(), t().message()),
  );
  let errorTargets = $derived(
    active ? "" : !checkedTargets.length ? t().required() : "",
  );

  // Actions
  let result = $state(null);
  let changed = $derived(
    !active &&
      posts.length &&
      (title !== posts[selected]?.title?.trim() ||
        message !== posts[selected]?.message?.trim() ||
        link !== posts[selected]?.link?.trim() ||
        checkedTargets.length !== generator.targets.length ||
        !checkedTargets.every((target) => generator.targets.includes(target))),
  );
  let valid = $derived(!errorTitleMessage && !errorTargets);
  let error = $derived(result?.err ? t().errorOnDataSave() : "");

  const onCancel = () => {
    selected = posts.every((post) => post.sent)
      ? -1
      : posts.filter((post) => !post.sent).length === 1
        ? posts.findIndex((post) => !post.sent)
        : posts.findIndex((post, index) => !post.sent && selected < index) > -1
          ? posts.findIndex((post, index) => !post.sent && selected < index)
          : posts.findIndex((post, index) => !post.sent && index < selected);

    const post = posts[selected];

    title = post?.title || "";
    message = post?.message || "";
    link = post?.link || "";
    checkedTargets = generator.targets || [];
    date = post?.date || "";
  };

  const onSave = async () => {
    active = true;
    const status = "requested";
    title = title?.trim() ?? "";
    message = message?.trim() ?? "";
    link = link?.trim() ?? "";
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
    const scheduledFor = Timestamp.now();
    const data = { title, message, link, files, targets, scheduledFor, status };
    result = await createDocument("posts", data);
    active = false;
    if (!result.err) {
      posts[selected].sent = true;
      onCancel();
    }
  };

  $effect(() => {
    if (selectedFiles?.length > 0) {
      status = t().waitWithoutClosing();
      Promise.resolve(
        generatePosts(
          source,
          generator.prompt,
          (value) => (details = value),
          selectedFiles[0],
        ),
      ).then((response) => {
        const { err, data } = response;
        if (err) {
          status = initialStatus;
          details = err.toString();
          posts = [];
          selected = 0;
        } else {
          status = t().reviewResult();
          selected = 0;
          posts = data;
          onCancel();
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
      <div>{status}</div>
      {#if posts.length === 0}
        <div class="font-mono whitespace-pre-line">{details}</div>
      {/if}
      {#each posts as post, index (index)}
        <div class="flex flex-col gap-2">
          <h4># {index + 1}</h4>
          {#if post.sent || index !== selected}
            <div>Title: {post.title}</div>
            <div class="whitespace-pre-wrap">{post.message}</div>
            <div class="font-mono whitespace-pre-wrap">Link: {post.link}</div>
            <div class="font-mono">Author: {post.author}</div>
            <div class="font-mono whitespace-pre-wrap">{post.note}</div>
          {:else}
            <TextFieldOutlined
              id={`title-${index}`}
              label={t().title()}
              type="text"
              bind:value={title}
            />
            <TextFieldOutlined
              id={`message-${index}`}
              label={t().message()}
              type="text"
              bind:value={message}
              lines={16}
            />
            <TextFieldOutlined
              id={`link-${index}`}
              label={t().link()}
              type="text"
              bind:value={link}
            />
            <TextFieldOutlined
              id={`date-${index}`}
              label="date"
              type="text"
              bind:value={date}
            />
            <Targets id={`targets-${index}`} bind:value={checkedTargets} />
            <div class="font-mono">
              Categories:
              {(post.categories || []).join(", ")}
            </div>
            <div class="font-mono">Author: {post.author}</div>
            <ActionSave
              id="save"
              {changed}
              {valid}
              {onCancel}
              {onSave}
              {error}
              saveNotChanged
              wide
            />
          {/if}
        </div>
      {/each}
      {#if posts.length > 0}
        <!-- Test -->
        <h4>Input data for AI</h4>
        <div class="font-mono whitespace-pre-line">{details}</div>
      {/if}
    </div>
  {/if}
</Content>
