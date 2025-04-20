<template>
  <div class="advanced-search">
    <h2>Advanced Pokémon Search</h2>

    <!-- Search History Section -->
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

// Computed properties
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

// Lifecycle hook
onMounted(() => {
  loadSearchHistory();
});

// Utility functions
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

// Storage functions
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

// Form functions
function validateForm() {
  let isValid = true;

  // Clear previous errors
  errors.value = {
    name: '',
    type: '',
    generation: '',
    minHp: '',
    minAttack: '',
    minDefense: ''
  };

  // Validate name (if provided)
  if (searchParams.value.name && searchParams.value.name.length < 2) {
    errors.value.name = 'Name must be at least 2 characters';
    isValid = false;
  }

  // Validate stats (if provided)
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

  // Validate at least one search criteria is provided
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

  // Add to history
  searchHistory.value.unshift(searchToSave);

  // Keep only last 10 searches
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10);
  }

  // Save to localStorage
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

  // Trigger search automatically
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

// Search functions
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
      isLegendary: false, // Would need species data
      isMythical: false,  // Would need species data
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
    // First filter by name if specified
    let filteredPokemon = pokemonList;
    if (searchParams.value.name) {
      filteredPokemon = filteredPokemon.filter(pokemon =>
          pokemon.name.toLowerCase().includes(searchParams.value.name.toLowerCase())
      );
    }

    // Fetch details for filtered Pokémon
    const pokemonDetails = await Promise.all(
        filteredPokemon.map(pokemon => fetchPokemonDetails(pokemon.url))
    );

    // Apply additional filters
    searchResults.value = pokemonDetails
        .filter(pokemon => pokemon !== null)
        .filter(pokemon => {
          // Type filter
          if (searchParams.value.type && !pokemon.types.includes(searchParams.value.type)) {
            return false;
          }

          // Stats filters
          if (searchParams.value.minHp !== null && pokemon.stats.hp < searchParams.value.minHp) {
            return false;
          }

          if (searchParams.value.minAttack !== null && pokemon.stats.attack < searchParams.value.minAttack) {
            return false;
          }

          if (searchParams.value.minDefense !== null && pokemon.stats.defense < searchParams.value.minDefense) {
            return false;
          }

          // Generation filter
          if (searchParams.value.generation && pokemon.generation !== searchParams.value.generation) {
            return false;
          }

          return true;
        });

    // Apply initial sorting
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
/* Base Styles */
.advanced-search {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--pokedex-text);
}

h2, h3 {
  color: var(--pokedex-red);
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 2rem;
  text-align: center;
  border-bottom: 2px solid var(--pokedex-red);
  padding-bottom: 1rem;
}

h3 {
  font-size: 1.5rem;
}

/* Form Styles */
.search-form {
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: var(--pokedex-dark-red);
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--pokedex-red);
  outline: none;
}

.filter-group {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.filter-group label {
  display: block;
  margin-bottom: 1rem;
  font-weight: bold;
  color: var(--pokedex-dark-red);
}

.radio-group, .checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.radio-group label, .checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.stat-filters {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-input {
  display: flex;
  flex-direction: column;
  min-width: 100px;
}

.stat-input label {
  margin-bottom: 0.5rem;
  font-weight: normal;
}

.stat-input input {
  width: 100%;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

/* Button Styles */
.menu-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  flex: 1;
  min-width: 120px;
}

.menu-button.primary {
  background-color: var(--pokedex-red);
  color: white;
}

.menu-button.secondary {
  background-color: var(--pokedex-screen-bg);
  color: var(--pokedex-text);
}

.menu-button.tertiary {
  background-color: var(--pokedex-button-yellow);
  color: var(--pokedex-text);
}

.menu-button.danger {
  background-color: var(--pokedex-button-red);
  color: white;
}

.menu-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.menu-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.menu-button.primary:not(:disabled):hover {
  background-color: var(--pokedex-dark-red);
}

.menu-button.secondary:not(:disabled):hover {
  background-color: #d1d5db;
}

.menu-button.tertiary:not(:disabled):hover {
  background-color: #d97706;
  color: white;
}

.menu-button.danger:not(:disabled):hover {
  background-color: #dc2626;
}

.small-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--pokedex-button-blue);
  color: white;
  transition: opacity 0.3s;
}

.small-button.delete {
  background-color: var(--pokedex-button-red);
}

