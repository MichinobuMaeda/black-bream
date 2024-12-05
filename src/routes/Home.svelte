<script>
  import Content from "../lib/Content.svelte";
  import { getStore } from "../lib/store.svelte";

  let state = getStore();
</script>

<h2>Sticky header</h2>
<h3>Sticky header level 3</h3>
<h4>Sticky header level 4</h4>
<Content>
  <div>Page: Home</div>
  <div>Auth has been loaded.</div>
  {#if state.authUser === null}
    <div>User: guest</div>
  {:else}
    <div>User: {state.authUser.uid}</div>
  {/if}
  <div>Conf has been loaded.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
</Content>
<h2>Sticky header 2</h2>
<Content>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
</Content>
<h2>Sticky header 3</h2>
<Content>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>last.</div>
</Content>
