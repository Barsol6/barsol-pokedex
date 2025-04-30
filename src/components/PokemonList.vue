<template>
  <div class="pokemon-list-container">
    <div v-if="pokemons && pokemons.length > 0" class="pokedex-scroll-container">
      <div class="pokedex-device">

        <div class="pokedex-page" v-if="pokemonLeft">
          <div v-if="pokemonLeftDetails && pokemonLeftDetails.id !== undefined" class="pokemon-display">
            <div class="pokemon-image-" @mouseenter="initParticles($event, pokemonLeftDetails.types)" @mouseleave="destroyParticles">
              <img v-if="pokemonLeft.url" :src="getPokemonImage(pokemonLeft.url)" :alt="pokemonLeftDetails.name" class="pokemon-image">
              <span v-else>No Image URL</span>
              <div :id="'particles-left-' + currentIndex" class="particles-container"></div>
            </div>
            <div class="pokemon-details-">
              <h4>#{{ pokemonLeftDetails.id.toString().padStart(3, '0') }} {{ capitalizeFirstLetter(pokemonLeftDetails.name) }}</h4>
              <p>
                <strong>Type:</strong>
                <template v-if="pokemonLeftDetails.types && pokemonLeftDetails.types.length > 0">
                  <span
                      v-for="(type, index) in pokemonLeftDetails.types"
                      :key="type"
                      :class="'type-' + type"
                  >
                      {{ capitalizeFirstLetter(type) }}{{ index < pokemonLeftDetails.types.length - 1 ? ', ' : '' }}
                  </span>
                </template>
                <span v-else>N/A</span>
              </p>
              <p><strong>Height:</strong> {{ pokemonLeftDetails.height ? (pokemonLeftDetails.height / 10).toFixed(1) + ' m' : 'N/A' }}</p>
              <p><strong>Weight:</strong> {{ pokemonLeftDetails.weight ? (pokemonLeftDetails.weight / 10).toFixed(1) + ' kg' : 'N/A' }}</p>
              <p><strong>Abilities:</strong> {{ formatAbilities(pokemonLeftDetails.abilities) }}</p>
              <div v-if="pokemonLeftDetails.stats" class="pokemon-stats">
                <div class="stat-bar">
                  <label>HP:</label>
                  <progress :value="pokemonLeftDetails.stats.hp" max="255"></progress>
                  <span>{{ pokemonLeftDetails.stats.hp }}</span>
                </div>
                <div class="stat-bar">
                  <label>Attack:</label>
                  <progress :value="pokemonLeftDetails.stats.attack" max="255"></progress>
                  <span>{{ pokemonLeftDetails.stats.attack }}</span>
                </div>
                <div class="stat-bar">
                  <label>Defense:</label>
                  <progress :value="pokemonLeftDetails.stats.defense" max="255"></progress>
                  <span>{{ pokemonLeftDetails.stats.defense }}</span>
                </div>
              </div>
              <div v-else>Stats N/A</div>
              <p v-if="pokemonLeftDetails.isLegendary" class="legendary-tag">★ Legendary</p>
              <p v-if="pokemonLeftDetails.isMythical" class="mythical-tag">✦ Mythical</p>
            </div>
          </div>
          <div v-else class="loading-">
            Loading {{ pokemonLeft.name ? capitalizeFirstLetter(pokemonLeft.name) : 'Pokemon' }}...
          </div>
        </div>

        <div class="pokedex-page" v-if="pokemonRight">
          <div v-if="pokemonRightDetails && pokemonRightDetails.id !== undefined" class="pokemon-display">
            <div class="pokemon-image-" @mouseenter="initParticles($event, pokemonRightDetails.types)" @mouseleave="destroyParticles">
              <img v-if="pokemonRight.url" :src="getPokemonImage(pokemonRight.url)" :alt="pokemonRightDetails.name" class="pokemon-image">
              <span v-else>No Image URL</span>
              <div :id="'particles-right-' + currentIndex" class="particles-container"></div>
            </div>
            <div class="pokemon-details-">
              <h4>#{{ pokemonRightDetails.id.toString().padStart(3, '0') }} {{ capitalizeFirstLetter(pokemonRightDetails.name) }}</h4>
              <p>
                <strong>Type:</strong>
                <template v-if="pokemonRightDetails.types && pokemonRightDetails.types.length > 0">
                      <span
                          v-for="(type, index) in pokemonRightDetails.types"
                          :key="type"
                          :class="'type-' + type"
                      >
                          {{ capitalizeFirstLetter(type) }}{{ index < pokemonRightDetails.types.length - 1 ? ', ' : '' }}
                      </span>
                </template>
                <span v-else>N/A</span>
              </p>
              <p><strong>Height:</strong> {{ pokemonRightDetails.height ? (pokemonRightDetails.height / 10).toFixed(1) + ' m' : 'N/A' }}</p>
              <p><strong>Weight:</strong> {{ pokemonRightDetails.weight ? (pokemonRightDetails.weight / 10).toFixed(1) + ' kg' : 'N/A' }}</p>
              <p><strong>Abilities:</strong> {{ formatAbilities(pokemonRightDetails.abilities) }}</p>
              <div v-if="pokemonRightDetails.stats" class="pokemon-stats">
                <div class="stat-bar">
                  <label>HP:</label>
                  <progress :value="pokemonRightDetails.stats.hp" max="255"></progress>
                  <span>{{ pokemonRightDetails.stats.hp }}</span>
                </div>
                <div class="stat-bar">
                  <label>Attack:</label>
                  <progress :value="pokemonRightDetails.stats.attack" max="255"></progress>
                  <span>{{ pokemonRightDetails.stats.attack }}</span>
                </div>
                <div class="stat-bar">
                  <label>Defense:</label>
                  <progress :value="pokemonRightDetails.stats.defense" max="255"></progress>
                  <span>{{ pokemonRightDetails.stats.defense }}</span>
                </div>
              </div>
              <div v-else>Stats N/A</div>
              <p v-if="pokemonRightDetails.isLegendary" class="legendary-tag">★ Legendary</p>
              <p v-if="pokemonRightDetails.isMythical" class="mythical-tag">✦ Mythical</p>
            </div>
          </div>
          <div v-else class="loading-">
            Loading {{ pokemonRight.name ? capitalizeFirstLetter(pokemonRight.name) : 'Pokemon' }}...
          </div>
        </div>

      </div>
    </div>
    <div v-else class="loading-">
      Loading Pokémon List... (Ensure '@/assets/pokeApi.json' is valid)
    </div>

    <div v-if="pokemons && pokemons.length > 0" class="pokedex-navigation">
      <button class="nav-button" @click="prevPage" :disabled="currentIndex === 0">Previous</button>
      <button
          class="nav-button"
          @click="nextPage"
          :disabled="currentIndex >= pokemons.length - (isMobile ? 1 : (pokemons.length % 2 !== 0 && currentIndex === pokemons.length - 2 ? 1 : 2))"
      >
        Next
      </button>

      <div class="jump-to-container">
        <input
            type="number"
            v-model.number="jumpToId"
            min="1"
            :max="pokemons.length"
            placeholder="ID"
            @keyup.enter="jumpToPokemon"
            class="jump-input"
        >
        <button @click="jumpToPokemon" class="nav-button jump-button">Go</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import pokeApiData from "@/assets/pokeApi.json";

