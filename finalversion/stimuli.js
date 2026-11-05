// Experiment 2 Replication Stimuli
// Based on Li, Wang, & Lin (2017), Experiment 2.

const criticalStimuli = [
  {
    color_name: "red",
    conditions: {
      congruent_color_character: { character: "红", pinyin: "hong2", translation: "red", ink_color: "red" },
      congruent_S_T_plus: { character: "洪", pinyin: "hong2", translation: "flood", ink_color: "red" },
      congruent_S_plus_T_minus: { character: "轰", pinyin: "hong1", translation: "boom", ink_color: "red" },
      congruent_S_minus_T_plus: { character: "瓶", pinyin: "ping2", translation: "bottle", ink_color: "red" },
      neutral: { character: "牵", pinyin: "qian1", translation: "lead along", ink_color: "red" },
      incongruent_color_character: { character: "红", pinyin: "hong2", translation: "red", ink_color: "blue" }
    }
  },
  {
    color_name: "yellow",
    conditions: {
      congruent_color_character: { character: "黄", pinyin: "huang2", translation: "yellow", ink_color: "yellow" },
      congruent_S_T_plus: { character: "皇", pinyin: "huang2", translation: "emperor", ink_color: "yellow" },
      congruent_S_plus_T_minus: { character: "晃", pinyin: "huang4", translation: "sway", ink_color: "yellow" },
      congruent_S_minus_T_plus: { character: "缠", pinyin: "chan2", translation: "wrap around", ink_color: "yellow" },
      neutral: { character: "趁", pinyin: "chen4", translation: "take advantage of", ink_color: "yellow" },
      incongruent_color_character: { character: "黄", pinyin: "huang2", translation: "yellow", ink_color: "green" }
    }
  },
  {
    color_name: "blue",
    conditions: {
      congruent_color_character: { character: "蓝", pinyin: "lan2", translation: "blue", ink_color: "blue" },
      congruent_S_T_plus: { character: "婪", pinyin: "lan2", translation: "greedy", ink_color: "blue" },
      congruent_S_plus_T_minus: { character: "览", pinyin: "lan3", translation: "view", ink_color: "blue" },
      congruent_S_minus_T_plus: { character: "尝", pinyin: "chang2", translation: "taste", ink_color: "blue" },
      neutral: { character: "宫", pinyin: "gong1", translation: "palace", ink_color: "blue" },
      incongruent_color_character: { character: "蓝", pinyin: "lan2", translation: "blue", ink_color: "red" }
    }
  },
  {
    color_name: "green",
    conditions: {
      congruent_color_character: { character: "绿", pinyin: "lv4", translation: "green", ink_color: "green" },
      congruent_S_T_plus: { character: "虑", pinyin: "lv4", translation: "ponder", ink_color: "green" },
      congruent_S_plus_T_minus: { character: "旅", pinyin: "lv3", translation: "travel", ink_color: "green" },
      congruent_S_minus_T_plus: { character: "洞", pinyin: "dong4", translation: "hole", ink_color: "green" },
      neutral: { character: "涂", pinyin: "tu2", translation: "paint", ink_color: "green" },
      incongruent_color_character: { character: "绿", pinyin: "lv4", translation: "green", ink_color: "yellow" }
    }
  }
];

