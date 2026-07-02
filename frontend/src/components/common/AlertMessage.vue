<template>
  <div class="alert" :class="`alert-${type}`" v-if="message">
    {{ message }}
  </div>
</template>

<script>
export default {
  name: 'AlertMessage',
  props: {
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'error',
      validator: (v) => ['error', 'success', 'warning'].includes(v)
    }
  }
}
</script>
