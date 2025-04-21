<template>
  <div class="advanced-search">
    <h2>Advanced Pokémon Search</h2>


    <div class="search-history" v-if="searchHistory.length > 0">
      <h3>Search History ({{ searchHistory.length }})</h3>
      <div class="history-items">
        <div v-for="(item, index) in searchHistory" :key="index" class="history-item">
          <div class="history-details">
            <span v-if="item.name"><strong>Name:</strong> {{ item.name }}</span>
            <span v-if="item.type"><strong>Type:</strong> {{ capitalizeFirstLetter(item.type) }}</span>
            <span v-if="item.generation"><strong>Gen:</strong> {{ generations.find(g => g.value === item.generation)?.label }}</span>
            <span v-if="item.isLegendary" class="legendary-tag">★ Legendary</span>
            <span v-if="item.isMythical" class="mythical-tag">✦ Mythical</span>
            <span><strong>Date:</strong> {{ formatDate(item.timestamp) }}</span>
          </div>
          <div class="history-actions">
            <button @click="loadSearch(item)" class="small-button">Load</button>
            <button @click="confirmDelete(index)" class="small-button delete">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <form @submit.prevent="validateAndSearch" class="search-form" novalidate>
      <div class="form-row">
        <div class="form-group">
          <label for="name-search">Name:</label>
          <input
              type="text"
              id="name-search"
              v-model.trim="searchParams.name"
              placeholder="Enter name..."
              @input="clearError('name')"
              maxlength="20"
          >
          <span class="error-message" v-if="errors.name">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="type-search">Type:</label>
          <select
              id="type-search"
              v-model="searchParams.type"
              @change="clearError('type')"
          >
            <option value="">Any Type</option>
            <option v-for="type in pokemonTypes" :value="type" :key="type">
              {{ capitalizeFirstLetter(type) }}
            </option>
          </select>
          <span class="error-message" v-if="errors.type">{{ errors.type }}</span>
        </div>
      </div>

      <div class="filter-group">
        <label>Generation:</label>
        <div class="radio-group">
          <label v-for="gen in generations" :key="gen.value">
            <input
                type="radio"
                v-model="searchParams.generation"
                :value="gen.value"
                @change="clearError('generation')"
            >
            {{ gen.label }}
          </label>
        </div>
        <span class="error-message" v-if="errors.generation">{{ errors.generation }}</span>
      </div>

      <div class="filter-group">
        <label>Special Types:</label>
        <div class="checkbox-group">
          <label>
            <input
                type="checkbox"
                v-model="searchParams.isLegendary"
                @change="clearError('isLegendary')"
            >
            Legendary
          </label>
          <label>
            <input
                type="checkbox"
                v-model="searchParams.isMythical"
                @change="clearError('isMythical')"
            >
            Mythical
          </label>
        </div>
      </div>

      <div class="filter-group">
        <label>Base Stats:</label>
        <div class="stat-filters">
          <div class="stat-input">
            <label>HP ≥</label>
            <input
                type="number"
                v-model.number="searchParams.minHp"
                min="1"
                max="255"
                placeholder="0"
                @input="clearError('minHp')"
            >
            <span class="error-message" v-if="errors.minHp">{{ errors.minHp }}</span>
          </div>
          <div class="stat-input">
            <label>Attack ≥</label>
            <input
                type="number"
                v-model.number="searchParams.minAttack"
                min="1"
                max="255"
                placeholder="0"
                @input="clearError('minAttack')"
            >
            <span class="error-message" v-if="errors.minAttack">{{ errors.minAttack }}</span>
          </div>
          <div class="stat-input">
            <label>Defense ≥</label>
            <input
                type="number"
                v-model.number="searchParams.minDefense"
                min="1"
                max="255"
                placeholder="0"
                @input="clearError('minDefense')"
            >
            <span class="error-message" v-if="errors.minDefense">{{ errors.minDefense }}</span>
          </div>
        </div>
      </div>

      <div class="form-row actions">
        <button type="submit" class="menu-button primary">Search</button>
        <button type="button" class="menu-button secondary" @click="resetSearch">Reset</button>
        <button
            type="button"
            class="menu-button tertiary"
            @click="saveSearch"
            :disabled="!isFormValid || !hasSearchCriteria"
            title="Save current search criteria"
        >
          Save Search
        </button>
        <button
            type="button"
            class="menu-button danger"
            @click="clearAllHistory"
            v-if="searchHistory.length > 0"
        >
          Clear All History
        </button>
      </div>
    </form>

    <div v-if="isLoading" class="loading-indicator">
      <div class="loading-spinner"></div>
      <p>Searching Pokémon...</p>
    </div>

    <div class="pokemon-list-container" v-if="searchResults.length > 0">
      <h3>Search Results ({{ searchResults.length }})</h3>
      <div class="results-controls">
        <div class="sort-options">
          <label>Sort by:</label>
          <select v-model="searchParams.sortBy" @change="performSort">
            <option value="id">Pokédex Number</option>
            <option value="name">Name</option>
            <option value="attack">Attack</option>
            <option value="defense">Defense</option>
            <option value="hp">HP</option>
          </select>
        </div>
        <button @click="exportResults" class="small-button">Export Results</button>
      </div>
      <div class="pokedex-scroll-container">
      <div class="pokedex-device">
        <div
            class="pokedex-page"
            v-for="pokemon in searchResults"
            :key="pokemon.id"
        >
          <div class="pokemon-display">
            <div class="pokemon-image-placeholder">
              <img
                  :src="pokemon.sprite"
                  :alt="pokemon.name"
                  class="pokemon-image"
                  @error="handleImageError"
                  loading="lazy"
              >
            </div>
            <div class="pokemon-details-placeholder">
              <h4>#{{ pokemon.id.toString().padStart(3, '0') }} {{ capitalizeFirstLetter(pokemon.name) }}</h4>
              <p>
                <strong>Type:</strong>
                <span
                    v-for="(type, index) in pokemon.types"
                    :key="type"
                    :class="'type-' + type"
                >
                  {{ capitalizeFirstLetter(type) }}{{ index < pokemon.types.length - 1 ? ', ' : '' }}
                </span>
              </p>
              <p><strong>Height:</strong> {{ (pokemon.height / 10).toFixed(1) }} m</p>
              <p><strong>Weight:</strong> {{ (pokemon.weight / 10).toFixed(1) }} kg</p>
              <p><strong>Abilities:</strong> {{ formatAbilities(pokemon.abilities) }}</p>
              <div class="pokemon-stats">
                <div class="stat-bar">
                  <label>HP:</label>
                  <progress :value="pokemon.stats.hp" max="255"></progress>
                  <span>{{ pokemon.stats.hp }}</span>
                </div>
                <div class="stat-bar">
                  <label>Attack:</label>
                  <progress :value="pokemon.stats.attack" max="255"></progress>
                  <span>{{ pokemon.stats.attack }}</span>
                </div>
                <div class="stat-bar">
                  <label>Defense:</label>
                  <progress :value="pokemon.stats.defense" max="255"></progress>
                  <span>{{ pokemon.stats.defense }}</span>
                </div>
              </div>
              <p v-if="pokemon.isLegendary" class="legendary-tag">★ Legendary</p>
              <p v-if="pokemon.isMythical" class="mythical-tag">✦ Mythical</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <div v-else-if="searchAttempted && !isLoading" class="no-results">
      <p>No Pokémon found matching your criteria.</p>
      <button @click="resetSearch" class="menu-button">Try Again</button>
    </div>


    <div v-if="showConfirmation" class="confirmation-dialog">
      <div class="dialog-content">
        <p>Are you sure you want to delete this search?</p>
        <div class="dialog-buttons">
          <button @click="deleteSearch(deleteIndex)" class="menu-button danger">Delete</button>
          <button @click="cancelDelete" class="menu-button secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import pokemonListData from '@/assets/pokeApi.json';

