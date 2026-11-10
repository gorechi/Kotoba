import type { Card, Deck } from '../types'
import { freshSrs } from '../lib/srs'

export const N5_KANJI_PACK_ID = 'kanji-n5'
export const N5_KANJI_DECK_ID = 'kanji-n5'

interface N5KanjiEntry {
  kanji: string
  /** [кана, ромадзи] */
  readings: [string, string][]
  /** [слово, ромадзи] */
  examples: [string, string][]
}

const N5_KANJI: N5KanjiEntry[] = [
  {
    kanji: '日',
    readings: [['にち', 'nichi'], ['ひ', 'hi']],
    examples: [['日本', 'nihon'], ['日曜日', 'nichiyoubi']],
  },
  {
    kanji: '一',
    readings: [['いち', 'ichi'], ['ひと', 'hito']],
    examples: [['一つ', 'hitotsu'], ['一人', 'hitori']],
  },
  {
    kanji: '国',
    readings: [['こく', 'koku'], ['くに', 'kuni']],
    examples: [['外国', 'gaikoku'], ['中国', 'chuugoku']],
  },
  {
    kanji: '会',
    readings: [['かい', 'kai'], ['あう', 'au']],
    examples: [['会社', 'kaisha'], ['会う', 'au']],
  },
  {
    kanji: '人',
    readings: [['じん', 'jin'], ['にん', 'nin'], ['ひと', 'hito']],
    examples: [['日本人', 'nihonjin'], ['一人', 'hitori']],
  },
  {
    kanji: '年',
    readings: [['ねん', 'nen'], ['とし', 'toshi']],
    examples: [['今年', 'kotoshi'], ['一年', 'ichinen']],
  },
  {
    kanji: '大',
    readings: [['だい', 'dai'], ['おお', 'oo']],
    examples: [['大学', 'daigaku'], ['大きい', 'ookii']],
  },
  {
    kanji: '十',
    readings: [['じゅう', 'juu'], ['とお', 'too']],
    examples: [['十', 'juu'], ['十日', 'tooka']],
  },
  {
    kanji: '二',
    readings: [['に', 'ni'], ['ふた', 'futa']],
    examples: [['二つ', 'futatsu'], ['二人', 'futari']],
  },
  {
    kanji: '本',
    readings: [['ほん', 'hon'], ['もと', 'moto']],
    examples: [['本', 'hon'], ['日本', 'nihon']],
  },
  {
    kanji: '中',
    readings: [['ちゅう', 'chuu'], ['なか', 'naka']],
    examples: [['中', 'naka'], ['中学校', 'chuugakkou']],
  },
  {
    kanji: '長',
    readings: [['ちょう', 'chou'], ['ながい', 'nagai']],
    examples: [['長い', 'nagai'], ['社長', 'shachou']],
  },
  {
    kanji: '出',
    readings: [['しゅつ', 'shutsu'], ['でる', 'deru']],
    examples: [['出口', 'deguchi'], ['出る', 'deru']],
  },
  {
    kanji: '三',
    readings: [['さん', 'san'], ['み', 'mi']],
    examples: [['三つ', 'mittsu'], ['三月', 'sangatsu']],
  },
  {
    kanji: '時',
    readings: [['じ', 'ji'], ['とき', 'toki']],
    examples: [['時間', 'jikan'], ['三時', 'sanji']],
  },
  {
    kanji: '行',
    readings: [['こう', 'kou'], ['いく', 'iku']],
    examples: [['行く', 'iku'], ['銀行', 'ginkou']],
  },
  {
    kanji: '社',
    readings: [['しゃ', 'sha'], ['やしろ', 'yashiro']],
    examples: [['会社', 'kaisha'], ['社会', 'shakai']],
  },
  {
    kanji: '見',
    readings: [['けん', 'ken'], ['みる', 'miru']],
    examples: [['見る', 'miru'], ['見せる', 'miseru']],
  },
  {
    kanji: '月',
    readings: [['げつ', 'getsu'], ['がつ', 'gatsu'], ['つき', 'tsuki']],
    examples: [['月曜日', 'getsuyoubi'], ['月', 'tsuki']],
  },
  {
    kanji: '分',
    readings: [['ふん', 'fun'], ['わかる', 'wakaru']],
    examples: [['五分', 'gofun'], ['分かる', 'wakaru']],
  },
  {
    kanji: '後',
    readings: [['ご', 'go'], ['あと', 'ato'], ['うしろ', 'ushiro']],
    examples: [['後で', 'atode'], ['午後', 'gogo']],
  },
  {
    kanji: '前',
    readings: [['ぜん', 'zen'], ['まえ', 'mae']],
    examples: [['前', 'mae'], ['午前', 'gozen']],
  },
  {
    kanji: '生',
    readings: [['せい', 'sei'], ['いきる', 'ikiru'], ['うまれる', 'umareru']],
    examples: [['学生', 'gakusei'], ['生まれる', 'umareru']],
  },
  {
    kanji: '五',
    readings: [['ご', 'go'], ['いつ', 'itsu']],
    examples: [['五つ', 'itsutsu'], ['五月', 'gogatsu']],
  },
  {
    kanji: '間',
    readings: [['かん', 'kan'], ['あいだ', 'aida']],
    examples: [['時間', 'jikan'], ['間', 'aida']],
  },
  {
    kanji: '上',
    readings: [['じょう', 'jou'], ['うえ', 'ue'], ['あがる', 'agaru']],
    examples: [['上', 'ue'], ['上手', 'jouzu']],
  },
  {
    kanji: '東',
    readings: [['とう', 'tou'], ['ひがし', 'higashi']],
    examples: [['東京', 'toukyou'], ['東', 'higashi']],
  },
  {
    kanji: '四',
    readings: [['し', 'shi'], ['よん', 'yon'], ['よ', 'yo']],
    examples: [['四つ', 'yottsu'], ['四月', 'shigatsu']],
  },
  {
    kanji: '今',
    readings: [['こん', 'kon'], ['いま', 'ima']],
    examples: [['今', 'ima'], ['今月', 'kongetsu']],
  },
  {
    kanji: '新',
    readings: [['しん', 'shin'], ['あたらしい', 'atarashii']],
    examples: [['新しい', 'atarashii'], ['新聞', 'shinbun']],
  },
  {
    kanji: '金',
    readings: [['きん', 'kin'], ['かね', 'kane']],
    examples: [['お金', 'okane'], ['金曜日', 'kinyoubi']],
  },
  {
    kanji: '九',
    readings: [['きゅう', 'kyuu'], ['く', 'ku'], ['ここの', 'kokono']],
    examples: [['九つ', 'kokonotsu'], ['九月', 'kugatsu']],
  },
  {
    kanji: '入',
    readings: [['にゅう', 'nyuu'], ['はいる', 'hairu']],
    examples: [['入る', 'hairu'], ['入学', 'nyuugaku']],
  },
  {
    kanji: '立',
    readings: [['りつ', 'ritsu'], ['たつ', 'tatsu']],
    examples: [['立つ', 'tatsu'], ['国立', 'kokuritsu']],
  },
  {
    kanji: '手',
    readings: [['しゅ', 'shu'], ['て', 'te']],
    examples: [['手', 'te'], ['手紙', 'tegami']],
  },
  {
    kanji: '学',
    readings: [['がく', 'gaku'], ['まなぶ', 'manabu']],
    examples: [['学生', 'gakusei'], ['学ぶ', 'manabu']],
  },
  {
    kanji: '高',
    readings: [['こう', 'kou'], ['たかい', 'takai']],
    examples: [['高い', 'takai'], ['高校', 'koukou']],
  },
  {
    kanji: '円',
    readings: [['えん', 'en'], ['まるい', 'marui']],
    examples: [['円', 'en'], ['円い', 'marui']],
  },
  {
    kanji: '子',
    readings: [['し', 'shi'], ['こ', 'ko']],
    examples: [['子ども', 'kodomo'], ['女の子', 'onnanoko']],
  },
  {
    kanji: '目',
    readings: [['もく', 'moku'], ['め', 'me']],
    examples: [['目', 'me'], ['目玉', 'medama']],
  },
  {
    kanji: '外',
    readings: [['がい', 'gai'], ['そと', 'soto']],
    examples: [['外国', 'gaikoku'], ['外', 'soto']],
  },
  {
    kanji: '言',
    readings: [['げん', 'gen'], ['いう', 'iu'], ['こと', 'koto']],
    examples: [['言う', 'iu'], ['言葉', 'kotoba']],
  },
  {
    kanji: '八',
    readings: [['はち', 'hachi'], ['や', 'ya']],
    examples: [['八つ', 'yattsu'], ['八月', 'hachigatsu']],
  },
  {
    kanji: '六',
    readings: [['ろく', 'roku'], ['む', 'mu']],
    examples: [['六つ', 'muttsu'], ['六月', 'rokugatsu']],
  },
  {
    kanji: '下',
    readings: [['か', 'ka'], ['した', 'shita'], ['さがる', 'sagaru']],
    examples: [['下', 'shita'], ['下着', 'shitagi']],
  },
  {
    kanji: '来',
    readings: [['らい', 'rai'], ['くる', 'kuru']],
    examples: [['来る', 'kuru'], ['来年', 'rainen']],
  },
  {
    kanji: '気',
    readings: [['き', 'ki'], ['け', 'ke']],
    examples: [['元気', 'genki'], ['天気', 'tenki']],
  },
  {
    kanji: '小',
    readings: [['しょう', 'shou'], ['ちいさい', 'chiisai']],
    examples: [['小さい', 'chiisai'], ['小学校', 'shougakkou']],
  },
  {
    kanji: '七',
    readings: [['しち', 'shichi'], ['なな', 'nana']],
    examples: [['七つ', 'nanatsu'], ['七月', 'shichigatsu']],
  },
  {
    kanji: '山',
    readings: [['さん', 'san'], ['やま', 'yama']],
    examples: [['山', 'yama'], ['富士山', 'fujisan']],
  },
  {
    kanji: '話',
    readings: [['わ', 'wa'], ['はなす', 'hanasu'], ['はなし', 'hanashi']],
    examples: [['話す', 'hanasu'], ['話', 'hanashi']],
  },
  {
    kanji: '多',
    readings: [['た', 'ta'], ['おおい', 'ooi']],
    examples: [['多い', 'ooi'], ['多分', 'tabun']],
  },
  {
    kanji: '安',
    readings: [['あん', 'an'], ['やすい', 'yasui']],
    examples: [['安い', 'yasui'], ['安心', 'anshin']],
  },
  {
    kanji: '女',
    readings: [['じょ', 'jo'], ['おんな', 'onna']],
    examples: [['女', 'onna'], ['女の子', 'onnanoko']],
  },
  {
    kanji: '北',
    readings: [['ほく', 'hoku'], ['きた', 'kita']],
    examples: [['北', 'kita'], ['北口', 'kitaguchi']],
  },
  {
    kanji: '午',
    readings: [['ご', 'go']],
    examples: [['午前', 'gozen'], ['午後', 'gogo']],
  },
  {
    kanji: '百',
    readings: [['ひゃく', 'hyaku']],
    examples: [['百', 'hyaku'], ['百人', 'hyakunin']],
  },
  {
    kanji: '書',
    readings: [['しょ', 'sho'], ['かく', 'kaku']],
    examples: [['書く', 'kaku'], ['教科書', 'kyoukasho']],
  },
  {
    kanji: '先',
    readings: [['せん', 'sen'], ['さき', 'saki']],
    examples: [['先生', 'sensei'], ['先', 'saki']],
  },
  {
    kanji: '名',
    readings: [['めい', 'mei'], ['な', 'na']],
    examples: [['名前', 'namae'], ['有名', 'yuumei']],
  },
  {
    kanji: '川',
    readings: [['せん', 'sen'], ['かわ', 'kawa']],
    examples: [['川', 'kawa'], ['川口', 'kawaguchi']],
  },
  {
    kanji: '千',
    readings: [['せん', 'sen'], ['ち', 'chi']],
    examples: [['千', 'sen'], ['千人', 'sennin']],
  },
  {
    kanji: '道',
    readings: [['どう', 'dou'], ['みち', 'michi']],
    examples: [['道', 'michi'], ['柔道', 'juudou']],
  },
  {
    kanji: '水',
    readings: [['すい', 'sui'], ['みず', 'mizu']],
    examples: [['水', 'mizu'], ['水曜日', 'suiyoubi']],
  },
  {
    kanji: '半',
    readings: [['はん', 'han'], ['なかば', 'nakaba']],
    examples: [['半', 'han'], ['三時半', 'sanji han']],
  },
  {
    kanji: '男',
    readings: [['だん', 'dan'], ['おとこ', 'otoko']],
    examples: [['男', 'otoko'], ['男の子', 'otokonoko']],
  },
  {
    kanji: '西',
    readings: [['せい', 'sei'], ['にし', 'nishi']],
    examples: [['西', 'nishi'], ['西口', 'nishiguchi']],
  },
  {
    kanji: '電',
    readings: [['でん', 'den']],
    examples: [['電車', 'densha'], ['電話', 'denwa']],
  },
  {
    kanji: '口',
    readings: [['こう', 'kou'], ['くち', 'kuchi']],
    examples: [['口', 'kuchi'], ['人口', 'jinkou']],
  },
  {
    kanji: '少',
    readings: [['しょう', 'shou'], ['すくない', 'sukunai'], ['すこし', 'sukoshi']],
    examples: [['少ない', 'sukunai'], ['少し', 'sukoshi']],
  },
  {
    kanji: '校',
    readings: [['こう', 'kou']],
    examples: [['学校', 'gakkou'], ['高校', 'koukou']],
  },
  {
    kanji: '語',
    readings: [['ご', 'go'], ['かたる', 'kataru']],
    examples: [['日本語', 'nihongo'], ['英語', 'eigo']],
  },
  {
    kanji: '空',
    readings: [['くう', 'kuu'], ['そら', 'sora']],
    examples: [['空', 'sora'], ['空港', 'kuukou']],
  },
  {
    kanji: '土',
    readings: [['ど', 'do'], ['つち', 'tsuchi']],
    examples: [['土', 'tsuchi'], ['土曜日', 'doyoubi']],
  },
  {
    kanji: '木',
    readings: [['もく', 'moku'], ['き', 'ki']],
    examples: [['木', 'ki'], ['木曜日', 'mokuyoubi']],
  },
  {
    kanji: '聞',
    readings: [['ぶん', 'bun'], ['きく', 'kiku']],
    examples: [['聞く', 'kiku'], ['新聞', 'shinbun']],
  },
  {
    kanji: '食',
    readings: [['しょく', 'shoku'], ['たべる', 'taberu']],
    examples: [['食べる', 'taberu'], ['食べ物', 'tabemono']],
  },
  {
    kanji: '車',
    readings: [['しゃ', 'sha'], ['くるま', 'kuruma']],
    examples: [['車', 'kuruma'], ['電車', 'densha']],
  },
  {
    kanji: '何',
    readings: [['か', 'ka'], ['なに', 'nani'], ['なん', 'nan']],
    examples: [['何', 'nani'], ['何時', 'nanji']],
  },
  {
    kanji: '南',
    readings: [['なん', 'nan'], ['みなみ', 'minami']],
    examples: [['南', 'minami'], ['南口', 'minamiguchi']],
  },
  {
    kanji: '足',
    readings: [['そく', 'soku'], ['あし', 'ashi'], ['たる', 'taru']],
    examples: [['足', 'ashi'], ['足りる', 'tariru']],
  },
  {
    kanji: '万',
    readings: [['まん', 'man'], ['ばん', 'ban']],
    examples: [['一万', 'ichiman'], ['百万', 'hyakuman']],
  },
  {
    kanji: '店',
    readings: [['てん', 'ten'], ['みせ', 'mise']],
    examples: [['店', 'mise'], ['喫茶店', 'kissaten']],
  },
  {
    kanji: '毎',
    readings: [['まい', 'mai']],
    examples: [['毎日', 'mainichi'], ['毎週', 'maishuu']],
  },
  {
    kanji: '白',
    readings: [['はく', 'haku'], ['しろ', 'shiro'], ['しろい', 'shiroi']],
    examples: [['白い', 'shiroi'], ['白', 'shiro']],
  },
  {
    kanji: '古',
    readings: [['こ', 'ko'], ['ふるい', 'furui']],
    examples: [['古い', 'furui'], ['中古', 'chuuko']],
  },
  {
    kanji: '天',
    readings: [['てん', 'ten'], ['あめ', 'ame']],
    examples: [['天気', 'tenki'], ['天国', 'tengoku']],
  },
  {
    kanji: '買',
    readings: [['ばい', 'bai'], ['かう', 'kau']],
    examples: [['買う', 'kau'], ['買い物', 'kaimono']],
  },
  {
    kanji: '週',
    readings: [['しゅう', 'shuu']],
    examples: [['今週', 'konshuu'], ['毎週', 'maishuu']],
  },
  {
    kanji: '母',
    readings: [['ぼ', 'bo'], ['はは', 'haha'], ['かあ', 'kaa']],
    examples: [['母', 'haha'], ['お母さん', 'okaasan']],
  },
  {
    kanji: '火',
    readings: [['か', 'ka'], ['ひ', 'hi']],
    examples: [['火', 'hi'], ['火曜日', 'kayoubi']],
  },
  {
    kanji: '花',
    readings: [['か', 'ka'], ['はな', 'hana']],
    examples: [['花', 'hana'], ['花見', 'hanami']],
  },
  {
    kanji: '右',
    readings: [['う', 'u'], ['みぎ', 'migi']],
    examples: [['右', 'migi'], ['右手', 'migite']],
  },
  {
    kanji: '読',
    readings: [['どく', 'doku'], ['よむ', 'yomu']],
    examples: [['読む', 'yomu'], ['読書', 'dokusho']],
  },
  {
    kanji: '友',
    readings: [['ゆう', 'yuu'], ['とも', 'tomo']],
    examples: [['友だち', 'tomodachi'], ['親友', 'shinyuu']],
  },
  {
    kanji: '左',
    readings: [['さ', 'sa'], ['ひだり', 'hidari']],
    examples: [['左', 'hidari'], ['左手', 'hidarite']],
  },
  {
    kanji: '休',
    readings: [['きゅう', 'kyuu'], ['やすむ', 'yasumu']],
    examples: [['休む', 'yasumu'], ['休み', 'yasumi']],
  },
  {
    kanji: '父',
    readings: [['ふ', 'fu'], ['ちち', 'chichi'], ['とう', 'tou']],
    examples: [['父', 'chichi'], ['お父さん', 'otousan']],
  },
  {
    kanji: '駅',
    readings: [['えき', 'eki']],
    examples: [['駅', 'eki'], ['駅前', 'ekimae']],
  },
  {
    kanji: '雨',
    readings: [['う', 'u'], ['あめ', 'ame']],
    examples: [['雨', 'ame'], ['大雨', 'ooame']],
  },
  {
    kanji: '飲',
    readings: [['いん', 'in'], ['のむ', 'nomu']],
    examples: [['飲む', 'nomu'], ['飲み物', 'nomimono']],
  },
  {
    kanji: '魚',
    readings: [['ぎょ', 'gyo'], ['さかな', 'sakana']],
    examples: [['魚', 'sakana'], ['金魚', 'kingyo']],
  },
  {
    kanji: '耳',
    readings: [['じ', 'ji'], ['みみ', 'mimi']],
    examples: [['耳', 'mimi'], ['耳元', 'mimimoto']],
  },
]

export function createN5KanjiDeck(now = Date.now()): Deck {
  return {
    id: N5_KANJI_DECK_ID,
    name: '',
    nameJp: 'N5 漢字',
    description: '',
    accent: '#3F7D62',
    builtin: true,
    kind: 'kanji',
    createdAt: now,
  }
}

export function createN5KanjiCards(now = Date.now()): Card[] {
  return N5_KANJI.map((entry, index) => {
    const number = String(index + 1).padStart(3, '0')
    return {
      id: `${N5_KANJI_DECK_ID}-${number}`,
      deckId: N5_KANJI_DECK_ID,
      front: entry.kanji,
      reading: '',
      meaning: '',
      note: '',
      mnemonic: '',
      tags: ['N5'],
      jlpt: 5,
      readings: entry.readings.map(([kana, transcription], readingIndex) => ({
        id: `reading-${number}-${readingIndex + 1}`,
        kana,
        transcription,
      })),
      examples: entry.examples.map(([text, transcription], exampleIndex) => ({
        id: `example-${number}-${exampleIndex + 1}`,
        text,
        transcription,
        translation: '',
      })),
      group: 'custom',
      order: index + 1,
      srs: freshSrs(),
      createdAt: now,
    }
  })
}