const pokemons = ref(pokeApiData.results || []);
const currentIndex = ref(0);
const isMobile = ref(false);

const pokemonLeft = computed(() => pokemons.value[currentIndex.value]);
const pokemonRight = computed(() => {
  const rightIndex = currentIndex.value + 1;
  if (!isMobile.value && rightIndex < pokemons.value.length) {
    return pokemons.value[rightIndex];
  }
  return null;
});


const pokemonLeftDetails = ref(null);
const pokemonRightDetails = ref(null);


const pokemonDetailsCache = ref({});

const activeParticles = ref([]);

const typeColors = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC'
};

const initParticles = (event, types) => {

  if (!types || types.length === 0) return;


  destroyParticles();
  const isLeft = event.currentTarget.closest('.pokedex-page:first-child') !== null;
  const id = isLeft ? `particles-left-${currentIndex.value}` : `particles-right-${currentIndex.value}`;

  const container = document.getElementById(id);
  if (container)
  {
    container.innerHTML = '';
  }

  const colors = types.map(type => typeColors[type] || '#FFFFFF');

  const config = {
    particles: {
      number: {
        value: 200,
        density: {
          enable: true,
          value_area: 800
        }
      },
      color: {
        value: colors.length > 1 ? colors : colors[0]
      },
      shape: {
        type: ['circle'],
        stroke: {
          width: 0,
          color: '#000000'
        },
        polygon: {
          nb_sides: 5
        }
      },
      opacity: {
        value: 0.7,
        random: true,
        anim: {
          enable: true,
          speed: 1,
          opacity_min: 0.3,
          sync: false
        }
      },
      size: {
        value: 6,
        random: true,
        anim: {
          enable: true,
          speed: 4,
          size_min: 6,
          sync: false
        }
      },
      line_linked: {
        enable: false,
        distance: 200,
        color: colors[0],
        opacity: 0.6,
        width: 1.5
      },
      move: {
        enable: true,
        speed: 7,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'bounce',
        bounce: true,
        attract: {
          enable: true,
          rotateX: 600,
          rotateY: 1200
        }
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: {
          enable: true,
          mode: ['grab','bubble']
        },
        onclick: {
          enable: false,
          mode: 'push'
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 200,
          line_linked: {
            opacity: 1
          }
        },
        push: {
          particles_nb: 15
        }
      }
    },
    retina_detect: true
  };

  const particleInstance = particlesJS(id,config);
  if(particleInstance)
  {
    activeParticles.value.push({
      id,
      instance: particleInstance
    });
  }

};

