const { voice } = require("./Voice");
const r = String.raw;

const voiceChoicePageAmount = 50;
const sanaButtonUrl = "http://sanabutton.ojaru.jp/";

const marker = (flag) => flag ? r`\![*]` : "  ";

const setup = (events, talk, aitalk) => {
    events.OnMenu = () => {
        const lines = [
            r`\b[2]` +
            voice.byCategory("看護の日…とは言ったものの", "あいー") +
            r`\_q` +
            r`\f[bold,1]■メニュー■\f[bold,default]`,
            r`\![*]\q[しゃべる間隔 ${aitalk.interval > 0 ? `${aitalk.interval}秒` : "自動でしゃべらない"},OnSettingInterval]`,
            r`\![*]\q[しゃべるカテゴリ,OnSettingExcludeCategories]`,
            r`---------------------------`,
        ];
        for (const category of voice.voiceCategories) {
            lines.push(r`\![*]\q[${category.category},OnMenuTalkCategory,1,${category.category}]`);
        }
        lines.push(r`---------------------------`);
        lines.push(r`\q[さなボタン本家,OnOpenSanaButton]`);
        lines.push(r`\q[説明,OnDescription]`);
        lines.push(r`---------------------------`);
        lines.push(r`\q[キャンセル,OnMenuCancel]`);
        lines.push(r`---------------------------`);
        lines.push(r`\q[終了,OnClose]`);
        return talk.talkNoWait(lines.join(r`\n`));
    };

    events.OnSettingInterval = () => talk.talkNoWait([
        r`\b[2]` +
        voice.byCategory("ってね ふんふん つぎつぎ ややや", "ふんふん10") +
        r`\_q` +
        r`\f[bold,1]■しゃべる間隔■\f[bold,default]`,
        r`${marker(aitalk.interval === 10)}\q[10秒,OnSettingIntervalChange,10]`,
        r`${marker(aitalk.interval === 30)}\q[30秒,OnSettingIntervalChange,30]`,
        r`${marker(aitalk.interval === 60)}\q[1分,OnSettingIntervalChange,60]`,
        r`${marker(aitalk.interval === 120)}\q[2分,OnSettingIntervalChange,120]`,
        r`${marker(aitalk.interval === 300)}\q[5分,OnSettingIntervalChange,300]`,
        r`${marker(aitalk.interval === 600)}\q[10分,OnSettingIntervalChange,600]`,
        r`${marker(aitalk.interval === 0)}\q[自動でしゃべらない,OnSettingIntervalChange,0]`,
        r`---------------------------`,
        r`\q[戻る,OnMenu]`,
    ].join(r`\n`));
    /**
     * @param {{request: import("shiorijk").Message.Request}} request
     */
    events.OnSettingIntervalChange = ({request}) => {
        aitalk.interval = Number(request.headers.Reference(0));
        aitalk.saveSetting();
        return talk.talkNoWait(r`\![raise,OnSettingInterval]`);
    }

    events.OnSettingExcludeCategories = () => talk.talkNoWait([
        r`\b[2]` +
        voice.byCategory("ってね ふんふん つぎつぎ ややや", "ふんふん10") +
        r`\_q` +
        r`\f[bold,1]■しゃべるカテゴリ■\f[bold,default]`,
        ...voice.categories.map((category) =>
            r`${aitalk.isExclude(category) ? r`OFF` : r`ON `} \q[${category},OnSettingExcludeCategoryChange,${category}]`
        ),
        r`---------------------------`,
        r`\q[戻る,OnMenu]`,
    ].join(r`\n`));
    /**
     * @param {{request: import("shiorijk").Message.Request}} request
     */
    events.OnSettingExcludeCategoryChange = ({request}) => {
        aitalk.toggleExclude(request.headers.Reference(0));
        aitalk.saveSetting();
        return talk.talkNoWait(r`\![raise,OnSettingExcludeCategories]`);
    }
    /**
     * @param {{request: import("shiorijk").Message.Request}} request
     */
    events.OnMenuTalkCategory = ({request}) => {
        // 1 origin
        const currentPage = Number(request.headers.Reference(0));
        const categoryName = request.headers.Reference(1);
        const voiceName = request.headers.Reference(2);
        const category = voice.category(categoryName);
        const lines = [
            (voiceName ? voice.byCategory(categoryName, voiceName) : "") +
            r`\b[2]` +
            r`\_q` +
            r`\f[bold,1]■${categoryName}■\f[bold,default]` +
            r` \q[戻る,OnMenu]`,
            r`---------------------------`,
        ];
        const voices = category.voices;
        const maxPage = Math.ceil(voices.length / voiceChoicePageAmount);
        const needPagenate = maxPage > 1;
        const pageStartIndex = (currentPage - 1) * voiceChoicePageAmount;
        const pageEndIndex = currentPage * voiceChoicePageAmount;
        const pageVoices = voices.slice(pageStartIndex, pageEndIndex);
        const voiceChoices = [];
        for (const voice of pageVoices) {
            voiceChoices.push(r`\![*]\_a[OnMenuTalkCategory,${currentPage},${categoryName},${voice.name}]${voice.name}\_a`);
        }
        lines.push(voiceChoices.join("　"));
        if (needPagenate) {
            lines.push(r`---------------------------`);
            const buttons = [];
            for (let page = 1; page <= maxPage; ++page) {
                if (currentPage === page) {
                    buttons.push(r`[${page}]`);
                } else {
                    buttons.push(r`\q[${page},OnMenuTalkCategory,${page},${category.category}]`);
                }
            }
            lines.push(" " + buttons.join(" "));
        }
        return talk.talkNoWait(lines.join(r`\n`));
    }

    events.OnOpenSanaButton = () => r`\![open,browser,${sanaButtonUrl}]\![raise,OnMenu]\e`;
    events.OnDescription = () => [
        r`\_q\f[bold,1]■説明■\f[bold,default]`,
        r`さなボタンを自動再生して捗りたかった`,
        r`名取～`,
        r`---------------------------`,
        r`機能`,
        r`\![*]自動でランダムにさなボタン再生する`,
        r`\![*]ダブルクリックでランダムにさなボタン再生する`,
        r`\![*]メニューから個別にさなボタン再生する`,
        r`---------------------------`,
        r`\q[戻る,OnMenu]`,
    ].join(r`\n`);
};

module.exports = { setup };
