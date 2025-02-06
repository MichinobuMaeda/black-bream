<script>
  let { children } = $props();
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
  {@render children()}
</div>
