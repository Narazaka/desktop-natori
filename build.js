const JSZip = require("jszip");
const FileSystemObject = require("fso").FileSystemObject;

const sspRoot = new FileSystemObject("ssp");

const zip = new JSZip();
for (const child of sspRoot.childrenAllSync()) {
    if (child.isDirectorySync()) continue;
    zip.file(child.path, child.readFileSync());
}
zip.generateAsync({type: "nodebuffer"}).then((data) => new FileSystemObject("desktop-natori-ssp.zip").writeFileSync(data));
