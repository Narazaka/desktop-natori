const r = String.raw;

/**
 * @typedef VoiceCategory
 * @prop {string} category
 * @prop {Array<{name: string; path: string}>} voices
 */

class Voice {
    /**
     * @param {VoiceCategory[]} voiceCategories
     */
    constructor(voiceCategories) {
        this.voiceCategories = voiceCategories;
    }

    get categories() {
        return this.voiceCategories.map((vc) => vc.category);
    }

    category(category) {
        return this.voiceCategories
        .find((voiceCategory) => voiceCategory.category === category);
    }

    /**
     * @param {string} category
     * @param {string} name
     */
    byCategory(category, name) {
        const voicePath = this.voiceCategories
        .find((voiceCategory) => voiceCategory.category === category)
        .voices
        .find((voice) => voice.name === name)
        .path;

        return r`\_v[${voicePath}]`;
    }

    /**
     * @param {string[]} excludeCategories
     */
    random(excludeCategories) {
        const categories =
            excludeCategories.length ?
            this.voiceCategories.filter(vc => -1 === excludeCategories.indexOf(vc.category)) :
            this.voiceCategories;
        const voices = [];
        for (const category of categories) {
            voices.push(...category.voices);
        }
        return voices[Math.floor(Math.random() * voices.length)];
    }
}

const voiceCategories = require("./voices.json");
const voice = new Voice(voiceCategories);

module.exports = { Voice, voice };
