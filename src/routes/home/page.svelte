<script>
  import Content from "../../lib/Content.svelte";
  import SvgHome from "../../lib/icons/SvgHome.svelte";
  import { store, m } from "../../lib/store.svelte.js";
</script>

<h2><SvgHome /> {m().home()}</h2>
<h3>Sticky header</h3>
<h4>header level 4</h4>
<h5>header level 5</h5>
<Content>
  <div>Page: Home</div>
  <div>Auth has been loaded.</div>
  {#if store.authUser === null}
    <div>User: guest</div>
  {:else}
    <div>User: {store.authUser.uid}</div>
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
<h3>Sticky header 2</h3>
<Content>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
  <div>Quick fox jumps over the lazy dog.</div>
</Content>
<h3>Sticky header 3</h3>
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
