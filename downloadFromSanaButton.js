// @ts-check
const client = require("cheerio-httpcli");
const fetch = require("node-fetch").default;
const FileSystemObject = require("fso").FileSystemObject;
const path = require("path");

const sanaButtonUrl = "http://sanabutton.ojaru.jp/";
const ghostMasterPath = new FileSystemObject("./ssp/ghost/desktop-natori/ghost/master");
const voiceRootPath = ghostMasterPath.join("voices");
const voiceRelativePath = ghostMasterPath.relative(voiceRootPath);

client.set("browser", "chrome");

client.fetch(sanaButtonUrl, (error, $) => {
    if (error) throw error;
    const voiceCategories = fetchVoiceCategories($);
    writeCategories(voiceCategories);
    downloadVoiceCategories(voiceCategories)
        .then(() => deleteUntrackedFiles(voiceCategories))
        .then(() => console.warn("all done."));
});

/**
 * @typedef VoiceCategory
 * @prop {string} category
 * @prop {Voice[]} voices
 */

 /**
  * @typedef Voice
  * @prop {string} name
  * @prop {string} dataName
  * @prop {string} mp3Url
  * @prop {FileSystemObject} mp3Path
  * @prop {string} mp3RelativePath
  */

/**
 * @param {import("cheerio-httpcli").CheerioStaticEx} $
 */
function fetchVoiceCategories($) {
    let category = "";
    /** @type {VoiceCategory[]} */
    const voiceCategories = [];

    function fetchSingle(_, elem) {
        const $elem = $(elem);
        if ($elem.is("b")) {
            category = `${$elem.text()}`.replace(/^[ 　]+/, "").replace(/[ 　]+$/, "");
            voiceCategories.push({category, voices: []});
        } else if ($elem.is("button")) {
            const dataName = $elem.data("file");
            if (!dataName) return;
            const name = path.basename(dataName);
            const mp3Url = `${sanaButtonUrl}${dataName}.mp3`;
            const escapedFileName = `${excapeChars(dataName)}.mp3`;
            const mp3Path = voiceRootPath.join(escapedFileName);
            const mp3RelativePath = voiceRelativePath.join(escapedFileName).path;
            voiceCategories[voiceCategories.length - 1].voices.push({
                name,
                dataName,
                mp3Url,
                mp3Path,
                mp3RelativePath,
            });
        }
    }

    $("body").children().each(fetchSingle);
    $("body font").children().each(fetchSingle);

    return voiceCategories.filter(vc => vc.voices.length);
}


/**
 * @param {VoiceCategory[]} voiceCategories
 */
async function downloadVoiceCategories(voiceCategories) {
    const total = voiceCategories.map(vc => vc.voices.length).reduce((sum, len) => sum + len, 0);
    let index = 0;
    for (const voiceCategory of voiceCategories) {
        for (const voice of voiceCategory.voices) {
            ++index;
            try{
                await downloadVoice(voiceCategory.category, voice, index, total);
            } catch (error) {
                console.error(error);
            }
        }
    }
}

/**
 * @param {string} category
 * @param {Voice} voice
 */
async function downloadVoice(category, voice, index, total) {
    process.stderr.write(`(${index} / ${total}) [${category}] ${voice.mp3Url} -> ${voice.mp3Path}`);
    if (voice.mp3Path.existsSync()) {
        console.warn(" skip.");
        await wait(0.01);
        return;
    }
    const mp3 = await fetch(encodeURI(voice.mp3Url));
    if (!mp3.ok) throw new Error(mp3.statusText);
    await voice.mp3Path.parent().mkdirAll();
    await voice.mp3Path.writeFile(await mp3.buffer());
    console.warn(" done.");
    await wait(0.4);
}

/**
 * @param {VoiceCategory[]} voiceCategories
 */
async function deleteUntrackedFiles(voiceCategories) {
    const children = await voiceRootPath.childrenAll();
    /** @type {{[name: string]: boolean}} */
    const allVoiceFileNames = {};
    for (const voiceCategory of voiceCategories) {
        for (const voice of voiceCategory.voices) {
            allVoiceFileNames[path.normalize(voice.mp3Path.path)] = true;
        }
    }
    for (const child of children) {
        if (child.extname() !== ".mp3") continue;
        if (!allVoiceFileNames[child.path]) {
            console.warn(`delete untracked file [${child}]`);
            await child.unlink();
        }
    }
}

/**
 * @param {VoiceCategory[]} voiceCategories
 */
function writeCategories(voiceCategories) {
    ghostMasterPath.join("voices.json").writeFileSync(JSON.stringify(genCategoriesObj(voiceCategories), null, "  "));
}

/**
 * @param {VoiceCategory[]} voiceCategories
 */
function genCategoriesObj(voiceCategories) {
    return voiceCategories.map((voiceCategory) => ({
        category: voiceCategory.category,
        voices: voiceCategory.voices.map((voice) => ({
            name: voice.name,
            path: voice.mp3RelativePath,
        })),
    }));
}

/**
 * @param {string} str
 */
function excapeChars(str) {
    return str.replace(/♡/g, "__heart__").replace(/\u200b/g, "");
}

/**
 * @param {number} sec
 */
const wait = (sec) => new Promise((resolve) => setTimeout(resolve, sec * 1000));