const defaultSprite = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

const pokemonTypes = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic',
  'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const generations = [
  { value: 1, label: 'Gen 1 (Kanto)' },
  { value: 2, label: 'Gen 2 (Johto)' },
  { value: 3, label: 'Gen 3 (Hoenn)' },
  { value: 4, label: 'Gen 4 (Sinnoh)' },
  { value: 5, label: 'Gen 5 (Unova)' },
  { value: 6, label: 'Gen 6 (Kalos)' },
  { value: 7, label: 'Gen 7 (Alola)' },
  { value: 8, label: 'Gen 8 (Galar)' },
  { value: 9, label: 'Gen 9 (Paldea)' }
];

const pokemonList = pokemonListData.results;

const searchParams = ref({
  name: '',
  type: '',
  generation: null,
  isLegendary: false,
  isMythical: false,
  minHp: null,
  minAttack: null,
  minDefense: null,
  sortBy: 'id'
});

const errors = ref({
  name: '',
  type: '',
  generation: '',
  minHp: '',
  minAttack: '',
  minDefense: ''
});

const searchResults = ref([]);
const isLoading = ref(false);
const searchAttempted = ref(false);
const pokemonDetailsCache = ref({});
const searchHistory = ref([]);
const showConfirmation = ref(false);
const deleteIndex = ref(null);

