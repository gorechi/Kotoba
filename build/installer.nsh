; Дополнительный экран установщика: выбор языка приложения.
;
; Подключается через nsis.include. Скрипт попадает в шапку установщика до
; MUI2, поэтому здесь только определения: макросы раскрываются позже, когда
; MUI и языковые файлы уже подключены.
;
; Выбранный язык записывается в %APPDATA%\kotoba\installer-language.txt.
; Приложение читает его только при первом запуске и только если настроек
; ещё нет. При обновлении экран не показывается, а язык берётся из настроек.

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!define KOTOBA_SETTINGS_FILE "kotoba-settings.json"
!define KOTOBA_LANGUAGE_FILE "installer-language.txt"

!ifndef BUILD_UNINSTALLER
  Var kotobaLangDialog
  Var kotobaLangEnglish
  Var kotobaLangRussian
  Var kotobaLangSpanish
  Var kotobaInstallerLanguage
!endif

; Строки страницы. Вставляется после addLangs, когда языки уже загружены.
!macro customHeader
  LangString KOTOBA_LANG_TITLE 1033 "Choose the installation language"
  LangString KOTOBA_LANG_TITLE 1049 "Выберите язык установки"
  LangString KOTOBA_LANG_TITLE 3082 "Elige el idioma de instalación"

  LangString KOTOBA_LANG_SUBTITLE 1033 "Kotoba will start in this language. You can change it later in Settings."
  LangString KOTOBA_LANG_SUBTITLE 1049 "Котоба запустится на этом языке. Позже его можно изменить в настройках."
  LangString KOTOBA_LANG_SUBTITLE 3082 "Kotoba se iniciará en este idioma. Puedes cambiarlo más tarde en los ajustes."
!macroend

; Значение по умолчанию: язык, на котором запущен сам установщик.
!macro preInit
  !ifndef BUILD_UNINSTALLER
    StrCpy $kotobaInstallerLanguage "en"
    ${If} $LANGUAGE == 1049
      StrCpy $kotobaInstallerLanguage "ru"
    ${ElseIf} $LANGUAGE == 3082
      StrCpy $kotobaInstallerLanguage "es"
    ${EndIf}
  !endif
!macroend

; Страница показывается после выбора папки и до установки.
; Функции объявлены внутри макроса: он раскрывается после подключения MUI2,
; иначе MUI_HEADER_TEXT ещё не существует.
!macro customPageAfterChangeDir
  !ifndef BUILD_UNINSTALLER
    Page custom KotobaLanguagePageCreate KotobaLanguagePageLeave

    Function KotobaLanguagePageCreate
      ; /choose-language принудительно показывает страницу — удобно для проверки
      ; на машине, где приложение уже установлено.
      ${GetParameters} $R8
      ${GetOptions} $R8 "/choose-language" $R9
      ${IfNot} ${Errors}
        Goto kotoba_lang_show
      ${EndIf}

      ; Обновление или переустановка поверх рабочих данных: язык уже выбран
      ; в приложении, спрашивать нечего.
      IfFileExists "$APPDATA\${APP_PACKAGE_NAME}\${KOTOBA_SETTINGS_FILE}" kotoba_lang_skip
      IfFileExists "$APPDATA\${APP_FILENAME}\${KOTOBA_SETTINGS_FILE}" kotoba_lang_skip
      Goto kotoba_lang_show

      kotoba_lang_skip:
        Abort

      kotoba_lang_show:
      !insertmacro MUI_HEADER_TEXT "$(KOTOBA_LANG_TITLE)" "$(KOTOBA_LANG_SUBTITLE)"

      nsDialogs::Create 1018
      Pop $kotobaLangDialog
      ${If} $kotobaLangDialog == error
        Abort
      ${EndIf}

      ${NSD_CreateRadioButton} 0 0 100% 18u "English"
      Pop $kotobaLangEnglish
      ${NSD_CreateRadioButton} 0 28u 100% 18u "Русский"
      Pop $kotobaLangRussian
      ${NSD_CreateRadioButton} 0 56u 100% 18u "Español"
      Pop $kotobaLangSpanish

      ${If} $kotobaInstallerLanguage == "ru"
        ${NSD_SetState} $kotobaLangRussian 1
      ${ElseIf} $kotobaInstallerLanguage == "es"
        ${NSD_SetState} $kotobaLangSpanish 1
      ${Else}
        ${NSD_SetState} $kotobaLangEnglish 1
      ${EndIf}

      nsDialogs::Show
    FunctionEnd

    Function KotobaLanguagePageLeave
      ${NSD_GetState} $kotobaLangRussian $0
      ${If} $0 == 1
        StrCpy $kotobaInstallerLanguage "ru"
      ${Else}
        ${NSD_GetState} $kotobaLangSpanish $0
        ${If} $0 == 1
          StrCpy $kotobaInstallerLanguage "es"
        ${Else}
          StrCpy $kotobaInstallerLanguage "en"
        ${EndIf}
      ${EndIf}
    FunctionEnd
  !endif
!macroend

; Маркер пишется только для чистой установки: если настройки приложения уже
; есть, язык должен остаться тем, что выбран в самом приложении.
!macro customInstall
  !ifndef BUILD_UNINSTALLER
    IfFileExists "$APPDATA\${APP_PACKAGE_NAME}\${KOTOBA_SETTINGS_FILE}" kotoba_lang_marker_done
    IfFileExists "$APPDATA\${APP_FILENAME}\${KOTOBA_SETTINGS_FILE}" kotoba_lang_marker_done

    ${If} $kotobaInstallerLanguage == ""
      StrCpy $kotobaInstallerLanguage "en"
    ${EndIf}

    CreateDirectory "$APPDATA\${APP_PACKAGE_NAME}"
    ClearErrors
    FileOpen $0 "$APPDATA\${APP_PACKAGE_NAME}\${KOTOBA_LANGUAGE_FILE}" w
    FileWrite $0 "$kotobaInstallerLanguage"
    FileClose $0

    kotoba_lang_marker_done:
  !endif
!macroend
