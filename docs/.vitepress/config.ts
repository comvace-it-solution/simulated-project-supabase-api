import { defineConfig } from "vitepress";

// docs/ 配下の Markdown をそのまま静的サイトとして公開する設定。
// 仕様の正は実装（supabase/functions と supabase/migrations）で、
// このサイトはその内容を読みやすく見せるための生成物として扱う。
export default defineConfig({
  lang: "ja-JP",
  title: "勤怠管理システム 仕様書",
  description: "Supabase Edge Functions で提供する勤怠管理 API と DB の仕様書",
  lastUpdated: true,
  cleanUrls: true,

  // GitHub Pages の project site で公開するため、リポジトリ名をベースパスにする。
  // https://comvace-it-solution.github.io/simulated-project-supabase-api/
  base: "/simulated-project-supabase-api/",

  themeConfig: {
    nav: [
      { text: "ホーム", link: "/" },
      {
        text: "API仕様",
        items: [
          { text: "API仕様書", link: "/api-spec" },
          { text: "APIエラー仕様書", link: "/api-spec-errors" },
        ],
      },
      { text: "DB仕様", link: "/db-spec" },
    ],

    sidebar: [
      {
        text: "はじめに",
        items: [{ text: "概要", link: "/" }],
      },
      {
        text: "API仕様",
        collapsed: false,
        items: [
          { text: "API仕様書", link: "/api-spec" },
          { text: "APIエラー仕様書", link: "/api-spec-errors" },
        ],
      },
      {
        text: "DB仕様",
        collapsed: false,
        items: [{ text: "DB仕様書", link: "/db-spec" }],
      },
    ],

    // API仕様書は 1 API = h2 の構成なので、目次は h2 までに絞る。
    outline: { level: 2, label: "このページの目次" },

    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "検索", buttonAriaLabel: "検索" },
          modal: {
            displayDetails: "詳細を表示",
            resetButtonTitle: "条件をリセット",
            backButtonTitle: "閉じる",
            noResultsText: "該当する項目がありません",
            footer: {
              selectText: "選択",
              navigateText: "移動",
              closeText: "閉じる",
            },
          },
        },
      },
    },

    docFooter: { prev: "前のページ", next: "次のページ" },
    lastUpdatedText: "最終更新",
    darkModeSwitchLabel: "テーマ",
    lightModeSwitchTitle: "ライトモードに切り替え",
    darkModeSwitchTitle: "ダークモードに切り替え",
    sidebarMenuLabel: "メニュー",
    returnToTopLabel: "トップへ戻る",
    externalLinkIcon: true,
  },
});
