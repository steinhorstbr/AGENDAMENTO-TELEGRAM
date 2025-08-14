<template>
  <div :class="containerClass">
    <div :class="spinnerClass">
      <div class="animate-spin rounded-full border-2 border-t-transparent" :style="spinnerStyle"></div>
    </div>
    <p v-if="message" :class="textClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray'
  message?: string
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  center: true
})

const containerClass = computed(() => [
  props.center ? 'flex flex-col items-center justify-center' : 'flex items-center gap-3',
  props.center ? 'py-8' : ''
])

const spinnerClass = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  return sizes[props.size]
})

const spinnerStyle = computed(() => {
  const colors = {
    primary: 'border-indigo-600',
    white: 'border-white',
    gray: 'border-gray-600'
  }
  return {
    borderColor: colors[props.color],
    borderTopColor: 'transparent'
  }
})

const textClass = computed(() => [
  'text-sm text-gray-600',
  props.center ? 'mt-3' : '',
  props.color === 'white' ? 'text-white' : ''
])
</script>