const fillerStimuli = [
  [
    { character: "书", pinyin: "shu1", translation: "book", ink_color: "red" },
    { character: "山", pinyin: "shan1", translation: "mountain", ink_color: "yellow" },
    { character: "水", pinyin: "shui3", translation: "water", ink_color: "blue" },
    { character: "门", pinyin: "men2", translation: "door", ink_color: "green" },
    { character: "车", pinyin: "che1", translation: "car", ink_color: "red" },
    { character: "花", pinyin: "hua1", translation: "flower", ink_color: "yellow" },
    { character: "月", pinyin: "yue4", translation: "moon", ink_color: "blue" },
    { character: "手", pinyin: "shou3", translation: "hand", ink_color: "green" },
    { character: "云", pinyin: "yun2", translation: "cloud", ink_color: "red" },
    { character: "风", pinyin: "feng1", translation: "wind", ink_color: "yellow" },
    { character: "鸟", pinyin: "niao3", translation: "bird", ink_color: "blue" },
    { character: "鱼", pinyin: "yu2", translation: "fish", ink_color: "green" },
    { character: "家", pinyin: "jia1", translation: "home", ink_color: "red" },
    { character: "路", pinyin: "lu4", translation: "road", ink_color: "yellow" },
    { character: "窗", pinyin: "chuang1", translation: "window", ink_color: "blue" },
    { character: "树", pinyin: "shu4", translation: "tree", ink_color: "green" },
    { character: "雨", pinyin: "yu3", translation: "rain", ink_color: "red" },
    { character: "桥", pinyin: "qiao2", translation: "bridge", ink_color: "yellow" },
    { character: "纸", pinyin: "zhi3", translation: "paper", ink_color: "blue" },
    { character: "茶", pinyin: "cha2", translation: "tea", ink_color: "green" },
    { character: "灯", pinyin: "deng1", translation: "lamp", ink_color: "red" },
    { character: "城", pinyin: "cheng2", translation: "city", ink_color: "yellow" },
    { character: "船", pinyin: "chuan2", translation: "boat", ink_color: "blue" },
    { character: "石", pinyin: "shi2", translation: "stone", ink_color: "green" }
  ],
  [
    { character: "猫", pinyin: "mao1", translation: "cat", ink_color: "red" },
    { character: "狗", pinyin: "gou3", translation: "dog", ink_color: "yellow" },
    { character: "马", pinyin: "ma3", translation: "horse", ink_color: "blue" },
    { character: "米", pinyin: "mi3", translation: "rice", ink_color: "green" },
    { character: "笔", pinyin: "bi3", translation: "pen", ink_color: "red" },
    { character: "桌", pinyin: "zhuo1", translation: "table", ink_color: "yellow" },
    { character: "椅", pinyin: "yi3", translation: "chair", ink_color: "blue" },
    { character: "房", pinyin: "fang2", translation: "room", ink_color: "green" },
    { character: "球", pinyin: "qiu2", translation: "ball", ink_color: "red" },
    { character: "钟", pinyin: "zhong1", translation: "clock", ink_color: "yellow" },
    { character: "河", pinyin: "he2", translation: "river", ink_color: "blue" },
    { character: "海", pinyin: "hai3", translation: "sea", ink_color: "green" },
    { character: "脸", pinyin: "lian3", translation: "face", ink_color: "red" },
    { character: "饭", pinyin: "fan4", translation: "meal", ink_color: "yellow" },
    { character: "电", pinyin: "dian4", translation: "electricity", ink_color: "blue" },
    { character: "影", pinyin: "ying3", translation: "shadow/movie", ink_color: "green" },
    { character: "衣", pinyin: "yi1", translation: "clothing", ink_color: "red" },
    { character: "星", pinyin: "xing1", translation: "star", ink_color: "yellow" },
    { character: "草", pinyin: "cao3", translation: "grass", ink_color: "blue" },
    { character: "雪", pinyin: "xue3", translation: "snow", ink_color: "green" },
    { character: "耳", pinyin: "er3", translation: "ear", ink_color: "red" },
    { character: "口", pinyin: "kou3", translation: "mouth", ink_color: "yellow" },
    { character: "心", pinyin: "xin1", translation: "heart", ink_color: "blue" },
    { character: "田", pinyin: "tian2", translation: "field", ink_color: "green" }
  ]
];

const practiceCharacterItems = [
  { character: "日", pinyin: "ri4" },
  { character: "木", pinyin: "mu4" },
  { character: "人", pinyin: "ren2" },
  { character: "火", pinyin: "huo3" }
];

const practiceColorItems = [
  { character: "日", ink_color: "red" },
  { character: "木", ink_color: "green" },
  { character: "人", ink_color: "yellow" },
  { character: "火", ink_color: "blue" }
];
