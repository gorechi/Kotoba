import type { IconName } from '../components/Icon'
import type { Route } from '../types'

export type HelpSection = 'system' | 'learning'

export interface HelpText {
  ru: string
  en: string
}

export interface HelpStep {
  title: HelpText
  text: HelpText
  tip?: HelpText
}

export interface HelpGuide {
  id: string
  section: HelpSection
  icon: IconName
  title: HelpText
  description: HelpText
  time: HelpText
  intro: HelpText
  steps: HelpStep[]
  note?: {
    title: HelpText
    text: HelpText
  }
  target?: {
    label: HelpText
    route: Route
  }
}

const L = (ru: string, en: string): HelpText => ({ ru, en })

const step = (
  ruTitle: string,
  enTitle: string,
  ruText: string,
  enText: string,
  tipRu?: string,
  tipEn?: string,
): HelpStep => ({
  title: L(ruTitle, enTitle),
  text: L(ruText, enText),
  tip: tipRu && tipEn ? L(tipRu, tipEn) : undefined,
})

/** Текст инструкции на языке интерфейса, с английским запасным вариантом. */
export function helpText(value: HelpText, language: string): string {
  return value[language as keyof HelpText] ?? value.en
}

export const HELP_GUIDES: HelpGuide[] = [
  {
    id: 'custom-study',
    section: 'learning',
    icon: 'bookmark',
    title: L('Создание своих подборок', 'Creating custom study sets'),
    description: L(
      'Как собрать личную подборку карточек под конкретную цель.',
      'How to build a personal study set for a specific goal.',
    ),
    time: L('3 минуты', '3 min'),
    intro: L(
      'Подборка — это сохранённые правила, а не копия карточек. Котоба каждый раз заново выбирает карточки, которые подходят под фильтры. Поэтому новые подходящие карточки появляются в подборке автоматически.',
      'A study set stores rules, not copies of cards. Kotoba rebuilds the selection from your current cards every time you start it, so new matching cards appear automatically.',
    ),
    steps: [
      step(
        'Откройте главную',
        'Open the Home screen',
        'В боковом меню выберите «Учить». Найдите блок «Своя подборка»: в нём есть готовые наборы и ваши собственные.',
        'Choose Study in the sidebar. Find the Custom study section: it contains preset sets and your own sets.',
      ),
      step(
        'Нажмите «Настроить»',
        'Click Set up',
        'Откроется конструктор подборки. Здесь задаются название и правила отбора карточек.',
        'The set builder opens. Here you choose a name and the rules for selecting cards.',
      ),
      step(
        'Придумайте название',
        'Give the set a name',
        'Например, «Кандзи перед сном» или «Ошибки за неделю». Без названия сохранить подборку нельзя.',
        'For example, “Kanji before bed” or “Mistakes this week”. A name is required to save the set.',
      ),
      step(
        'Выберите правила',
        'Choose the rules',
        'Колода, статус, тип, JLPT, тег и размер набора. Статус «просроченные» выбирает карточки, которые уже ждут повторения; «новые» — ещё не изученные; «ошибки» — карточки с оценкой «Снова» за последние 7 дней.',
        'Deck, status, type, JLPT, tag, and set size. “Overdue” picks cards already waiting for review, “New” picks cards not introduced yet, and “Mistakes” picks cards rated Again in the last 7 days.',
      ),
      step(
        'Проверьте счётчик',
        'Check the counter',
        'Под фильтрами видно, сколько карточек подходит. Если карточек 0, ослабьте фильтры или выберите другую колоду.',
        'The builder shows how many cards match. If the count is 0, relax the filters or choose another deck.',
      ),
      step(
        'Сохраните или начните',
        'Save or start',
        '«Сохранить» добавит подборку в группу «Мои наборы». «Начать» запустит её сразу, без сохранения.',
        'Save adds the set to My sets. Start runs it immediately without saving.',
      ),
      step(
        'Управляйте набором',
        'Manage the set',
        'Клик по карточке запускает подборку. Карандаш меняет название и правила, корзина удаляет подборку. Сами карточки при этом остаются в колодах.',
        'Click a set card to start it. The pencil edits its name and rules; the trash icon deletes the set. The cards themselves stay in their decks.',
      ),
    ],
    note: {
      title: L('Полезно знать', 'Good to know'),
      text: L(
        'Готовые наборы помечены замком: их нельзя изменить. Подборки не учитывают дневные лимиты колод — это режим свободной практики.',
        'Preset sets are marked with a lock and cannot be edited. Custom sets ignore daily deck limits — they are a free-practice mode.',
      ),
    },
    target: {
      label: L('Открыть главную', 'Open Home'),
      route: { name: 'home' },
    },
  },
  {
    id: 'cards-screen',
    section: 'learning',
    icon: 'layers',
    title: L('Работа с карточками на экране «Карточки»', 'Working with cards on the Cards screen'),
    description: L(
      'Поиск, фильтры, массовые действия и уход за карточками в одном месте.',
      'Search, filters, bulk actions, and card maintenance in one place.',
    ),
    time: L('4 минуты', '4 min'),
    intro: L(
      'Экран «Карточки» показывает все карточки из всех колод. Здесь удобно найти нужное, навести порядок в тегах и колодах, приостановить карточки или вернуть их в учёбу.',
      'The Cards screen shows every card from every deck. Use it to find cards, organize tags and decks, suspend cards, or return them to study.',
    ),
    steps: [
      step(
        'Откройте «Карточки»',
        'Open Cards',
        'В боковом меню выберите «Карточки». Это общий список, а не отдельная колода.',
        'Choose Cards in the sidebar. This is the full list, not a single deck.',
      ),
      step(
        'Найдите карточку',
        'Find a card',
        'Строка поиска ищет по слову, чтению, переводу и тегам. Фильтры по колоде, типу, статусу и тегам помогают сузить список.',
        'Search looks through the word, reading, meaning, and tags. Filters for deck, type, status, and tags narrow the list further.',
      ),
      step(
        'Настройте порядок',
        'Choose the order',
        'Сортировка доступна по дате, алфавиту, интервалу и числу ошибок. Кнопка «Показать ещё» раскрывает следующие карточки.',
        'Sort by date, alphabet, interval, or number of mistakes. Show more reveals the next batch of cards.',
      ),
      step(
        'Посмотрите карточку',
        'Preview a card',
        'Иконка глаза открывает просмотр: чтения, примеры, статус, интервал, дата создания и теги. Это не редактирование.',
        'The eye icon opens a preview with readings, examples, status, interval, creation date, and tags. It does not edit the card.',
      ),
      step(
        'Выберите карточки',
        'Select cards',
        'Поставьте галочки у нужных карточек или нажмите «Выбрать все». Внизу появится панель массовых действий.',
        'Check individual cards or click Select all. A bulk action panel appears.',
      ),
      step(
        'Что можно сделать',
        'Use bulk actions',
        'Перенести в колоду, добавить тег, приостановить или вернуть в учёбу, пометить выученными, сбросить прогресс или удалить. Кана и кандзи переносятся только в колоды своего типа.',
        'Move to a deck, add a tag, suspend or resume, mark as known, reset progress, or delete. Kana and kanji can only move to decks of the same type.',
      ),
      step(
        'Перетаскивание',
        'Drag and drop',
        'Карточку можно перетащить в колоду того же типа. Защищённые карточки встроенной каны не перемещаются, не тегируются и не удаляются.',
        'You can drag a card into a deck of the same type. Protected built-in kana cards cannot be moved, tagged, or deleted.',
      ),
    ],
    note: {
      title: L('Полезно знать', 'Good to know'),
      text: L(
        'Изменения сохраняются автоматически. «Сбросить прогресс» не удаляет карточку, а делает её новой. Удаление карточки необратимо.',
        'Changes save automatically. Reset progress does not delete a card; it makes it new again. Deleting a card is permanent.',
      ),
    },
    target: {
      label: L('Открыть карточки', 'Open Cards'),
      route: { name: 'cards' },
    },
  },
  {
    id: 'kana-card',
    section: 'learning',
    icon: 'kana',
    title: L('Заполнение карточки каны', 'Filling in a kana card'),
    description: L(
      'Как добавить знак, чтение, перевод и заметку без японской раскладки.',
      'How to add a character, reading, translation, and note without a Japanese keyboard.',
    ),
    time: L('2 минуты', '2 min'),
    intro: L(
      'Карточка каны — это сам знак, его чтение и, при желании, перевод, заметка и теги. Встроенные азбуки уже заполнены; свои карточки можно добавлять в собственные колоды каны.',
      'A kana card contains the character, its reading, and optional meaning, note, and tags. Built-in kana decks are ready to use; you can add your own cards to custom kana decks.',
    ),
    steps: [
      step(
        'Откройте колоду каны',
        'Open a kana deck',
        'В боковом меню выберите «Кана» и откройте колоду. Для своих карточек создайте отдельную колоду.',
        'Choose Kana in the sidebar and open a deck. Create a separate deck for your own cards.',
      ),
      step(
        'Нажмите «Добавить карточку»',
        'Click Add card',
        'Откроется форма с живым превью карточки.',
        'The card form opens with a live preview.',
      ),
      step(
        'Введите знак',
        'Enter the character',
        'В поле «Слово или знак» наберите ромадзи. Переключатели «abc / あ / ア» задают режим ввода; поле само превратит текст в кану.',
        'Type romaji in the Word or character field. The “abc / あ / ア” toggles set the input mode; the field converts text to kana automatically.',
      ),
      step(
        'Проверьте чтение',
        'Check the reading',
        'Чтение подставляется автоматически. При необходимости исправьте его. Вид транскрипции — ромадзи или кириллица — выбирается в настройках.',
        'The reading is filled in automatically. Adjust it if needed. Choose romaji or Cyrillic transcription in Settings.',
      ),
      step(
        'Добавьте смысл',
        'Add meaning and context',
        'Перевод, заметку, JLPT, частоту и теги можно заполнить по желанию. Теги потом помогут собирать подборки.',
        'Meaning, note, JLPT level, frequency, and tags are optional. Tags can be used later in custom study sets.',
      ),
      step(
        'Сохраните',
        'Save the card',
        '«Добавить» сохранит карточку. «Добавить и ещё» или Ctrl+Enter оставят форму открытой для следующей.',
        'Add card saves the card. Add and keep going or Ctrl+Enter keeps the form open for the next card.',
      ),
    ],
    note: {
      title: L('Совет', 'Tip'),
      text: L(
        'Во встроенных колодах каны карточки защищены от изменений. Создайте свою колоду каны — и добавляйте в неё любые знаки, слова и примеры.',
        'Cards in built-in kana decks are protected. Create your own kana deck to add any characters, words, and examples.',
      ),
    },
    target: {
      label: L('Открыть кану', 'Open Kana'),
      route: { name: 'decks' },
    },
  },
  {
    id: 'kanji-card',
    section: 'learning',
    icon: 'kanji',
    title: L('Заполнение карточки кандзи', 'Filling in a kanji card'),
    description: L(
      'Иероглиф, чтения, примеры и всё, что делает карточку понятной.',
      'The character, readings, examples, and everything that makes a card clear.',
    ),
    time: L('3 минуты', '3 min'),
    intro: L(
      'Карточка кандзи хранит сам иероглиф, значение, варианты чтения и до двух примеров использования. Встроенные колоды N5 и N4 уже наполнены, но их можно свободно редактировать.',
      'A kanji card stores the character, meaning, readings, and up to two usage examples. The built-in N5 and N4 decks are filled in, but you can edit them freely.',
    ),
    steps: [
      step(
        'Откройте «Кандзи»',
        'Open Kanji',
        'В боковом меню выберите «Кандзи» и откройте нужную колоду.',
        'Choose Kanji in the sidebar and open the deck you need.',
      ),
      step(
        'Нажмите плюс',
        'Click the plus button',
        'Откроется форма новой карточки. Для редактирования нажмите карандаш у существующей карточки.',
        'The new-card form opens. To edit, click the pencil next to an existing card.',
      ),
      step(
        'Заполните основное',
        'Add the basics',
        'Введите сам иероглиф и его значение. Для встроенных карточек значение уже подставлено и переведено на язык приложения.',
        'Enter the character and its meaning. In built-in cards, the meaning is already provided and follows the app language.',
      ),
      step(
        'Добавьте чтения',
        'Add readings',
        'Кнопка «Добавить» в блоке чтений создаёт строку: кана и транскрипция. Можно добавить несколько вариантов — они пригодятся при повторении.',
        'Add in the Readings block creates a row for kana and transcription. Add several readings if the kanji has more than one.',
      ),
      step(
        'Добавьте примеры',
        'Add examples',
        'До двух примеров: слово или фраза, ромадзи и перевод. Кнопка «Добавить» создаёт новую строку, крестик удаляет её.',
        'Up to two examples: a word or phrase, romaji, and translation. Add creates another row; the cross removes it.',
      ),
      step(
        'Дополните карточку',
        'Add optional details',
        'JLPT, частоту, заметку и теги можно заполнить по желанию. Теги используются в фильтрах и подборках.',
        'JLPT, frequency, note, and tags are optional. Tags are used in filters and custom study sets.',
      ),
      step(
        'Сохраните',
        'Save the card',
        '«Сохранить» или «Добавить карточку» сохранит карточку. Ctrl+Enter сохранит и сразу откроет следующую.',
        'Save or Add card stores the card. Ctrl+Enter saves and opens the next one immediately.',
      ),
    ],
    note: {
      title: L('Полезно знать', 'Good to know'),
      text: L(
        'Встроенные колоды N5 и N4 можно редактировать. Ваши изменения сохраняются и не перезаписываются при обновлении приложения.',
        'The built-in N5 and N4 decks can be edited. Your changes are preserved and are not overwritten when the app updates.',
      ),
    },
    target: {
      label: L('Открыть кандзи', 'Open Kanji'),
      route: { name: 'kanji' },
    },
  },
  {
    id: 'study-modes',
    section: 'learning',
    icon: 'book',
    title: L('Что такое режимы «Чтение» и «Письмо»', 'What Reading and Writing modes mean'),
    description: L(
      'Два способа тренировки: узнавать японский текст или вспоминать его по переводу.',
      'Two ways to practice: recognize Japanese text or recall it from the translation.',
    ),
    time: L('2 минуты', '2 min'),
    intro: L(
      'Режим определяет, что показывается на карточке первой и что вы тренируете. Оба режима используют один и тот же прогресс SRS, поэтому переключение не сбрасывает повторения.',
      'The mode decides what appears on the card first and what you practice. Both modes share the same SRS progress, so switching does not reset reviews.',
    ),
    steps: [
      step(
        'Найдите переключатель',
        'Find the mode switch',
        'Переключатель «Чтение / Письмо» есть на странице колоды и в списках колод.',
        'The Reading / Writing switch is available on deck pages and in deck lists.',
      ),
      step(
        'Режим «Чтение»',
        'Reading mode',
        'Сначала показывается японская сторона. Вспомните чтение и значение, переверните карточку и проверьте себя. Кнопка динамика озвучит слово.',
        'The Japanese side appears first. Recall the reading and meaning, flip the card, and check yourself. The speaker button plays the word.',
      ),
      step(
        'Режим «Письмо»',
        'Writing mode',
        'Показывается значение или чтение. Напишите японский вариант в тетради, затем переверните карточку и сравните.',
        'The meaning or reading appears. Write the Japanese in a notebook, then flip the card and compare.',
      ),
      step(
        'Сложность письма',
        'Writing difficulty',
        'В настройках выберите «Обычный» или «Сложный». В сложном режиме транскрипция скрыта до переворота карточки.',
        'Choose Normal or Hard in Settings. In Hard mode, the transcription is hidden until you flip the card.',
      ),
      step(
        'Настройка для колоды',
        'Per-deck setting',
        'Режим можно задать глобально или отдельно для конкретной колоды. Настройка колоды имеет приоритет.',
        'Set the mode globally or per deck. Deck settings take priority.',
      ),
    ],
    note: {
      title: L('Совет', 'Tip'),
      text: L(
        '«Письмо» — это тренировка на бумаге. Приложение не распознаёт почерк, но показывает правильный ответ и сохраняет оценку в SRS.',
        'Writing mode is notebook practice. The app does not recognize handwriting, but it shows the correct answer and records your rating in SRS.',
      ),
    },
    target: {
      label: L('Открыть колоды', 'Open decks'),
      route: { name: 'decks' },
    },
  },
  {
    id: 'backup',
    section: 'system',
    icon: 'database',
    title: L('Импорт и экспорт данных', 'Importing and exporting data'),
    description: L(
      'Резервная копия, перенос данных и безопасный сброс прогресса.',
      'Backups, moving data, and safely resetting progress.',
    ),
    time: L('3 минуты', '3 min'),
    intro: L(
      'Резервная копия — это один JSON-файл. В нём сохраняются колоды, карточки, подборки, настройки, прогресс SRS и история. Импорт заменяет текущие данные целиком, а не объединяет их.',
      'A backup is a single JSON file containing decks, cards, study sets, settings, SRS progress, and history. Import replaces your current data completely; it does not merge it.',
    ),
    steps: [
      step(
        'Откройте «Данные»',
        'Open Data',
        'В боковом меню выберите «Данные», затем вкладку «Резервная копия».',
        'Choose Data in the sidebar, then open the Backup tab.',
      ),
      step(
        'Экспортируйте копию',
        'Export a backup',
        'Нажмите «Экспорт». В установленном приложении откроется проводник, в браузере файл «kotoba-backup.json» скачается.',
        'Click Export. In the installed app a save dialog opens; in the browser, “kotoba-backup.json” is downloaded.',
      ),
      step(
        'Импортируйте копию',
        'Import a backup',
        'Нажмите «Импорт» и выберите JSON. Приложение покажет количество колод и карточек — проверьте его перед подтверждением.',
        'Click Import and choose a JSON file. The app shows the number of decks and cards; check it before confirming.',
      ),
      step(
        'Что происходит с данными',
        'What import does',
        'После подтверждения текущие колоды, карточки, подборки и прогресс заменяются данными из файла. Перед импортом сделайте экспорт текущего состояния.',
        'After confirmation, the current decks, cards, sets, and progress are replaced by the file contents. Export your current state before importing.',
      ),
      step(
        'Папка с данными',
        'Data folder',
        'В установленном приложении кнопка «Папка с данными» открывает файлы контента, настроек, прогресса и истории.',
        'In the installed app, the Data folder button opens the content, settings, progress, and history files.',
      ),
      step(
        'Сброс прогресса',
        'Reset progress',
        'Отдельная кнопка сбрасывает SRS и статистику, но оставляет колоды, карточки и подборки. Это удобно, чтобы начать курс заново.',
        'A separate button resets SRS and statistics while keeping decks, cards, and sets. Use it to start the course over.',
      ),
    ],
    note: {
      title: L('Совет', 'Tip'),
      text: L(
        'Храните резервную копию вне папки приложения и делайте её перед экспериментами с импортом, сбросом или обновлением.',
        'Keep a backup outside the app folder and make one before experimenting with import, reset, or updates.',
      ),
    },
    target: {
      label: L('Открыть данные', 'Open Data'),
      route: { name: 'data' },
    },
  },
  {
    id: 'csv-import',
    section: 'system',
    icon: 'upload',
    title: L('Загрузка данных из CSV', 'Importing data from CSV'),
    description: L(
      'Как быстро добавить много карточек из таблицы CSV или TSV.',
      'How to add many cards quickly from a CSV or TSV spreadsheet.',
    ),
    time: L('4 минуты', '4 min'),
    intro: L(
      'Импорт CSV/TSV добавляет карточки в выбранную или новую колоду. Он не заменяет существующие данные и не переносит прогресс: импортированные карточки начинают изучение с нуля.',
      'CSV/TSV import adds cards to a selected or new deck. It does not replace existing data and does not import progress: imported cards start as new.',
    ),
    steps: [
      step(
        'Откройте «Данные»',
        'Open Data',
        'Выберите вкладку «Кана» или «Кандзи». Тип вкладки определяет, в колоды какого типа можно импортировать карточки.',
        'Choose the Kana or Kanji tab. The tab determines which deck type you can import into.',
      ),
      step(
        'Выберите файл',
        'Choose a file',
        'Поддерживаются только «.csv» и «.tsv». Если первая строка — названия столбцов, включите «Первая строка — заголовок».',
        'Only “.csv” and “.tsv” files are supported. If the first row contains column names, enable “First row contains headers”.',
      ),
      step(
        'Проверьте разделитель',
        'Check the delimiter',
        'Обычно разделитель определяется автоматически. Если нет — выберите запятую, точку с запятой или табуляцию.',
        'The delimiter is usually detected automatically. If not, choose comma, semicolon, or tab.',
      ),
      step(
        'Выберите колоду',
        'Choose a deck',
        'Можно создать новую колоду или выбрать существующую. Встроенные каны недоступны для импорта; встроенные кандзи N5/N4 доступны.',
        'Create a new deck or choose an existing one. Built-in kana decks are unavailable; built-in N5/N4 kanji decks are available.',
      ),
      step(
        'Сопоставьте столбцы',
        'Map the columns',
        'Обязательные поля отмечены. Остальные можно пропустить. Перед импортом проверьте примеры значений под каждым столбцом.',
        'Required fields are marked. Other fields can be skipped. Check the sample values under each column before importing.',
      ),
      step(
        'Импортируйте',
        'Import',
        'Нажмите «Продолжить» и дождитесь сообщения об успехе. Карточки появятся в выбранной колоде.',
        'Click Continue and wait for the success message. The cards appear in the selected deck.',
      ),
    ],
    note: {
      title: L('Полезно знать', 'Good to know'),
      text: L(
        'Используйте UTF-8 и одну карточку на строку. Повторный импорт того же файла создаст дубликаты, поэтому проверяйте список перед загрузкой.',
        'Use UTF-8 and one card per row. Importing the same file twice creates duplicates, so check the list before uploading.',
      ),
    },
    target: {
      label: L('Открыть данные', 'Open Data'),
      route: { name: 'data' },
    },
  },
  {
    id: 'system-setup',
    section: 'system',
    icon: 'sliders',
    title: L('Настройка системы', 'System setup'),
    description: L(
      'Язык, тема, темп, цели, транскрипция и другие настройки приложения.',
      'Language, theme, pace, goals, transcription, and other app settings.',
    ),
    time: L('3 минуты', '3 min'),
    intro: L(
      'Настройки применяются сразу и сохраняются автоматически. Глобальные параметры находятся в разделе «Настройки», а лимиты и режим конкретной колоды — на её странице.',
      'Settings apply immediately and save automatically. Global options are in Settings; per-deck limits and modes are on the deck page.',
    ),
    steps: [
      step(
        'Откройте «Настройки»',
        'Open Settings',
        'В боковом меню выберите «Настройки». Отдельной кнопки «Сохранить» нет: изменения применяются сразу.',
        'Choose Settings in the sidebar. There is no Save button; changes apply immediately.',
      ),
      step(
        'Язык и тема',
        'Language and theme',
        'Выберите язык интерфейса и тему: светлую, тёмную или системную. Язык влияет и на встроенные значения кандзи.',
        'Choose the interface language and a light, dark, or system theme. The language also affects built-in kanji meanings.',
      ),
      step(
        'Темп обучения',
        'Study pace',
        '«Новых карточек в день» задаёт размер ежедневной порции. 5–10 — комфортный старт; значение можно менять в любой момент.',
        'New cards per day sets the daily batch size. 5–10 is a comfortable start, and you can change it at any time.',
      ),
      step(
        'Цели',
        'Goals',
        'Дневная цель считается по повторениям или минутам. Долгосрочные цели показывают прогресс по карточкам и серии дней.',
        'The daily goal can be based on reviews or minutes. Long-term goals track card progress and streak.',
      ),
      step(
        'Транскрипция и письмо',
        'Transcription and writing',
        'Выберите ромадзи или кириллицу для новых карточек. Сложность письма управляет тем, когда показывать подсказку в режиме «Письмо».',
        'Choose romaji or Cyrillic for new cards. Writing difficulty controls when hints appear in Writing mode.',
      ),
      step(
        'Дзен и горячие клавиши',
        'Zen and shortcuts',
        'Настройте автозапуск Дзена после бездействия. Список горячих клавиш находится внизу страницы настроек.',
        'Configure automatic Zen mode after inactivity. The shortcut list is at the bottom of Settings.',
      ),
      step(
        'Данные и озвучка',
        'Data and speech',
        'Резервные копии находятся в разделе «Данные». Если голос не звучит, откройте инструкцию «Как включить озвучку» в помощи.',
        'Backups are in Data. If speech is silent, open the “How to enable speech” guide in Help.',
      ),
    ],
    note: {
      title: L('Полезно знать', 'Good to know'),
      text: L(
        'Настройки колоды — лимиты, порядок карточек и режим — находятся на странице колоды и имеют приоритет над глобальными.',
        'Deck settings — limits, card order, and mode — are on the deck page and take priority over global settings.',
      ),
    },
    target: {
      label: L('Открыть настройки', 'Open Settings'),
      route: { name: 'settings' },
    },
  },
]

export function findHelpGuide(id: string): HelpGuide | undefined {
  return HELP_GUIDES.find((guide) => guide.id === id)
}