const isFormValid = computed(() => {
  return Object.values(errors.value).every(error => !error);
});

const hasSearchCriteria = computed(() => {
  return searchParams.value.name ||
      searchParams.value.type ||
      searchParams.value.generation ||
      searchParams.value.isLegendary ||
      searchParams.value.isMythical ||
      searchParams.value.minHp !== null ||
      searchParams.value.minAttack !== null ||
      searchParams.value.minDefense !== null;
});

onMounted(() => {
  loadSearchHistory();
});


function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatAbilities(abilities) {
  if (!abilities || !abilities.length) return 'N/A';
  return abilities.map(ability =>
      capitalizeFirstLetter(ability.ability?.name.replace('-', ' ') || ability.replace('-', ' '))
  ).join(', ');
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function handleImageError(event) {
  event.target.src = defaultSprite;
}

function clearError(field) {
  errors.value[field] = '';
}


function loadSearchHistory() {
  const savedHistory = localStorage.getItem('pokemonSearchHistory');
  if (savedHistory) {
    try {
      searchHistory.value = JSON.parse(savedHistory);
    } catch (e) {
      console.error('Error parsing search history:', e);
      searchHistory.value = [];
    }
  }
}

function saveSearchHistory() {
  localStorage.setItem('pokemonSearchHistory', JSON.stringify(searchHistory.value));
}


function validateForm() {
  let isValid = true;


  errors.value = {
    name: '',
    type: '',
    generation: '',
    minHp: '',
    minAttack: '',
    minDefense: ''
  };


  if (searchParams.value.name && searchParams.value.name.length < 2) {
    errors.value.name = 'Name must be at least 2 characters';
    isValid = false;
  }


  if (searchParams.value.minHp !== null) {
    if (isNaN(searchParams.value.minHp) || searchParams.value.minHp < 1 || searchParams.value.minHp > 255) {
      errors.value.minHp = 'HP must be between 1 and 255';
      isValid = false;
    }
  }

  if (searchParams.value.minAttack !== null) {
    if (isNaN(searchParams.value.minAttack) || searchParams.value.minAttack < 1 || searchParams.value.minAttack > 255) {
      errors.value.minAttack = 'Attack must be between 1 and 255';
      isValid = false;
    }
  }

  if (searchParams.value.minDefense !== null) {
    if (isNaN(searchParams.value.minDefense) || searchParams.value.minDefense < 1 || searchParams.value.minDefense > 255) {
      errors.value.minDefense = 'Defense must be between 1 and 255';
      isValid = false;
    }
  }


  if (!hasSearchCriteria.value) {
    errors.value.name = 'Please provide at least one search criteria';
    isValid = false;
  }

  return isValid;
}

function resetSearch() {
  searchParams.value = {
    name: '',
    type: '',
    generation: null,
    isLegendary: false,
    isMythical: false,
    minHp: null,
    minAttack: null,
    minDefense: null,
    sortBy: 'id'
  };
  searchResults.value = [];
  searchAttempted.value = false;
  errors.value = {
    name: '',
    type: '',
    generation: '',
    minHp: '',
    minAttack: '',
    minDefense: ''
  };
}

function saveSearch() {
  if (!isFormValid.value || !hasSearchCriteria.value) return;

  const searchToSave = {
    ...searchParams.value,
    timestamp: new Date().toISOString()
  };


  searchHistory.value.unshift(searchToSave);


  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10);
  }


  saveSearchHistory();
}

