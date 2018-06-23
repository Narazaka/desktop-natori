const { voice } = require("./Voice");
const r = String.raw;

const bustTalks = [
    voice.byCategory("看護の日…とは言ったものの", "ナイチチゲール01"),
    voice.byCategory("看護の日…とは言ったものの", "ナイチチゲール03"),
    voice.byCategory("名取と共に地獄に叩き落される", "ナイチチゲール01"),
    voice.byCategory("名取と共に地獄に叩き落される", "きょにゅにゅにゅにゅ"),
    voice.byCategory("名取と共に地獄に叩き落される", "巨乳コラボ"),
    voice.byCategory("名取と共に地獄に叩き落される", "巨乳コラボ？"),
    voice.byCategory("名取と共に地獄に叩き落される", "罪を数えろ"),
    voice.byCategory("汚い(?)さなちゃん", "胸のサイズ"),
    voice.byCategory("汚い(?)さなちゃん", "写真より胸"),
    voice.byCategory("GW振り返り配信", "声と胸小さい"),
];

const randomBustTalk = () => bustTalks[Math.floor(Math.random() * bustTalks.length)];
module.exports = {randomBustTalk};
