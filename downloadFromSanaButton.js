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
    downloadVoiceCategories(voiceCategories).then(() => console.warn("all done."));
});

/**
 * @typedef VoiceCategory
 * @prop {string} category
 * @prop {string[]} voiceFileNames
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
            category = $elem.text();
            voiceCategories.push({category, voiceFileNames: []});
        } else if ($elem.is("button")) {
            const file = $elem.data("file");
            if (!file) return;
            voiceCategories[voiceCategories.length - 1].voiceFileNames.push(file);
        }
    }

    $("body").children().each(fetchSingle);
    $("body font").children().each(fetchSingle);

    return voiceCategories.filter(vc => vc.voiceFileNames.length);
}


/**
 * @param {VoiceCategory[]} voiceCategories
 */
async function downloadVoiceCategories(voiceCategories) {
    const total = voiceCategories.map(vc => vc.voiceFileNames.length).reduce((sum, len) => sum + len, 0);
    let index = 0;
    for (const voiceCategory of voiceCategories) {
        for (const voiceFileName of voiceCategory.voiceFileNames) {
            ++index;
            try{
                await downloadVoice(voiceCategory.category, voiceFileName, index, total);
            } catch (error) {
                console.error(error);
            }
        }
    }
}

/**
 * @param {string} category
 * @param {string} voiceFileName
 */
async function downloadVoice(category, voiceFileName, index, total) {
    const mp3Url = `${sanaButtonUrl}${voiceFileName}.mp3`;
    const mp3Path = voiceRootPath.join(`${excapeChars(voiceFileName)}.mp3`);
    process.stderr.write(`(${index} / ${total}) [${category}] ${mp3Url} -> ${mp3Path}`);
    if (mp3Path.existsSync()) {
        console.warn(" skip.");
        await wait(0.01);
        return;
    }
    const mp3 = await fetch(encodeURI(mp3Url));
    if (!mp3.ok) throw new Error(mp3.statusText);
    await mp3Path.parent().mkdirAll();
    await mp3Path.writeFile(await mp3.buffer());
    console.warn(" done.");
    await wait(0.4);
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
        voices: voiceCategory.voiceFileNames.map((voiceFileName) => ({
            name: path.basename(voiceFileName),
            path: voiceRelativePath.join(`${excapeChars(voiceFileName)}.mp3`).path,
        })),
    }));
}

/**
 * @param {VoiceCategory[]} voiceCategories
 */
function genCategories(voiceCategories) {
    const kisLines = ["=kis"];
    for (const voiceCategory of voiceCategories) {
        for (const voiceFileName of voiceCategory.voiceFileNames) {
            kisLines.push(`setstr "voice.${voiceCategory.category}.${path.basename(voiceFileName)}" "${voiceRelativePath.join(`${voiceFileName}.mp3`)}";`);
        }
    }
    kisLines.push("=end");
    return kisLines.map(line => `${line}\n`).join("");
}

/**
 * @param {string} str
 */
function excapeChars(str) {
    return str.replace(/♡/g, "__heart__");
}

/**
 * @param {number} sec
 */
const wait = (sec) => new Promise((resolve) => setTimeout(resolve, sec * 1000));
