import type { Card, Deck } from '../types'
import { freshSrs } from '../lib/srs'

export const N4_KANJI_PACK_ID = 'kanji-n4'
export const N4_KANJI_DECK_ID = 'kanji-n4'

interface N4KanjiEntry {
  kanji: string
  /** [кана, ромадзи] */
  readings: [string, string][]
  /** [слово, ромадзи] */
  examples: [string, string][]
}

const N4_KANJI: N4KanjiEntry[] = [
  {
    kanji: '同',
    readings: [['どう', 'dou'], ['おなじ', 'onaji']],
    examples: [['同じ', 'onaji'], ['同時', 'douji']],
  },
  {
    kanji: '事',
    readings: [['じ', 'ji'], ['ず', 'zu'], ['こと', 'koto'], ['つかう', 'tsukau']],
    examples: [['仕事', 'shigoto'], ['食事', 'shokuji']],
  },
  {
    kanji: '自',
    readings: [['じ', 'ji'], ['し', 'shi'], ['みずから', 'mizukara'], ['おのずから', 'onozukara']],
    examples: [['自ら', 'mizukara'], ['自分', 'jibun']],
  },
  {
    kanji: '民',
    readings: [['みん', 'min'], ['たみ', 'tami']],
    examples: [['市民', 'shimin'], ['国民', 'kokumin']],
  },
  {
    kanji: '発',
    readings: [['はつ', 'hatsu'], ['ほつ', 'hotsu'], ['たつ', 'tatsu'], ['あばく', 'abaku']],
    examples: [['出発', 'shuppatsu'], ['発音', 'hatsuon']],
  },
  {
    kanji: '者',
    readings: [['しゃ', 'sha'], ['もの', 'mono']],
    examples: [['医者', 'isha'], ['記者', 'kisha']],
  },
  {
    kanji: '地',
    readings: [['ち', 'chi'], ['じ', 'ji']],
    examples: [['土地', 'tochi'], ['地元', 'jimoto']],
  },
  {
    kanji: '合',
    readings: [['ごう', 'gou'], ['がっ', 'ga'], ['あう', 'au']],
    examples: [['場合', 'baai'], ['試合', 'shiai']],
  },
  {
    kanji: '市',
    readings: [['し', 'shi'], ['いち', 'ichi']],
    examples: [['市場', 'ichiba'], ['市民', 'shimin']],
  },
  {
    kanji: '業',
    readings: [['ぎょう', 'gyou'], ['ごう', 'gou'], ['わざ', 'waza']],
    examples: [['業', 'gyou'], ['事業', 'jigyou']],
  },
  {
    kanji: '方',
    readings: [['ほう', 'hou'], ['かた', 'kata']],
    examples: [['方法', 'houhou'], ['方向', 'houkou']],
  },
  {
    kanji: '回',
    readings: [['かい', 'kai'], ['え', 'e'], ['まわる', 'mawaru']],
    examples: [['回る', 'mawaru'], ['一回', 'ikkai']],
  },
  {
    kanji: '場',
    readings: [['じょう', 'jou'], ['ちょう', 'chou'], ['ば', 'ba']],
    examples: [['場所', 'basho'], ['会場', 'kaijou']],
  },
  {
    kanji: '員',
    readings: [['いん', 'in']],
    examples: [['会員', 'kaiin'], ['委員', 'iin']],
  },
  {
    kanji: '開',
    readings: [['かい', 'kai'], ['ひらく', 'hiraku'], ['ひらき', 'hiraki']],
    examples: [['開く', 'hiraku'], ['開ける', 'akeru']],
  },
  {
    kanji: '力',
    readings: [['りょく', 'ryoku'], ['りき', 'riki'], ['ちから', 'chikara']],
    examples: [['力', 'chikara'], ['体力', 'tairyoku']],
  },
  {
    kanji: '問',
    readings: [['もん', 'mon'], ['とう', 'tou'], ['とい', 'toi']],
    examples: [['問題', 'mondai'], ['質問', 'shitsumon']],
  },
  {
    kanji: '代',
    readings: [['だい', 'dai'], ['たい', 'tai'], ['かわる', 'kawaru']],
    examples: [['代表', 'daihyou'], ['時代', 'jidai']],
  },
  {
    kanji: '明',
    readings: [['めい', 'mei'], ['みょう', 'myou'], ['あかり', 'akari'], ['あかるい', 'akarui']],
    examples: [['説明', 'setsumei'], ['明日', 'ashita']],
  },
  {
    kanji: '動',
    readings: [['どう', 'dou'], ['うごく', 'ugoku'], ['うごかす', 'ugokasu']],
    examples: [['動き', 'ugoki'], ['行動', 'koudou']],
  },
  {
    kanji: '京',
    readings: [['きょう', 'kyou'], ['けい', 'kei'], ['みやこ', 'miyako']],
    examples: [['東京', 'toukyou'], ['京都', 'kyouto']],
  },
  {
    kanji: '通',
    readings: [['つう', 'tsuu'], ['つ', 'tsu'], ['とおる', 'tooru'], ['とおり', 'toori']],
    examples: [['通信', 'tsuushin'], ['交通', 'koutsuu']],
  },
  {
    kanji: '理',
    readings: [['り', 'ri'], ['ことわり', 'kotowari']],
    examples: [['理由', 'riyuu'], ['料理', 'ryouri']],
  },
  {
    kanji: '体',
    readings: [['たい', 'tai'], ['てい', 'tei'], ['からだ', 'karada'], ['かたち', 'katachi']],
    examples: [['体', 'karada'], ['体育', 'taiiku']],
  },
  {
    kanji: '田',
    readings: [['でん', 'den'], ['た', 'ta']],
    examples: [['田舎', 'inaka'], ['田んぼ', 'tanbo']],
  },
  {
    kanji: '主',
    readings: [['しゅ', 'shu'], ['す', 'su'], ['ぬし', 'nushi'], ['おも', 'omo']],
    examples: [['主人', 'shujin'], ['主に', 'omoni']],
  },
  {
    kanji: '題',
    readings: [['だい', 'dai']],
    examples: [['問題', 'mondai'], ['宿題', 'shukudai']],
  },
  {
    kanji: '首',
    readings: [['しゅ', 'shu'], ['くび', 'kubi']],
    examples: [['首', 'kubi'], ['手首', 'tekubi']],
  },
  {
    kanji: '意',
    readings: [['い', 'i']],
    examples: [['意見', 'iken'], ['注意', 'chuui']],
  },
  {
    kanji: '不',
    readings: [['ふ', 'fu'], ['ぶ', 'bu']],
    examples: [['不況', 'fukyou'], ['不安', 'fuan']],
  },
  {
    kanji: '作',
    readings: [['さく', 'saku'], ['さ', 'sa'], ['つくる', 'tsukuru'], ['つくり', 'tsukuri']],
    examples: [['作品', 'sakuhin'], ['作業', 'sagyou']],
  },
  {
    kanji: '用',
    readings: [['よう', 'you'], ['もちいる', 'mochiiru']],
    examples: [['使用', 'shiyou'], ['利用', 'riyou']],
  },
  {
    kanji: '度',
    readings: [['ど', 'do'], ['と', 'to'], ['たび', 'tabi'], ['たい', 'tai']],
    examples: [['制度', 'seido'], ['程度', 'teido']],
  },
  {
    kanji: '強',
    readings: [['きょう', 'kyou'], ['ごう', 'gou'], ['つよい', 'tsuyoi'], ['つよまる', 'tsuyomaru']],
    examples: [['強化', 'kyouka'], ['勉強', 'benkyou']],
  },
  {
    kanji: '持',
    readings: [['じ', 'ji'], ['もつ', 'motsu'], ['もち', 'mochi']],
    examples: [['支持', 'shiji'], ['維持', 'iji']],
  },
  {
    kanji: '野',
    readings: [['や', 'ya'], ['しょ', 'sho'], ['の', 'no']],
    examples: [['野', 'no'], ['分野', 'bun\'ya']],
  },
  {
    kanji: '都',
    readings: [['と', 'to'], ['つ', 'tsu'], ['みやこ', 'miyako']],
    examples: [['都合', 'tsugou'], ['都市', 'toshi']],
  },
  {
    kanji: '以',
    readings: [['い', 'i'], ['もって', 'motte']],
    examples: [['以来', 'irai'], ['以内', 'inai']],
  },
  {
    kanji: '思',
    readings: [['し', 'shi'], ['おもう', 'omou'], ['おもえらく', 'omoeraku']],
    examples: [['思い', 'omoi'], ['思う', 'omou']],
  },
  {
    kanji: '家',
    readings: [['か', 'ka'], ['け', 'ke'], ['いえ', 'ie'], ['や', 'ya']],
    examples: [['国家', 'kokka'], ['家庭', 'katei']],
  },
  {
    kanji: '世',
    readings: [['せい', 'sei'], ['せ', 'se'], ['よ', 'yo']],
    examples: [['世界', 'sekai'], ['世代', 'sedai']],
  },
  {
    kanji: '区',
    readings: [['く', 'ku'], ['おう', 'ou']],
    examples: [['区', 'ku'], ['地区', 'chiku']],
  },
  {
    kanji: '県',
    readings: [['けん', 'ken'], ['かける', 'kakeru']],
    examples: [['県', 'ken'], ['県庁', 'kenchou']],
  },
  {
    kanji: '進',
    readings: [['しん', 'shin'], ['すすむ', 'susumu'], ['すすめる', 'susumeru']],
    examples: [['進む', 'susumu'], ['進歩', 'shinpo']],
  },
  {
    kanji: '正',
    readings: [['せい', 'sei'], ['しょう', 'shou'], ['ただしい', 'tadashii'], ['ただす', 'tadasu']],
    examples: [['正しい', 'tadashii'], ['正直', 'shoujiki']],
  },
  {
    kanji: '院',
    readings: [['いん', 'in']],
    examples: [['病院', 'byouin'], ['入院', 'nyuuin']],
  },
  {
    kanji: '心',
    readings: [['しん', 'shin'], ['こころ', 'kokoro'], ['ごころ', 'gokoro']],
    examples: [['中心', 'chuushin'], ['関心', 'kanshin']],
  },
  {
    kanji: '界',
    readings: [['かい', 'kai']],
    examples: [['世界', 'sekai'], ['政界', 'seikai']],
  },
  {
    kanji: '産',
    readings: [['さん', 'san'], ['うむ', 'umu'], ['うまれる', 'umareru']],
    examples: [['生産', 'seisan'], ['資産', 'shisan']],
  },
  {
    kanji: '教',
    readings: [['きょう', 'kyou'], ['おしえる', 'oshieru'], ['おそわる', 'osowaru']],
    examples: [['教授', 'kyouju'], ['教育', 'kyouiku']],
  },
  {
    kanji: '文',
    readings: [['ぶん', 'bun'], ['もん', 'mon'], ['ふみ', 'fumi'], ['あや', 'aya']],
    examples: [['文化', 'bunka'], ['文学', 'bungaku']],
  },
  {
    kanji: '元',
    readings: [['げん', 'gen'], ['がん', 'gan'], ['もと', 'moto']],
    examples: [['元', 'moto'], ['地元', 'jimoto']],
  },
  {
    kanji: '重',
    readings: [['じゅう', 'juu'], ['ちょう', 'chou'], ['え', 'e'], ['おもい', 'omoi']],
    examples: [['重い', 'omoi'], ['体重', 'taijuu']],
  },
  {
    kanji: '近',
    readings: [['きん', 'kin'], ['こん', 'kon'], ['ちかい', 'chikai']],
    examples: [['最近', 'saikin'], ['付近', 'fukin']],
  },
  {
    kanji: '考',
    readings: [['こう', 'kou'], ['かんがえる', 'kangaeru'], ['かんがえ', 'kangae']],
    examples: [['考える', 'kangaeru'], ['思考', 'shikou']],
  },
  {
    kanji: '画',
    readings: [['が', 'ga'], ['かく', 'kaku'], ['えがく', 'egaku'], ['かくする', 'kakusuru']],
    examples: [['映画', 'eiga'], ['計画', 'keikaku']],
  },
  {
    kanji: '海',
    readings: [['かい', 'kai'], ['うみ', 'umi']],
    examples: [['海', 'umi'], ['海外', 'kaigai']],
  },
  {
    kanji: '売',
    readings: [['ばい', 'bai'], ['うる', 'uru'], ['うれる', 'ureru']],
    examples: [['販売', 'hanbai'], ['売買', 'baibai']],
  },
  {
    kanji: '知',
    readings: [['ち', 'chi'], ['しる', 'shiru'], ['しらせる', 'shiraseru']],
    examples: [['知る', 'shiru'], ['知識', 'chishiki']],
  },
  {
    kanji: '集',
    readings: [['しゅう', 'shuu'], ['あつまる', 'atsumaru'], ['あつめる', 'atsumeru']],
    examples: [['集める', 'atsumeru'], ['集まる', 'atsumaru']],
  },
  {
    kanji: '別',
    readings: [['べつ', 'betsu'], ['わかれる', 'wakareru'], ['わける', 'wakeru']],
    examples: [['告別', 'kokubetsu'], ['特別', 'tokubetsu']],
  },
  {
    kanji: '物',
    readings: [['ぶつ', 'butsu'], ['もつ', 'motsu'], ['もの', 'mono']],
    examples: [['人物', 'jinbutsu'], ['動物', 'doubutsu']],
  },
  {
    kanji: '引',
    readings: [['いん', 'in'], ['ひく', 'hiku'], ['ひき', 'hiki']],
    examples: [['取引', 'torihiki'], ['引退', 'intai']],
  },
  {
    kanji: '使',
    readings: [['し', 'shi'], ['つかう', 'tsukau'], ['つかい', 'tsukai']],
    examples: [['使う', 'tsukau'], ['使用', 'shiyou']],
  },
  {
    kanji: '所',
    readings: [['しょ', 'sho'], ['ところ', 'tokoro']],
    examples: [['場所', 'basho'], ['所得', 'shotoku']],
  },
  {
    kanji: '品',
    readings: [['ひん', 'hin'], ['ほん', 'hon'], ['しな', 'shina']],
    examples: [['作品', 'sakuhin'], ['商品', 'shouhin']],
  },
  {
    kanji: '計',
    readings: [['けい', 'kei'], ['はかる', 'hakaru'], ['はからう', 'hakarau']],
    examples: [['計画', 'keikaku'], ['合計', 'goukei']],
  },
  {
    kanji: '死',
    readings: [['し', 'shi'], ['しぬ', 'shinu'], ['しに', 'shini']],
    examples: [['死', 'shi'], ['死者', 'shisha']],
  },
  {
    kanji: '特',
    readings: [['とく', 'toku']],
    examples: [['特に', 'tokuni'], ['特別', 'tokubetsu']],
  },
  {
    kanji: '私',
    readings: [['し', 'shi'], ['わたくし', 'watakushi'], ['わたし', 'watashi']],
    examples: [['私', 'watashi'], ['私立', 'shiritsu']],
  },
  {
    kanji: '始',
    readings: [['し', 'shi'], ['はじめる', 'hajimeru']],
    examples: [['始める', 'hajimeru'], ['開始', 'kaishi']],
  },
  {
    kanji: '朝',
    readings: [['ちょう', 'chou'], ['あさ', 'asa']],
    examples: [['朝', 'asa'], ['朝食', 'choushoku']],
  },
  {
    kanji: '村',
    readings: [['そん', 'son'], ['むら', 'mura']],
    examples: [['村', 'mura'], ['村人', 'murabito']],
  },
  {
    kanji: '運',
    readings: [['うん', 'un'], ['はこぶ', 'hakobu']],
    examples: [['運転', 'unten'], ['運動', 'undou']],
  },
  {
    kanji: '終',
    readings: [['しゅう', 'shuu'], ['おわる', 'owaru']],
    examples: [['最終', 'saishuu'], ['終結', 'shuuketsu']],
  },
  {
    kanji: '台',
    readings: [['だい', 'dai'], ['たい', 'tai'], ['うてな', 'utena'], ['われ', 'ware']],
    examples: [['台', 'dai'], ['台所', 'daidokoro']],
  },
  {
    kanji: '広',
    readings: [['こう', 'kou'], ['ひろい', 'hiroi'], ['ひろまる', 'hiromaru']],
    examples: [['広い', 'hiroi'], ['広告', 'koukoku']],
  },
  {
    kanji: '住',
    readings: [['じゅう', 'juu'], ['ぢゅう', 'juu'], ['すむ', 'sumu'], ['すまう', 'sumau']],
    examples: [['住む', 'sumu'], ['住宅', 'juutaku']],
  },
  {
    kanji: '真',
    readings: [['しん', 'shin'], ['ま', 'ma']],
    examples: [['真', 'shin'], ['真相', 'shinsou']],
  },
  {
    kanji: '有',
    readings: [['ゆう', 'yuu'], ['う', 'u'], ['ある', 'aru']],
    examples: [['有', 'yuu'], ['有力', 'yuuryoku']],
  },
  {
    kanji: '町',
    readings: [['ちょう', 'chou'], ['まち', 'machi']],
    examples: [['町', 'machi'], ['町民', 'choumin']],
  },
  {
    kanji: '料',
    readings: [['りょう', 'ryou']],
    examples: [['料理', 'ryouri'], ['料金', 'ryoukin']],
  },
  {
    kanji: '工',
    readings: [['こう', 'kou'], ['く', 'ku']],
    examples: [['工場', 'koujou'], ['工事', 'kouji']],
  },
  {
    kanji: '建',
    readings: [['けん', 'ken'], ['こん', 'kon'], ['たてる', 'tateru'], ['たて', 'tate']],
    examples: [['建設', 'kensetsu'], ['再建', 'saiken']],
  },
  {
    kanji: '急',
    readings: [['きゅう', 'kyuu'], ['いそぐ', 'isogu'], ['いそぎ', 'isogi']],
    examples: [['急', 'kyuu'], ['緊急', 'kinkyuu']],
  },
  {
    kanji: '止',
    readings: [['し', 'shi'], ['とまる', 'tomaru'], ['どまり', 'domari']],
    examples: [['禁止', 'kinshi'], ['防止', 'boushi']],
  },
  {
    kanji: '送',
    readings: [['そう', 'sou'], ['おくる', 'okuru']],
    examples: [['放送', 'housou'], ['輸送', 'yusou']],
  },
  {
    kanji: '切',
    readings: [['せつ', 'setsu'], ['さい', 'sai'], ['きる', 'kiru']],
    examples: [['切る', 'kiru'], ['大切', 'taisetsu']],
  },
  {
    kanji: '説',
    readings: [['せつ', 'setsu'], ['ぜい', 'zei'], ['とく', 'toku']],
    examples: [['演説', 'enzetsu'], ['説明', 'setsumei']],
  },
  {
    kanji: '転',
    readings: [['てん', 'ten'], ['ころがる', 'korogaru'], ['ころげる', 'korogeru']],
    examples: [['転換', 'tenkan'], ['運転', 'unten']],
  },
  {
    kanji: '研',
    readings: [['けん', 'ken'], ['とぐ', 'togu']],
    examples: [['研究', 'kenkyuu'], ['研修', 'kenshuu']],
  },
  {
    kanji: '究',
    readings: [['きゅう', 'kyuu'], ['く', 'ku'], ['きわめる', 'kiwameru']],
    examples: [['研究', 'kenkyuu'], ['究明', 'kyuumei']],
  },
  {
    kanji: '楽',
    readings: [['がく', 'gaku'], ['らく', 'raku'], ['たのしい', 'tanoshii'], ['たのしむ', 'tanoshimu']],
    examples: [['楽', 'raku'], ['音楽', 'ongaku']],
  },
  {
    kanji: '起',
    readings: [['き', 'ki'], ['おきる', 'okiru'], ['おこる', 'okoru']],
    examples: [['起きる', 'okiru'], ['起こす', 'okosu']],
  },
  {
    kanji: '着',
    readings: [['ちゃく', 'chaku'], ['じゃく', 'jaku'], ['きる', 'kiru'], ['ぎ', 'gi']],
    examples: [['着く', 'tsuku'], ['到着', 'touchaku']],
  },
  {
    kanji: '乗',
    readings: [['じょう', 'jou'], ['しょう', 'shou'], ['のる', 'noru'], ['のり', 'nori']],
    examples: [['乗客', 'joukyaku'], ['乗り', 'nori']],
  },
  {
    kanji: '病',
    readings: [['びょう', 'byou'], ['へい', 'hei'], ['やむ', 'yamu'], ['やみ', 'yami']],
    examples: [['病', 'yamai'], ['病院', 'byouin']],
  },
  {
    kanji: '声',
    readings: [['せい', 'sei'], ['しょう', 'shou'], ['こえ', 'koe'], ['こわ', 'kowa']],
    examples: [['声', 'koe'], ['大声', 'oogoe']],
  },
  {
    kanji: '質',
    readings: [['しつ', 'shitsu'], ['しち', 'shichi'], ['たち', 'tachi'], ['ただす', 'tadasu']],
    examples: [['質', 'shitsu'], ['質問', 'shitsumon']],
  },
  {
    kanji: '待',
    readings: [['たい', 'tai'], ['まつ', 'matsu'], ['まち', 'machi']],
    examples: [['待つ', 'matsu'], ['期待', 'kitai']],
  },
  {
    kanji: '試',
    readings: [['し', 'shi'], ['こころみる', 'kokoromiru'], ['ためす', 'tamesu']],
    examples: [['試す', 'tamesu'], ['試験', 'shiken']],
  },
  {
    kanji: '族',
    readings: [['ぞく', 'zoku']],
    examples: [['家族', 'kazoku'], ['民族', 'minzoku']],
  },
  {
    kanji: '銀',
    readings: [['ぎん', 'gin'], ['しろがね', 'shirogane']],
    examples: [['銀', 'gin'], ['銀行', 'ginkou']],
  },
  {
    kanji: '早',
    readings: [['そう', 'sou'], ['さっ', 'sa'], ['はやい', 'hayai'], ['はや', 'haya']],
    examples: [['早い', 'hayai'], ['早起き', 'hayaoki']],
  },
  {
    kanji: '映',
    readings: [['えい', 'ei'], ['うつる', 'utsuru'], ['うつす', 'utsusu']],
    examples: [['映画', 'eiga'], ['映像', 'eizou']],
  },
  {
    kanji: '親',
    readings: [['しん', 'shin'], ['おや', 'oya']],
    examples: [['親', 'oya'], ['母親', 'hahaoya']],
  },
  {
    kanji: '験',
    readings: [['けん', 'ken'], ['げん', 'gen'], ['あかし', 'akashi'], ['しるし', 'shirushi']],
    examples: [['体験', 'taiken'], ['受験', 'juken']],
  },
  {
    kanji: '働',
    readings: [['どう', 'dou'], ['はたらく', 'hataraku']],
    examples: [['労働', 'roudou'], ['働き', 'hataraki']],
  },
  {
    kanji: '好',
    readings: [['こう', 'kou'], ['このむ', 'konomu'], ['すく', 'suku']],
    examples: [['友好', 'yuukou'], ['好調', 'kouchou']],
  },
  {
    kanji: '英',
    readings: [['えい', 'ei'], ['はなぶさ', 'hanabusa']],
    examples: [['英語', 'eigo'], ['英雄', 'eiyuu']],
  },
  {
    kanji: '頭',
    readings: [['とう', 'tou'], ['ず', 'zu'], ['あたま', 'atama'], ['かしら', 'kashira']],
    examples: [['頭', 'atama'], ['頭痛', 'zutsuu']],
  },
  {
    kanji: '低',
    readings: [['てい', 'tei'], ['ひくい', 'hikui'], ['ひくめる', 'hikumeru']],
    examples: [['低い', 'hikui'], ['低下', 'teika']],
  },
  {
    kanji: '医',
    readings: [['い', 'i'], ['いやす', 'iyasu'], ['いする', 'isuru']],
    examples: [['医療', 'iryou'], ['医学', 'igaku']],
  },
  {
    kanji: '仕',
    readings: [['し', 'shi'], ['じ', 'ji'], ['つかえる', 'tsukaeru']],
    examples: [['仕事', 'shigoto'], ['仕方', 'shikata']],
  },
  {
    kanji: '去',
    readings: [['きょ', 'kyo'], ['こ', 'ko'], ['さる', 'saru']],
    examples: [['過去', 'kako'], ['死去', 'shikyo']],
  },
  {
    kanji: '味',
    readings: [['み', 'mi'], ['あじ', 'aji'], ['あじわう', 'ajiwau']],
    examples: [['味', 'aji'], ['意味', 'imi']],
  },
  {
    kanji: '門',
    readings: [['もん', 'mon'], ['かど', 'kado'], ['と', 'to']],
    examples: [['門', 'mon'], ['専門', 'senmon']],
  },
  {
    kanji: '写',
    readings: [['しゃ', 'sha'], ['じゃ', 'ja'], ['うつす', 'utsusu'], ['うつる', 'utsuru']],
    examples: [['写す', 'utsusu'], ['写真', 'shashin']],
  },
  {
    kanji: '字',
    readings: [['じ', 'ji'], ['あざ', 'aza'], ['あざな', 'azana']],
    examples: [['字', 'ji'], ['漢字', 'kanji']],
  },
  {
    kanji: '答',
    readings: [['とう', 'tou'], ['こたえる', 'kotaeru'], ['こたえ', 'kotae']],
    examples: [['答える', 'kotaeru'], ['回答', 'kaitou']],
  },
  {
    kanji: '夜',
    readings: [['や', 'ya'], ['よ', 'yo'], ['よる', 'yoru']],
    examples: [['夜', 'yoru'], ['日夜', 'nichiya']],
  },
  {
    kanji: '音',
    readings: [['おん', 'on'], ['いん', 'in'], ['おと', 'oto'], ['ね', 'ne']],
    examples: [['音', 'oto'], ['音楽', 'ongaku']],
  },
  {
    kanji: '注',
    readings: [['ちゅう', 'chuu'], ['そそぐ', 'sosogu'], ['さす', 'sasu']],
    examples: [['注意', 'chuui'], ['注ぐ', 'sosogu']],
  },
  {
    kanji: '帰',
    readings: [['き', 'ki'], ['かえる', 'kaeru'], ['かえす', 'kaesu']],
    examples: [['帰国', 'kikoku'], ['復帰', 'fukki']],
  },
  {
    kanji: '歌',
    readings: [['か', 'ka'], ['うた', 'uta'], ['うたう', 'utau']],
    examples: [['歌', 'uta'], ['歌手', 'kashu']],
  },
  {
    kanji: '光',
    readings: [['こう', 'kou'], ['ひかる', 'hikaru'], ['ひかり', 'hikari']],
    examples: [['光', 'hikari'], ['観光', 'kankou']],
  },
  {
    kanji: '悪',
    readings: [['あく', 'aku'], ['お', 'o'], ['わるい', 'warui'], ['わる', 'waru']],
    examples: [['悪', 'aku'], ['悪化', 'akka']],
  },
  {
    kanji: '図',
    readings: [['ず', 'zu'], ['と', 'to'], ['え', 'e'], ['はかる', 'hakaru']],
    examples: [['図', 'zu'], ['地図', 'chizu']],
  },
  {
    kanji: '室',
    readings: [['しつ', 'shitsu'], ['むろ', 'muro']],
    examples: [['教室', 'kyoushitsu'], ['室内', 'shitsunai']],
  },
  {
    kanji: '太',
    readings: [['たい', 'tai'], ['た', 'ta'], ['ふとい', 'futoi'], ['ふとる', 'futoru']],
    examples: [['太陽', 'taiyou'], ['太い', 'futoi']],
  },
  {
    kanji: '歩',
    readings: [['ほ', 'ho'], ['ぶ', 'bu'], ['あるく', 'aruku'], ['あゆむ', 'ayumu']],
    examples: [['歩く', 'aruku'], ['一歩', 'ippo']],
  },
  {
    kanji: '風',
    readings: [['ふう', 'fuu'], ['ふ', 'fu'], ['かぜ', 'kaze'], ['かざ', 'kaza']],
    examples: [['風', 'kaze'], ['台風', 'taifuu']],
  },
  {
    kanji: '紙',
    readings: [['し', 'shi'], ['かみ', 'kami']],
    examples: [['紙', 'kami'], ['手紙', 'tegami']],
  },
  {
    kanji: '黒',
    readings: [['こく', 'koku'], ['くろ', 'kuro'], ['くろずむ', 'kurozumu']],
    examples: [['黒い', 'kuroi'], ['黒板', 'kokuban']],
  },
  {
    kanji: '春',
    readings: [['しゅん', 'shun'], ['はる', 'haru']],
    examples: [['春', 'haru'], ['春休み', 'haruyasumi']],
  },
  {
    kanji: '赤',
    readings: [['せき', 'seki'], ['しゃく', 'shaku'], ['あか', 'aka']],
    examples: [['赤い', 'akai'], ['赤字', 'akaji']],
  },
  {
    kanji: '青',
    readings: [['せい', 'sei'], ['しょう', 'shou'], ['あお', 'ao']],
    examples: [['青', 'ao'], ['青年', 'seinen']],
  },
  {
    kanji: '森',
    readings: [['しん', 'shin'], ['もり', 'mori']],
    examples: [['森', 'mori'], ['森林', 'shinrin']],
  },
  {
    kanji: '館',
    readings: [['かん', 'kan'], ['やかた', 'yakata'], ['たて', 'tate']],
    examples: [['会館', 'kaikan'], ['大使館', 'taishikan']],
  },
  {
    kanji: '屋',
    readings: [['おく', 'oku'], ['や', 'ya']],
    examples: [['部屋', 'heya'], ['屋根', 'yane']],
  },
  {
    kanji: '色',
    readings: [['しょく', 'shoku'], ['しき', 'shiki'], ['いろ', 'iro']],
    examples: [['色', 'iro'], ['色彩', 'shikisai']],
  },
  {
    kanji: '走',
    readings: [['そう', 'sou'], ['はしる', 'hashiru']],
    examples: [['走る', 'hashiru'], ['走者', 'sousha']],
  },
  {
    kanji: '秋',
    readings: [['しゅう', 'shuu'], ['あき', 'aki'], ['とき', 'toki']],
    examples: [['秋', 'aki'], ['秋風', 'akikaze']],
  },
  {
    kanji: '林',
    readings: [['りん', 'rin'], ['はやし', 'hayashi']],
    examples: [['林', 'hayashi'], ['森林', 'shinrin']],
  },
  {
    kanji: '夏',
    readings: [['か', 'ka'], ['が', 'ga'], ['なつ', 'natsu']],
    examples: [['夏', 'natsu'], ['今夏', 'konka']],
  },
  {
    kanji: '顔',
    readings: [['がん', 'gan'], ['かお', 'kao']],
    examples: [['顔', 'kao'], ['笑顔', 'egao']],
  },
  {
    kanji: '短',
    readings: [['たん', 'tan'], ['みじかい', 'mijikai']],
    examples: [['短い', 'mijikai'], ['短期', 'tanki']],
  },
  {
    kanji: '薬',
    readings: [['やく', 'yaku'], ['くすり', 'kusuri']],
    examples: [['薬', 'kusuri'], ['薬局', 'yakkyoku']],
  },
  {
    kanji: '習',
    readings: [['しゅう', 'shuu'], ['じゅ', 'ju'], ['ならう', 'narau'], ['ならい', 'narai']],
    examples: [['練習', 'renshuu'], ['学習', 'gakushuu']],
  },
  {
    kanji: '便',
    readings: [['べん', 'ben'], ['びん', 'bin'], ['たより', 'tayori']],
    examples: [['郵便', 'yuubin'], ['便利', 'benri']],
  },
  {
    kanji: '洋',
    readings: [['よう', 'you']],
    examples: [['東洋', 'touyou'], ['海洋', 'kaiyou']],
  },
  {
    kanji: '旅',
    readings: [['りょ', 'ryo'], ['たび', 'tabi']],
    examples: [['旅', 'tabi'], ['旅行', 'ryokou']],
  },
  {
    kanji: '軽',
    readings: [['けい', 'kei'], ['きょう', 'kyou'], ['かるい', 'karui'], ['かろやか', 'karoyaka']],
    examples: [['軽い', 'karui'], ['手軽', 'tegaru']],
  },
  {
    kanji: '池',
    readings: [['ち', 'chi'], ['いけ', 'ike']],
    examples: [['池', 'ike'], ['電池', 'denchi']],
  },
  {
    kanji: '服',
    readings: [['ふく', 'fuku']],
    examples: [['服', 'fuku'], ['制服', 'seifuku']],
  },
  {
    kanji: '遠',
    readings: [['えん', 'en'], ['おん', 'on'], ['とおい', 'tooi']],
    examples: [['遠い', 'tooi'], ['遠く', 'tooku']],
  },
  {
    kanji: '夕',
    readings: [['せき', 'seki'], ['ゆう', 'yuu']],
    examples: [['夕方', 'yuugata'], ['夕食', 'yuushoku']],
  },
  {
    kanji: '借',
    readings: [['しゃく', 'shaku'], ['かりる', 'kariru']],
    examples: [['借りる', 'kariru'], ['借金', 'shakkin']],
  },
  {
    kanji: '曜',
    readings: [['よう', 'you']],
    examples: [['土曜', 'doyou'], ['曜日', 'youbi']],
  },
  {
    kanji: '弱',
    readings: [['じゃく', 'jaku'], ['よわい', 'yowai'], ['よわる', 'yowaru']],
    examples: [['弱い', 'yowai'], ['弱点', 'jakuten']],
  },
  {
    kanji: '肉',
    readings: [['にく', 'niku'], ['しし', 'shishi']],
    examples: [['肉', 'niku'], ['牛肉', 'gyuuniku']],
  },
  {
    kanji: '貸',
    readings: [['たい', 'tai'], ['かす', 'kasu'], ['かし', 'kashi']],
    examples: [['貸す', 'kasu'], ['貸し出し', 'kashidashi']],
  },
  {
    kanji: '堂',
    readings: [['どう', 'dou']],
    examples: [['食堂', 'shokudou'], ['堂々', 'doudou']],
  },
  {
    kanji: '暗',
    readings: [['あん', 'an'], ['くらい', 'kurai'], ['くらむ', 'kuramu']],
    examples: [['暗い', 'kurai'], ['暗記', 'anki']],
  },
  {
    kanji: '鳥',
    readings: [['ちょう', 'chou'], ['とり', 'tori']],
    examples: [['鳥', 'tori'], ['小鳥', 'kotori']],
  },
  {
    kanji: '飯',
    readings: [['はん', 'han'], ['めし', 'meshi']],
    examples: [['飯', 'meshi'], ['ご飯', 'gohan']],
  },
  {
    kanji: '勉',
    readings: [['べん', 'ben'], ['つとめる', 'tsutomeru']],
    examples: [['勉強', 'benkyou'], ['勤勉', 'kinben']],
  },
  {
    kanji: '冬',
    readings: [['とう', 'tou'], ['ふゆ', 'fuyu']],
    examples: [['冬', 'fuyu'], ['冬休み', 'fuyuyasumi']],
  },
  {
    kanji: '昼',
    readings: [['ちゅう', 'chuu'], ['ひる', 'hiru']],
    examples: [['昼', 'hiru'], ['昼食', 'chuushoku']],
  },
  {
    kanji: '茶',
    readings: [['ちゃ', 'cha'], ['さ', 'sa']],
    examples: [['お茶', 'ocha'], ['茶色', 'chairo']],
  },
  {
    kanji: '弟',
    readings: [['てい', 'tei'], ['だい', 'dai'], ['おとうと', 'otouto']],
    examples: [['兄弟', 'kyoudai'], ['弟子', 'deshi']],
  },
  {
    kanji: '洗',
    readings: [['せん', 'sen'], ['あらう', 'arau']],
    examples: [['洗う', 'arau'], ['洗濯', 'sentaku']],
  },
  {
    kanji: '牛',
    readings: [['ぎゅう', 'gyuu'], ['うし', 'ushi']],
    examples: [['牛', 'ushi'], ['牛乳', 'gyuunyuu']],
  },
  {
    kanji: '兄',
    readings: [['けい', 'kei'], ['きょう', 'kyou'], ['あに', 'ani']],
    examples: [['兄', 'ani'], ['兄弟', 'kyoudai']],
  },
  {
    kanji: '犬',
    readings: [['けん', 'ken'], ['いぬ', 'inu']],
    examples: [['犬', 'inu'], ['子犬', 'koinu']],
  },
  {
    kanji: '菜',
    readings: [['さい', 'sai'], ['な', 'na']],
    examples: [['白菜', 'hakusai'], ['菜食', 'saishoku']],
  },
  {
    kanji: '暑',
    readings: [['しょ', 'sho'], ['あつい', 'atsui']],
    examples: [['暑い', 'atsui'], ['暑さ', 'atsusa']],
  },
  {
    kanji: '妹',
    readings: [['まい', 'mai'], ['いもうと', 'imouto']],
    examples: [['妹', 'imouto'], ['姉妹', 'shimai']],
  },
  {
    kanji: '寒',
    readings: [['かん', 'kan'], ['さむい', 'samui']],
    examples: [['寒い', 'samui'], ['寒さ', 'samusa']],
  },
  {
    kanji: '姉',
    readings: [['し', 'shi'], ['あね', 'ane'], ['はは', 'haha']],
    examples: [['姉', 'ane'], ['姉妹', 'shimai']],
  },
  {
    kanji: '漢',
    readings: [['かん', 'kan']],
    examples: [['漢字', 'kanji'], ['漢和', 'kanwa']],
  },
]

export function createN4KanjiDeck(now = Date.now()): Deck {
  return {
    id: N4_KANJI_DECK_ID,
    name: '',
    nameJp: 'N4 漢字',
    description: '',
    accent: '#6C5AA8',
    builtin: true,
    kind: 'kanji',
    createdAt: now,
  }
}

export function createN4KanjiCards(now = Date.now()): Card[] {
  return N4_KANJI.map((entry, index) => {
    const number = String(index + 1).padStart(3, '0')
    return {
      id: `${N4_KANJI_DECK_ID}-${number}`,
      deckId: N4_KANJI_DECK_ID,
      front: entry.kanji,
      reading: '',
      meaning: '',
      note: '',
      mnemonic: '',
      tags: ['N4'],
      jlpt: 4,
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
