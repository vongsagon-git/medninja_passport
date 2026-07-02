<template>
  <div class="skeleton-card card">
    <div class="card-body">
      <div class="skeleton-badge"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text short"></div>
      <div class="skeleton-price"></div>
      <div class="skeleton-btn"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SkeletonCard'
}
</script>

<style scoped>
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-card {
  pointer-events: none;
}

.skeleton-badge,
.skeleton-title,
.skeleton-text,
.skeleton-price,
.skeleton-btn {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-badge {
  height: 20px;
  width: 70px;
  border-radius: 20px;
}

.skeleton-title {
  height: 22px;
  width: 90%;
  margin-top: 8px;
}

.skeleton-text {
  height: 14px;
  width: 100%;
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-price {
  height: 28px;
  width: 80px;
  margin-top: 4px;
}

.skeleton-btn {
  height: 40px;
  width: 100%;
  border-radius: 8px;
  margin-top: 4px;
  margin-bottom: 0;
}
</style>
