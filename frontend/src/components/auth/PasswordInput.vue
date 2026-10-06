<script setup lang="ts">
import { ref } from 'vue'
import InputPassword from 'primevue/inputpassword'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Chip from 'primevue/chip'

interface Rule {
  label: string
  test: (v: string) => boolean
}

const props = defineProps<{
  modelValue: string
  id: string
  label?: string
  placeholder?: string
  rules?: Rule[]
  disabled?: boolean
  required?: boolean
  autocomplete?: string
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>();

const mask = ref(true)

const defaultRules: Rule[] = [
  { label: '8+ caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Número', test: (v: string) => /\d/.test(v) },
  { label: 'Mayúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Carácter especial', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
]

const activeRules = props.rules ?? defaultRules

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function onBlur() {
  emit('blur')
}

function toggleMask() {
  mask.value = !mask.value
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" :for="id" class="text-sm font-medium text-ink">{{ label }}</label>
    <IconField class="w-full">
      <InputIcon class="text-muted"><i class="pi pi-lock" /></InputIcon>
      <InputPassword
        :id="id"
        :value="modelValue"
        @input="onInput"
        @blur="onBlur"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :fluid="true"
        :toggleMask="false"
        :style="{ paddingRight: '3rem' }"
        :ptm="{
          input: {
            class: 'pr-10',
          },
        }"
      />
      <InputIcon class="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" @click="toggleMask">
        <i :class="mask ? 'pi pi-eye' : 'pi pi-eye-slash'" :size="16" />
      </InputIcon>
    </IconField>
    <div v-if="activeRules.length" class="flex flex-wrap gap-1.5">
      <Chip
        v-for="rule in activeRules"
        :key="rule.label"
        class="py-1! px-2! text-xs! gap-1.5! bg-transparent! border border-surface-200 dark:border-surface-700"
        :class="rule.test(modelValue) ? 'text-green-600! dark:text-green-400!' : 'text-surface-500! dark:text-surface-400!'"
      >
        <span
          :class="
            'size-4 inline-flex items-center justify-center rounded-full ' +
            (rule.test(modelValue)
              ? 'bg-green-600 text-surface-0 dark:bg-green-400 dark:text-surface-900'
              : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400')
          "
        >
          <i :class="rule.test(modelValue) ? 'pi pi-check' : 'pi pi-times'" :size="12" />
        </span>
        {{ rule.label }}
      </Chip>
    </div>
  </div>
</template>