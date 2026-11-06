# 建立並發佈繁體中文 Google 表單

狀態：腳本已準備；尚未在 Google 帳戶執行，也尚未取得實際填寫連結。

1. 使用應擁有表單的 Google 帳戶開啟 https://script.google.com/home/start ，建立新專案。
2. 將 `publish-chinese-google-form.gs` 的完整內容貼入 `Code.gs`，取代預設範例並儲存。
3. 選擇函式 `createChineseAuditForm`，按「執行」，依 Google 畫面授權此專案使用表單服務。
4. 執行記錄會顯示「填寫連結」與「編輯連結」。將填寫連結提供給受訪者；編輯連結保留給管理者。
5. 在編輯頁的「發佈／管理回覆者」設定確認預期對象能填寫。請以未登入的瀏覽器開啟填寫連結，確認外部受訪者可存取；組織帳戶政策可能限制對外分享。

腳本建立四個主要區段、一個未參與相關流程者的補充分支，以及選填聯絡方式區段。第 15 題最多三項；不自動收集電子郵件、不限每帳戶一次、不公開回覆摘要、不寄送邀請。回覆保存在表單內；不另外建立回覆試算表。

在同一 Apps Script 專案重跑會返回既有表單，避免建立重複問卷。若建置中途失敗，腳本保留未發佈草稿並回報錯誤，不會自動刪除或重新建立。

外觀採 Google Forms 預設主題；分區與題目對應已核准預覽，但不是 HTML 預覽的逐像素複製。可在正式表單中調整主題色。

參考：[Google Forms Apps Script](https://developers.google.com/apps-script/reference/forms)、[發佈與回覆者權限](https://developers.google.com/workspace/forms/api/guides/publish-form)。