.small-button:hover {
  opacity: 0.9;
}

/* Error Styles */
.error-message {
  color: var(--pokedex-button-red);
  font-size: 0.875rem;
  margin-top: 0.25rem;
  height: 1rem;
  display: block;
}

/* Loading Indicator */
.loading-indicator {
  margin: 2rem 0;
  text-align: center;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--pokedex-red);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Search History */
.search-history {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: transform 0.3s;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.history-details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.history-details span {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.history-details strong {
  font-weight: bold;
}

.history-actions {
  display: flex;
  gap: 0.5rem;
}


.pokemon-list-container {
  margin-top: 2rem;
}

.results-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-options select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.pokedex-scroll-container {
  position: relative;
  width: 100%;
  margin-top: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 1rem;
}

.pokedex-device {
  background-color: var(--pokedex-red);
  border-radius: 15px 15px 15px 50px / 15px 15px 15px 15px;
  padding: 1.5rem;
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(0, 0, 0, 0.2);
  border: 3px solid var(--pokedex-dark-red);
  display: inline-flex;
  gap: 1.5rem;
  width: auto;
  min-width: 100%;
}


.pokedex-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.pokedex-scroll-container::-webkit-scrollbar-track {
  background: var(--pokedex-red);
  border-radius: 10px;
}

.pokedex-scroll-container::-webkit-scrollbar-thumb {
  background-color: var(--pokedex-dark-red);
  border-radius: 10px;
}

.pokedex-page {
  background-color: #f8f8f8;
  border: 5px solid var(--pokedex-screen-border);
  border-radius: 10px;
  padding: 1rem;
  width: 300px;
  flex: 0 0 auto; /* Don't grow or shrink */
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.15);
}


@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(-50%) translateX(0);}
  40% {transform: translateY(-50%) translateX(-10px);}
  60% {transform: translateY(-50%) translateX(-5px);}
}

.pokemon-display {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.pokemon-image-placeholder {
  width: 100%;
  height: 180px;
  background-color: var(--pokedex-screen-bg);
  border: 2px dashed var(--pokedex-screen-border);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  overflow: hidden;
}

.pokemon-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.pokemon-details-placeholder {
  background-color: var(--pokedex-screen-bg);
  border: 1px solid var(--pokedex-screen-border);
  border-radius: 5px;
  padding: 1rem;
  flex-grow: 1;
  color: var(--pokedex-text);
}

.pokemon-details-placeholder h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--pokedex-dark-red);
  border-bottom: 1px solid var(--pokedex-dark-red);
  padding-bottom: 0.5rem;
  font-size: 1.25rem;
}

.pokemon-details-placeholder p {
  margin: 0.5rem 0;
  line-height: 1.5;
}

.pokemon-details-placeholder strong {
  color: var(--pokedex-dark-red);
}

.pokemon-stats {
  margin: 1rem 0;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stat-bar label {
  min-width: 60px;
  font-size: 0.875rem;
}

.stat-bar progress {
  flex-grow: 1;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}

.stat-bar progress::-webkit-progress-bar {
  background-color: #e5e7eb;
  border-radius: 5px;
}

.stat-bar progress::-webkit-progress-value {
  background-color: var(--pokedex-red);
  border-radius: 5px;
}

.stat-bar span {
  min-width: 30px;
  text-align: right;
  font-size: 0.875rem;
}

/* Type colors */
.type-normal { color: #A8A878; }
.type-fire { color: #F08030; }
.type-water { color: #6890F0; }
.type-electric { color: #F8D030; }
.type-grass { color: #78C850; }
.type-ice { color: #98D8D8; }
.type-fighting { color: #C03028; }
.type-poison { color: #A040A0; }
.type-ground { color: #E0C068; }
.type-flying { color: #A890F0; }
.type-psychic { color: #F85888; }
.type-bug { color: #A8B820; }
.type-rock { color: #B8A038; }
.type-ghost { color: #705898; }
.type-dragon { color: #7038F8; }
.type-dark { color: #705848; }
.type-steel { color: #B8B8D0; }
.type-fairy { color: #EE99AC; }

.legendary-tag, .mythical-tag {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.875rem;
}

.legendary-tag {
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--pokedex-dark-red);
}

@media (max-width: 768px) {
  .pokedex-device {
    padding: 1rem;
    gap: 1rem;
  }

  .pokedex-page {
    width: 280px;
  }
}



</style>