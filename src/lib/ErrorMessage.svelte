<script>
  let { children } = $props();
</script>

<div class="text-lightError dark:text-darkError">
  {@render children()}
</div>
