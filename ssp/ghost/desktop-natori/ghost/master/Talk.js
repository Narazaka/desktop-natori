const r = String.raw;

class Talk {
    constructor() {
        this.talking = false;
    }

    talk(str) {
        return r`\![sound,stop]\![raise,OnTalkStart]${str}\_V\![raise,OnTalkEnd]\e`;
    }

    talkNoWait(str) {
        return r`\![sound,stop]\![raise,OnTalkStart]${str}\![raise,OnTalkEnd]\e`;
    }
}

module.exports = { Talk };
