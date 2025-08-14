<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div class="relative bg-white w-full max-w-lg rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">Finalizar Tarefa</h3>
            <button class="p-1 rounded hover:bg-gray-100" @click="close">✕</button>
          </div>
          
          <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
            <!-- Informações da tarefa -->
            <div v-if="task" class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-800 mb-2">{{ task.title }}</h4>
              <div class="text-sm text-gray-600 space-y-1">
                <p>📅 {{ formatDate(task.date) }}</p>
                <p>🕐 {{ task.start }} - {{ task.end }}</p>
                <p v-if="task.description">📝 {{ task.description }}</p>
              </div>
            </div>

            <!-- Fotos do serviço -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                📸 Fotos do Serviço Executado
              </label>
              
              <!-- Upload de fotos -->
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  class="hidden"
                  @change="handleFileUpload"
                />
                
                <div v-if="photos.length === 0">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <p class="mt-2 text-sm text-gray-600">
                    Clique para adicionar fotos ou arraste e solte aqui
                  </p>
                  <button
                    type="button"
                    @click="$refs.fileInput.click()"
                    class="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Selecionar Fotos
                  </button>
                </div>
                
                <!-- Preview das fotos -->
                <div v-else class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div
                      v-for="(photo, index) in photos"
                      :key="index"
                      class="relative group"
                    >
                      <img
                        :src="photo.preview"
                        class="w-full h-24 object-cover rounded-lg border"
                        :alt="`Foto ${index + 1}`"
                      />
                      <button
                        type="button"
                        @click="removePhoto(index)"
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    @click="$refs.fileInput.click()"
                    class="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Adicionar Mais Fotos
                  </button>
                </div>
              </div>
            </div>

            <!-- Localização GPS -->
            <div>
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                📍 Localização GPS
                <button
                  type="button"
                  @click="getCurrentLocation"
                  :disabled="isGettingLocation"
                  class="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 text-xs disabled:opacity-50"
                >
                  {{ isGettingLocation ? 'Obtendo...' : 'Obter Localização' }}
                </button>
              </label>
              
              <div v-if="location.lat && location.lng" class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <span class="text-green-600 text-lg">📍</span>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-green-800">Localização capturada</p>
                    <p class="text-xs text-green-600 mt-1">
                      {{ location.lat.toFixed(6) }}, {{ location.lng.toFixed(6) }}
                    </p>
                    <p v-if="location.address" class="text-xs text-green-600 mt-1">
                      {{ location.address }}
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="clearLocation"
                    class="text-green-600 hover:text-green-800 text-xs"
                  >
                    Remover
                  </button>
                </div>
              </div>
              
              <div v-else class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p class="text-sm text-gray-600">Nenhuma localização capturada</p>
              </div>
            </div>

            <!-- Observações -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                📝 Observações da Execução
              </label>
              <textarea
                v-model="form.notes"
                rows="4"
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Descreva como foi a execução da tarefa, observações importantes, etc."
              />
            </div>
            
            <!-- Botões de ação -->
            <div class="pt-4 flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                @click="close"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <span v-if="isLoading">Finalizando...</span>
                <span v-else>✅ Finalizar Tarefa</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  task?: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [completionData: any]
}>()

const open = computed(() => props.modelValue)
const isLoading = ref(false)
const isGettingLocation = ref(false)

const form = reactive({
  notes: ''
})

const photos = ref<Array<{ file: File; preview: string }>>([])
const location = reactive({
  lat: null as number | null,
  lng: null as number | null,
  address: ''
})

const fileInput = ref<HTMLInputElement>()

watch(() => props.task, () => {
  // Reset form quando trocar tarefa
  form.notes = ''
  photos.value = []
  location.lat = null
  location.lng = null
  location.address = ''
})

const handleFileUpload = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files) return

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        photos.value.push({
          file,
          preview: e.target?.result as string
        })
      }
      reader.readAsDataURL(file)
    }
  })
}

const removePhoto = (index: number) => {
  photos.value.splice(index, 1)
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('Geolocalização não é suportada pelo seu navegador')
    return
  }

  isGettingLocation.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      location.lat = position.coords.latitude
      location.lng = position.coords.longitude
      
      // Tentar obter endereço via reverse geocoding (opcional)
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${location.lat},${location.lng}&key=YOUR_API_KEY&language=pt&limit=1`
        )
        const data = await response.json()
        if (data.results && data.results[0]) {
          location.address = data.results[0].formatted
        }
      } catch (error) {
        console.log('Erro ao obter endereço:', error)
      }
      
      isGettingLocation.value = false
    },
    (error) => {
      console.error('Erro ao obter localização:', error)
      alert('Não foi possível obter sua localização')
      isGettingLocation.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  )
}

const clearLocation = () => {
  location.lat = null
  location.lng = null
  location.address = ''
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const close = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  isLoading.value = true
  
  try {
    // Preparar dados para envio
    const completionData = {
      notes: form.notes,
      photos: photos.value.map(p => p.file), // Em produção, fazer upload das fotos
      location_lat: location.lat,
      location_lng: location.lng,
      location_address: location.address
    }
    
    await emit('save', completionData)
  } catch (error) {
    console.error('Erro ao finalizar tarefa:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>