function loadSearch(savedSearch) {
  searchParams.value = {
    name: savedSearch.name || '',
    type: savedSearch.type || '',
    generation: savedSearch.generation || null,
    isLegendary: savedSearch.isLegendary || false,
    isMythical: savedSearch.isMythical || false,
    minHp: savedSearch.minHp !== undefined ? savedSearch.minHp : null,
    minAttack: savedSearch.minAttack !== undefined ? savedSearch.minAttack : null,
    minDefense: savedSearch.minDefense !== undefined ? savedSearch.minDefense : null,
    sortBy: savedSearch.sortBy || 'id'
  };


  validateAndSearch();
}

function confirmDelete(index) {
  deleteIndex.value = index;
  showConfirmation.value = true;
}

function cancelDelete() {
  showConfirmation.value = false;
  deleteIndex.value = null;
}

function deleteSearch(index) {
  searchHistory.value.splice(index, 1);
  saveSearchHistory();
  showConfirmation.value = false;
  deleteIndex.value = null;
}

function clearAllHistory() {
  searchHistory.value = [];
  localStorage.removeItem('pokemonSearchHistory');
}


async function fetchPokemonDetails(url) {
  if (pokemonDetailsCache.value[url]) {
    return pokemonDetailsCache.value[url];
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();

    const pokemonData = {
      id: data.id,
      name: data.name,
      sprite: data.sprites?.front_default || defaultSprite,
      types: data.types?.map(t => t.type.name) || [],
      height: data.height || 0,
      weight: data.weight || 0,
      abilities: data.abilities || [],
      stats: {
        hp: data.stats?.find(s => s.stat.name === 'hp')?.base_stat || 0,
        attack: data.stats?.find(s => s.stat.name === 'attack')?.base_stat || 0,
        defense: data.stats?.find(s => s.stat.name === 'defense')?.base_stat || 0
      },
      isLegendary: false,
      isMythical: false,
      generation: determineGeneration(data.id)
    };

    pokemonDetailsCache.value[url] = pokemonData;
    return pokemonData;
  } catch (error) {
    console.error('Error fetching Pokémon details:', error);
    return null;
  }
}

function determineGeneration(id) {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

async function validateAndSearch() {
  if (!validateForm()) return;

  await performSearch();
}

function performSort() {
  if (searchParams.value.sortBy === 'name') {
    searchResults.value.sort((a, b) => a.name.localeCompare(b.name));
  } else if (searchParams.value.sortBy === 'attack') {
    searchResults.value.sort((a, b) => b.stats.attack - a.stats.attack);
  } else if (searchParams.value.sortBy === 'defense') {
    searchResults.value.sort((a, b) => b.stats.defense - a.stats.defense);
  } else if (searchParams.value.sortBy === 'hp') {
    searchResults.value.sort((a, b) => b.stats.hp - a.stats.hp);
  } else {
    searchResults.value.sort((a, b) => a.id - b.id);
  }
}

async function performSearch() {
  isLoading.value = true;
  searchAttempted.value = true;
  searchResults.value = [];

  try {

    let filteredPokemon = pokemonList;
    if (searchParams.value.name) {
      filteredPokemon = filteredPokemon.filter(pokemon =>
          pokemon.name.toLowerCase().includes(searchParams.value.name.toLowerCase())
      );
    }

    const pokemonDetails = await Promise.all(
        filteredPokemon.map(pokemon => fetchPokemonDetails(pokemon.url))
    );

    searchResults.value = pokemonDetails
        .filter(pokemon => pokemon !== null)
        .filter(pokemon => {

          if (searchParams.value.type && !pokemon.types.includes(searchParams.value.type)) {
            return false;
          }

          if (searchParams.value.minHp !== null && pokemon.stats.hp < searchParams.value.minHp) {
            return false;
          }

          if (searchParams.value.minAttack !== null && pokemon.stats.attack < searchParams.value.minAttack) {
            return false;
          }

          if (searchParams.value.minDefense !== null && pokemon.stats.defense < searchParams.value.minDefense) {
            return false;
          }

          if (searchParams.value.generation && pokemon.generation !== searchParams.value.generation) {
            return false;
          }

          return true;
        });

    performSort();

  } catch (error) {
    console.error('Error searching Pokémon:', error);
    searchResults.value = [];
  } finally {
    isLoading.value = false;
  }
}

function exportResults() {
  if (searchResults.value.length === 0) return;

  const data = {
    searchParams: searchParams.value,
    results: searchResults.value,
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pokemon-search-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<style scoped>



</style>