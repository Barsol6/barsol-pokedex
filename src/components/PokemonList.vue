<template>
  <div class="pokemon-list-container">
    <div class="pokedex-device">


      <div class="pokedex-page">
        <div v-if="pokemonLeft && pokemonLeftDetails" class="pokemon-display">
          <div class="pokemon-image-placeholder">
            <img :src="getPokemonImage(pokemonLeft.url)" :alt="pokemonLeft.name" class="pokemon-image">
          </div>
          <div class="pokemon-details-placeholder">
            <h4>{{ formatName(pokemonLeft.name) }}</h4>
            <p>Type: {{ pokemonLeftDetails.types.map(t => formatName(t.type.name)).join(', ') }}</p>
            <p>Height: {{ pokemonLeftDetails.height }}</p>
            <p>Weight: {{ pokemonLeftDetails.weight }}</p>
          </div>
        </div>
      </div>


      <div class="pokedex-page">
        <div v-if="pokemonRight && pokemonRightDetails" class="pokemon-display">
          <div class="pokemon-image-placeholder">
            <img :src="getPokemonImage(pokemonRight.url)" :alt="pokemonRight.name" class="pokemon-image">
          </div>
          <div class="pokemon-details-placeholder">
            <h4>{{ formatName(pokemonRight.name) }}</h4>
            <p>Type: {{ pokemonRightDetails.types.map(t => formatName(t.type.name)).join(', ') }}</p>
            <p>Height: {{ pokemonRightDetails.height }}</p>
            <p>Weight: {{ pokemonRightDetails.weight }}</p>
          </div>
        </div>
      </div>

    </div>


    <div class="pokedex-navigation">
      <button class="nav-button" @click="prevPage" :disabled="currentIndex === 0">Previous</button>
      <button class="nav-button" @click="nextPage" :disabled="currentIndex >= pokemons.length - 2">Next</button>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onBeforeUnmount} from 'vue';
import pokeApiData from "@/assets/pokeApi.json";

const pokemons = ref(pokeApiData.results);
const currentIndex = ref(0);

const isMobile = ref(false);

const pokemonLeft = computed(() => pokemons.value[currentIndex.value]);
const pokemonRight = computed(() =>
    currentIndex.value + 1 < pokemons.value.length ? pokemons.value[currentIndex.value + 1] : null
);

const pokemonLeftDetails = ref(null);
const pokemonRightDetails = ref(null);

async function fetchPokemonDetails() {
  if (pokemonLeft.value) {
    const res = await fetch(pokemonLeft.value.url);
    pokemonLeftDetails.value = await res.json();
  } else {
    pokemonLeftDetails.value = null;
  }

  if (pokemonRight.value) {
    const res = await fetch(pokemonRight.value.url);
    pokemonRightDetails.value = await res.json();
  } else {
    pokemonRightDetails.value = null;
  }
}

watch(currentIndex, fetchPokemonDetails, { immediate: true });

function nextPage() {
  const step = isMobile.value ? 1 : 2;
  if (currentIndex.value < pokemons.value.length - step) {
    currentIndex.value += step;
  }
}

function prevPage() {
  const step = isMobile.value ? 1 : 2;
  currentIndex.value = Math.max(0, currentIndex.value - step);
}

const extractIdFromUrl = (url) => {
  if (!url) return 'N/A';
  const parts = url.split('/');
  return parts[parts.length - 2];
};

const getPokemonImage = (url) => {
  const id = extractIdFromUrl(url);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};

const formatName = (name) => {
  return name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
};

onMounted(()=>{
  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);
});

function checkIfMobile() {
  isMobile.value = window.innerWidth <= 768;
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkIfMobile);
});

</script>

<style>

</style>