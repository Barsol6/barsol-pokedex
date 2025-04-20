import { defineStore } from 'pinia';

export const usePokeSearch = defineStore("pokeSearch",{
    state: () =>({
            pokeForm: {
                pokeName: "",
            },
        }),
});

