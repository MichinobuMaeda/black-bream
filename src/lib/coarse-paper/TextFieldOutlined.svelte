<script>
  import SvgErrorFill from "../icons/SvgErrorFill.svelte";

  /**
   * @typedef {Object} Props
   * @property {string} id
   * @property {string} [type]
   * @property {Object} value
   * @property {string} label
   * @property {string} [message]
   * @property {string} [error]
   * @property {boolean} [readonly]
   * @property {boolean} [disabled]
   * @property {boolean} [monospace]
   * @property {number} [lines]
   */

  /** @type {Props} */
  let {
    id,
    type = "text",
    value = $bindable(),
    label,
    message = "",
    error = "",
    readonly = false,
    disabled = false,
    monospace = undefined,
    lines = 1,
  } = $props();

  monospace ??= ["password", "email", "number"].includes(type);

  const onChange = (event) => {
    value = event.target.value;
  };
</script>

<div
  class={"flex flex-col grow" +
    (lines === 1 ? " h-[68px]" : "") +
    (disabled ? " opacity-40" : "")}
>
  <label
    for={id}
    class={"mt-2 py-2 px-2 relative block rounded-md border" +
      " focus-within:border-2" +
      " bg-lightForm dark:bg-darkForm" +
      " text-lightOnSurface dark:text-darkOnSurface" +
      (error
        ? " border-lightError dark:border-darkError" +
          " text-lightError dark:text-darkError"
        : " border-lightOutline dark:border-darkOutline" +
          " focus-within:border-lightPrimary focus-within:dark:border-darkPrimary")}
  >
    {#if lines === 1}
      <input
        {id}
        {type}
        bind:value
        class={"peer border-none w-full text-base" +
          " focus:border-none focus:outline-none focus:ring-0" +
          " placeholder-transparent dark:placeholder-transparent" +
          " bg-lightForm dark:bg-darkForm" +
          (monospace ? " font-mono" : "")}
        placeholder={label}
        {readonly}
        {disabled}
      />
      <span
        class={"peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm" +
          " peer-focus:top-0 peer-focus:text-xs pointer-events-none" +
          " absolute start-2 top-0 -translate-y-1/2 p-0.5 text-xs transition-all" +
          " bg-lightForm dark:bg-darkForm" +
          (error
            ? " text-lightError dark:text-darkError"
            : " text-lightOnSurfaceVariant dark:text-darkOnSurfaceVariant" +
              " peer-focus:text-lightPrimary dark:peer-focus:text-darkPrimary")}
      >
        {label}
      </span>
    {:else}
      <textarea
        {id}
        bind:value
        class={"peer border-none w-full text-base" +
          " focus:border-none focus:outline-none focus:ring-0" +
          " placeholder-transparent dark:placeholder-transparent" +
          " bg-lightForm dark:bg-darkForm" +
          (monospace ? " font-mono" : "")}
        placeholder={label}
        rows={lines}
        {readonly}
        {disabled}
        onchange={onChange}>{value}</textarea
      >
      <span
        class={"peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm" +
          " peer-focus:top-0 peer-focus:text-xs pointer-events-none" +
          " absolute start-2 top-0 -translate-y-1/2 p-0.5 text-xs transition-all" +
          " bg-lightForm dark:bg-darkForm" +
          (error
            ? " text-lightError dark:text-darkError"
            : " text-lightOnSurfaceVariant dark:text-darkOnSurfaceVariant" +
              " peer-focus:text-lightPrimary dark:peer-focus:text-darkPrimary")}
      >
        {label}
      </span>
    {/if}
    {#if error}
      <span
        class={"absolute top-2 size-6" +
          (type === "number" ? " end-8" : " end-2") +
          " text-lightError dark:text-darkError"}
      >
        <SvgErrorFill />
      </span>
    {/if}
  </label>
  {#if !error}
    <div
      class="text-sm pl-2 line-clamp-1 text-ellipsis
        text-lightOnSurface dark:text-darkOnSurface"
    >
      {message}
    </div>
  {:else}
    <div
      class="text-sm pl-2 line-clamp-1 text-ellipsis
        text-lightError dark:text-darkError"
    >
      {error}
    </div>
  {/if}
</div>
