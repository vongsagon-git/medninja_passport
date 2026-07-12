<!--
  WatchPage.vue — Thin backward-compat wrapper.
  Real implementation lives in views/watch/UniversalWatch.vue.
  Route meta.region controls the region (this route = 'global').
-->
<template>
  <UniversalWatch />
</template>

<script>
import UniversalWatch from './watch/UniversalWatch.vue'

export default {
  name: 'WatchPage',
  components: { UniversalWatch }
}
</script>
