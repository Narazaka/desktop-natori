const fetch = require("node-fetch").default;
const FileSystemObject = require("fso").FileSystemObject;
const JSZip = require("jszip");

const sspRoot = new FileSystemObject("ssp");
const toRemoves = [
    sspRoot.join("balloon/emily4"),
    sspRoot.join("calendar"),
    sspRoot.join("ghost/emily4"),
    sspRoot.join("headline"),
    sspRoot.join("plugin"),
];

async function extractSsp() {
    const res = await fetch("http://sspnormal.shillest.net/archive/ssp_2_4_23f.exe");
    if (!res.ok) throw new Error(res.statusText);
    const zip = await JSZip.loadAsync(await res.buffer());
    const paths = [];
    zip.forEach((relpath, file) => {
        paths.push(relpath);
    });
    for (const filepath of paths) {
        const file = zip.file(filepath);
        console.log(filepath);
        if (!file || file.dir) {
            sspRoot.join(filepath).mkdirAllSync();
        } else {
            const buf = await file.async("nodebuffer");
            const fpath = sspRoot.join(filepath);
            fpath.parent().mkdirAllSync();
            fpath.writeFileSync(buf);
        }
    }
}

function removeFiles() {
    for (const toRemove of toRemoves) {
        toRemove.rmAllSync();
        toRemove.rmdirSync();
    }
}

async function main() {
    await extractSsp();
    removeFiles();
}

main();