const destroyParticles = () => {
  if (activeParticles.value.length > 0) {
    activeParticles.value.forEach(particle => {
      const container = document.getElementById(particle.id);
      if (container) {
        container.innerHTML = '';
      }

      if (particle.instance.pJSDom && particle.instance.pJSDom[0]) {
        const pJS = particle.instance.pJSDom[0].pJS;
        if (pJS.fn && pJS.fn.checkAnimFrame) {
          cancelAnimationFrame(pJS.fn.checkAnimFrame);
        }
        pJS.particles = [];
        pJS.particles.array = [];
      }
    });

    activeParticles.value = [];
  }
  document.querySelectorAll('.particles-js-canvas-el').forEach(canvas => {
    canvas.remove();
  });
};


async function fetchPokemonDetails() {
  pokemonLeftDetails.value = null;
  pokemonRightDetails.value = null;

  try {
    const leftPoke = pokemonLeft.value;
    if (leftPoke) {
      if (pokemonDetailsCache.value[leftPoke.url]) {
        pokemonLeftDetails.value = pokemonDetailsCache.value[leftPoke.url];
      } else {
        console.log(`Workspaceing details for: ${leftPoke.name}`);
        const response = await fetch(leftPoke.url);
        if (!response.ok) throw new Error(`Failed to fetch ${leftPoke.name}`);
        const data = await response.json();

        let speciesData = {};
        if(data.species?.url)
        {
          const speciesResponse = await fetch(data.species.url);
          if(speciesResponse.ok){
            speciesData = await   speciesResponse.json();
          }
        }

        const details = {
          id: data.id,
          name: data.name,
          url: leftPoke.url,
          types: data.types?.map(t => t.type.name) || [],
          height: data.height || 0,
          weight: data.weight || 0,
          abilities: data.abilities || [],
          stats: {
            hp: data.stats?.find(s => s.stat.name === 'hp')?.base_stat || 0,
            attack: data.stats?.find(s => s.stat.name === 'attack')?.base_stat || 0,
            defense: data.stats?.find(s => s.stat.name === 'defense')?.base_stat || 0,
          },
          isLegendary: speciesData.is_legendary,
          isMythical: speciesData.is_mythical
        };
        pokemonDetailsCache.value[leftPoke.url] = details;
        pokemonLeftDetails.value = details;
      }
    }

    const rightPoke = pokemonRight.value;
    if (rightPoke) {
      if (pokemonDetailsCache.value[rightPoke.url]) {
        pokemonRightDetails.value = pokemonDetailsCache.value[rightPoke.url];
      } else {
        console.log(`Workspaceing details for: ${rightPoke.name}`);
        const response = await fetch(rightPoke.url);
        if (!response.ok) throw new Error(`Failed to fetch ${rightPoke.name}`);
        const data = await response.json();

        let speciesData = {};
        if(data.species?.url)
        {
          const speciesResponse = await fetch(data.species.url);
          if(speciesResponse.ok){
            speciesData = await   speciesResponse.json();
          }
        }

        const details = {
          id: data.id,
          name: data.name,
          url: rightPoke.url,
          types: data.types?.map(t => t.type.name) || [],
          height: data.height || 0,
          weight: data.weight || 0,
          abilities: data.abilities || [],
          stats: {
            hp: data.stats?.find(s => s.stat.name === 'hp')?.base_stat || 0,
            attack: data.stats?.find(s => s.stat.name === 'attack')?.base_stat || 0,
            defense: data.stats?.find(s => s.stat.name === 'defense')?.base_stat || 0,
          },
          isLegendary: speciesData.is_legendary,
          isMythical: speciesData.is_mythical
        };
        pokemonDetailsCache.value[rightPoke.url] = details;
        pokemonRightDetails.value = details;
      }
    }
  } catch (error) {
    console.error('Error fetching Pokémon details:', error);
  }
}

