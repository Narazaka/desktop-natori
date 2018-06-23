const { FileSystemObject } = require("fso");
const { voice } = require("./Voice");
const r = String.raw;

const saveFile = new FileSystemObject("save.json");

/**
 * @typedef AITalkSetting
 * @prop {number} interval
 * @prop {string[]} excludeCategories
 */

 /** @class */
class AITalk {
    static loadSetting() {
        if (!saveFile.existsSync()) return new AITalk();
        return new AITalk(JSON.parse(saveFile.readFileSync("utf8")));
    }

    /**
     * @param {AITalkSetting} setting
     */
    constructor(setting) {
        this.setting = setting || { interval: 10, excludeCategories: [] };
        this.count = 0;
    }

    saveSetting() {
        saveFile.writeFileSync(JSON.stringify(this.setting));
    }

    get interval() { return this.setting.interval; }
    set interval(value) {
        this.setting.interval = value;
        this.count = -1;
    }

    isExclude(name) {
        return this.setting.excludeCategories.indexOf(name) !== -1;
    }

    toggleExclude(name) {
        const index = this.setting.excludeCategories.indexOf(name);
        if (index === -1) {
            this.setting.excludeCategories.push(name);
        } else {
            this.setting.excludeCategories.splice(index, 1);
        }
    }

    addExclude(name) {
        if (!this.isExclude(name)) {
            this.setting.excludeCategories.push(name);
        }
    }

    removeExclude(name) {
        const index = this.setting.excludeCategories.indexOf(name);
        if (index !== -1) {
            this.setting.excludeCategories.splice(index, 1);
        }
    }

    countUp() {
        if (this.interval === 0) return;
        ++this.count;
    }

    get canTalk() {
        return this.interval <= this.count;
    }

    talk() {
        this.count = 0;
        const choosed = voice.random(this.setting.excludeCategories);
        return r`\_v[${choosed.path}]\b[-1]\_V`;
    }
}

module.exports = { AITalk };
