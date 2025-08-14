<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="mb-8">
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
          <span class="text-white text-3xl">🥋</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Agenda BJJ</h1>
        <p class="text-gray-600">Carregando sistema...</p>
      </div>
      
      <div class="flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
      
      <div class="mt-8 text-sm text-gray-500">
        <p>Inicializando banco de dados...</p>
      </div>
    </div>
  </div>
</template>