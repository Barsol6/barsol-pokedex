<template>
  <div class="pokedex-app">
    <nav class="pokedex-menu">
      <button
          @click="setActiveComponent('PokemonList')"
          :class="['menu-button', { active: activeComponent === 'PokemonList' }]"
      >
        Pokédex List
      </button>
      <button
          @click="setActiveComponent('AdvancedSearch')"
          :class="['menu-button', { active: activeComponent === 'AdvancedSearch' }]"
      >
        Advanced Search
      </button>
    </nav>

    <div class="component-area">
      <component :is="currentComponent"></component>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';


import PokemonList from "@/components/PokemonList.vue";
import AdvancedSearch from "@/components/AdvancedSearch.vue";

const activeComponent = ref('PokemonList');


const components = {
  PokemonList: PokemonList,
  AdvancedSearch: AdvancedSearch
};


const currentComponent = computed(() => {

  return components[activeComponent.value];
});


function setActiveComponent(componentName) {
  activeComponent.value = componentName;
}
</script>

<style>

</style>