function nextPage() {
  const step = isMobile.value ? 1 : 2;
  const maxIndex = pokemons.value.length - (isMobile.value ? 1 : 2);
  if (currentIndex.value < maxIndex) {
    currentIndex.value += step;
  } else {
    if (!isMobile.value && currentIndex.value === pokemons.value.length - 2 && pokemons.value.length % 2 !== 0) {
      currentIndex.value += 1;
    } else {
      currentIndex.value = maxIndex;
    }
  }

  if (currentIndex.value >= pokemons.value.length - (isMobile.value ? 0 : 1)) {
    currentIndex.value = pokemons.value.length - (isMobile.value ? 1 : (pokemons.value.length % 2 === 0 ? 2: 1));
  }
}

function prevPage() {
  const step = isMobile.value ? 1 : 2;
  currentIndex.value = Math.max(0, currentIndex.value - step);
}


const extractIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.match(/\/(\d+)\/?$/);
  return parts ? parts[1] : null;
};

const getPokemonImage = (url) => {
  const id = extractIdFromUrl(url);
  if (!id) return '';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};


function checkIfMobile() {
  const mobileCheck = window.innerWidth <= 768;
  if (mobileCheck !== isMobile.value) {
    isMobile.value = mobileCheck;
    if (isMobile.value && currentIndex.value % 2 !== 0) {
    }
    fetchPokemonDetails();
  }
}

onMounted(() => {
  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkIfMobile);
});


function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}


function formatAbilities(abilities) {
  if (!abilities || !abilities.length) return 'N/A';
  return abilities.map(abilityInfo =>
      capitalizeFirstLetter(abilityInfo.ability?.name.replace('-', ' ') || '')
  ).join(', ');
}


watch(currentIndex, fetchPokemonDetails, { immediate: true });

const jumpToId = ref('');

function jumpToPokemon()
{
  if (!jumpToId.value || isNaN(jumpToId.value)) return;
  const id = Math.max(1,Math.min(Number(jumpToId.value),pokemons.value.length));

  const foundIndex = pokemons.value.findIndex(p=>{
    const pokemonId = extractIdFromUrl(p.url);
    return pokemonId && Number(pokemonId) ===id;
  });

  if (foundIndex!==-1)
  {
    currentIndex.value=foundIndex;
    jumpToId.value = '';
  }
}


</script>
<style>

</style>