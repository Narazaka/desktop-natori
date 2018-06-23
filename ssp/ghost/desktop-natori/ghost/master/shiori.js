const { SanaShioriBuilder } = require("sanajk");
const { voice } = require("./Voice");
const { AITalk } = require("./AITalk");
const { Talk } = require("./Talk");
const { randomBustTalk } = require("./bustTalks");
const menu = require("./menu");

const builder = new SanaShioriBuilder().useDefaults({save: "save.json"});
builder.state.defaultHeaders.Charset = "UTF-8";
builder.state.defaultHeaders.Sender = "名取";
const events = builder.state.events;
const r = String.raw;
const talk = new Talk();
const aiTalk = AITalk.loadSetting();

events.version = () => "0.1.1";
events.name = () => "SanaJK";
events.craftman = () => "Narazaka";
events.craftmanw = () => "奈良阪";
events.OnBoot = () => talk.talk(r`\1\s[10]\0\s[0]${voice.byCategory("すこすこのすこ！　おはようございなーす！ くぅ～", "おはようございなーす06")}`);
events.OnClose = () => talk.talkNoWait(r`\1\s[10]\0\s[0]${voice.byCategory("笑い声 あいあい～", "あいあい06")}\_V\-`);
events.OnBalloonBreak = () => { talk.talking = false; }
events.OnBalloonClose = () => { talk.talking = false; }
events.OnTalkStart = () => { talk.talking = true; }
// events.OnTalkEnd = () => { talk.talking = false; }
events.OnSoundStop = () => { talk.talking = false; }
/**
 * @param {{request: import("shiorijk").Message.Request}} req
 */
events.OnSecondChange = ({request}) => {
    const cantalk = request.headers.Reference(3) && !talk.talking;
    if (cantalk) aiTalk.countUp();
    if (aiTalk.canTalk) return talk.talk(aiTalk.talk());
}
/**
 * @param {{request: import("shiorijk").Message.Request}} req
 */
events.OnMouseDoubleClick = ({request}) => {
    if (Number(request.headers.Reference(5))) return; // 右=1
    const target = request.headers.Reference(4);
    if (target === "bust") return talk.talk(randomBustTalk());
    return talk.talk(aiTalk.talk());
};
/**
 * @param {{request: import("shiorijk").Message.Request}} req
 */
events.OnMouseClick = ({request}) => {
    const direction = {0: "left", 1: "right", 2: "middle"}[request.headers.Reference(5)];
    const target = request.headers.Reference(4);
    if (direction === "right") return talk.talk(r`\![raise,OnMenu]`);
};
menu.setup(events, talk, aiTalk);

module.exports = builder.build();
