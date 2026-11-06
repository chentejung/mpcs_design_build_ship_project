/**
 * Run createChineseAuditForm in Google Apps Script under the account that should own the form.
 * Creates and publishes only this questionnaire. Does not send invitations or expose response summaries.
 * Reruns return the same form; a partial failed build is not silently published.
 */
const QUESTIONNAIRE = {
  "intro": "我們想了解會計與查核團隊如何更新定期使用的 Excel 工作簿，以及編製或覆核財務報表。請依最近一次實際經驗回答，也歡迎分享現有流程做得好的地方。請勿填寫客戶名稱、機密金額或上傳文件。聯絡方式為選填，僅用於您選擇的後續交流。",
  "sections": [
    {
      "title": "第一部分｜您的工作背景",
      "intro": "先了解您的角色與實務經驗。",
      "questions": [
        [
          "1",
          "您目前主要從事哪一類工作？",
          "radio",
          [
            "外部財務報表查核",
            "企業內部會計",
            "會計主管／財務主管",
            "內部稽核",
            "其他確信或專業服務",
            "其他",
            "目前未從事相關工作"
          ]
        ],
        [
          "2",
          "在這個流程中，您主要負責什麼？",
          "radio",
          [
            "編製或更新 Excel 工作簿／工作底稿",
            "覆核工作底稿或分析結果",
            "編製財務報表",
            "覆核財務報表",
            "管理或核准整體流程",
            "未參與此流程",
            "其他"
          ]
        ],
        [
          "3a",
          "您主要在哪個國家或地區工作？",
          "text",
          []
        ],
        [
          "3b",
          "您處理的財務報表主要採用哪一種會計準則？",
          "radio",
          [
            "IFRS 國際財務報導準則",
            "US GAAP 美國一般公認會計原則",
            "當地會計準則（請補充）",
            "其他",
            "不確定／不適用"
          ]
        ],
        [
          "4",
          "您最近一次更新或覆核定期使用的會計工作簿或財務報表，是什麼時候？",
          "radio",
          [
            "過去一個月內",
            "一至三個月前",
            "四至十二個月前",
            "超過一年",
            "從未參與"
          ]
        ]
      ]
    },
    {
      "title": "第二部分｜最近一次的實際流程",
      "intro": "請以同一次工作經驗回答；不需要透露客戶名稱或機密資料。",
      "questions": [
        [
          "5",
          "當時哪一項工作花費最多實際操作時間？",
          "radio",
          [
            "取得或催收資料",
            "清理資料或調整格式",
            "更新來源工作表",
            "修正公式或連結",
            "核對餘額與調節差異",
            "分析並解釋變動",
            "編製財務報表或附註草稿",
            "覆核或修正成果",
            "其他",
            "不確定"
          ]
        ],
        [
          "6",
          "請簡述那次工作：您收到什麼資料、做了哪些處理，以及哪一步需要人工操作？",
          "textarea",
          []
        ],
        [
          "7",
          "上述最耗時的工作大約花了多少實際操作時間？",
          "radio",
          [
            "少於一小時",
            "一至三小時",
            "四至八小時",
            "九至二十小時",
            "超過二十小時",
            "不確定／不適用"
          ]
        ],
        [
          "8",
          "您多久會執行或覆核這個流程？",
          "radio",
          [
            "每月",
            "每季",
            "每年",
            "每個案件",
            "不定期",
            "其他"
          ]
        ]
      ]
    },
    {
      "title": "第三部分｜Excel 更新與差異分析",
      "intro": "這裡的「工作簿」指整個 Excel 檔案；「工作表」指其中的分頁。",
      "questions": [
        [
          "9",
          "新一期資料通常如何加入工作簿？",
          "checkbox",
          [
            "取代原有的來源資料",
            "在原有資料後新增交易",
            "修正已存在的交易",
            "重新整理資料連線或查詢",
            "手動更新計算結果或輸出儲存格",
            "每個工作表的處理方式不同",
            "不確定",
            "其他"
          ]
        ],
        [
          "10",
          "哪些計算規則或工作簿內容必須保留？您目前如何確認它們沒有被改動？",
          "textarea",
          []
        ],
        [
          "11",
          "更新資料後，您最常進行哪一種比較？",
          "radio",
          [
            "本期與前期比較",
            "同一期修正版與先前版本比較",
            "明細表與總帳／試算表比較",
            "實際結果與預算／預期比較",
            "其他比較",
            "未進行比較／不適用"
          ]
        ],
        [
          "12",
          "您實際使用哪些工具完成這些工作？",
          "checkbox",
          [
            "Excel（含 Power Query 或巨集）",
            "Caseware",
            "CCH",
            "Thomson Reuters Engagement Manager",
            "Fieldguide",
            "Workiva",
            "DataSnipper",
            "Truewind",
            "FloQast／BlackLine／Numeric",
            "公司或事務所自行開發的工具",
            "其他"
          ]
        ],
        [
          "13",
          "現有工具已經幫您做好哪些事？還有哪些步驟需要人工處理？",
          "textarea",
          []
        ]
      ]
    },
    {
      "title": "第四部分｜對產品構想的看法",
      "intro": "以下是尚在探索中的產品構想，並非已完成功能或效能承諾。\n\n我們正在探索一個助理：使用您現有的工作簿與企業提供的新資料，更新指定的來源區域、保留已確認的計算規則、找出差異，並產生供覆核的財務報表草稿。它會呈現變更與佐證來源，並標示缺漏資料或不確定的對應關係。",
      "questions": [
        [
          "14",
          "如果有幫助，這個助理對您最有價值的環節會是哪一項？",
          "radio",
          [
            "更新來源資料",
            "檢查工作簿與公式完整性",
            "差異分析",
            "編製財務報表或附註草稿",
            "協調上述整體流程",
            "現有工具已經能處理",
            "與我的工作無關",
            "不確定"
          ]
        ],
        [
          "15",
          "使用它產出的結果之前，您最需要確認哪些事項？",
          "checkbox",
          [
            "來源資料完整",
            "受保護的公式未被更動",
            "計算結果正確",
            "變動原因說明清楚",
            "能追溯至佐證資料",
            "與現有檔案及工具相容",
            "具有覆核與變更紀錄",
            "符合適用的報導架構",
            "其他",
            "不確定"
          ]
        ],
        [
          "16",
          "您認為試用這個流程最大的障礙是什麼？",
          "radio",
          [
            "資料使用或處理的核准",
            "初始設定或訓練成本",
            "準確性與額外覆核負擔",
            "檔案或系統相容性",
            "事務所方法論或公司政策",
            "價格或採購程序",
            "目前沒有明顯未被滿足的需求",
            "其他",
            "不確定"
          ]
        ],
        [
          "17",
          "您是否願意參與後續交流？",
          "radio",
          [
            "簡短訪談",
            "使用模擬資料測試原型",
            "兩者皆可",
            "只接收產品進度",
            "目前不需要"
          ]
        ]
      ]
    },
    {
      "title": "補充頁｜其他相關經驗",
      "intro": "如果您尚未參與上述流程，也歡迎分享其他相關工作經驗。我們會分開整理這類回覆。",
      "questions": [
        [
          "A1",
          "您目前有哪些與會計、查核或試算表相關的工作／學習經驗？",
          "textarea",
          []
        ],
        [
          "A2",
          "其中哪一個重複性步驟最困擾您？目前使用什麼工具？",
          "textarea",
          []
        ],
        [
          "A3",
          "您是否願意參與後續交流？",
          "radio",
          [
            "簡短訪談",
            "使用模擬資料測試原型",
            "兩者皆可",
            "只接收產品進度",
            "目前不需要"
          ]
        ]
      ]
    }
  ]
}
;
const FORM_KEY = 'AUDIT_QUESTIONNAIRE_ZH_HANT_FORM_ID';
const READY_KEY = 'AUDIT_QUESTIONNAIRE_ZH_HANT_READY';

function createChineseAuditForm() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const properties = PropertiesService.getScriptProperties();
    const existing = properties.getProperty(FORM_KEY);
    if (existing) {
      const form = FormApp.openById(existing);
      if (properties.getProperty(READY_KEY) !== 'true') {
        throw new Error('先前建立未完成；未自動重新建立或發佈。請查看原始錯誤並檢查草稿：' + form.getEditUrl());
      }
      publishAndPrintLinks_(form);
      return;
    }
    const form = FormApp.create('會計工作簿更新與財務報表流程調查', false);
    properties.setProperty(FORM_KEY, form.getId());
    form.setDescription(QUESTIONNAIRE.intro)
      .setCollectEmail(false)
      .setLimitOneResponsePerUser(false)
      .setPublishingSummary(false)
      .setShuffleQuestions(false)
      .setProgressBar(true)
      .setConfirmationMessage('感謝您分享寶貴的實務經驗！您的回覆將協助我們了解實際需求，並改善後續產品設計。')
      .setShowLinkToRespondAgain(false);
    const pages = [];
    const items = {};
    QUESTIONNAIRE.sections.forEach((section, index) => {
      const heading = index === 0 ? form.addSectionHeaderItem() : form.addPageBreakItem();
      heading.setTitle(section.title).setHelpText(section.intro);
      pages[index] = heading;
      section.questions.forEach(question => {
        const [id, title, kind, options] = question;
        let item;
        if (kind === 'radio') item = form.addMultipleChoiceItem().setChoiceValues(options);
        else if (kind === 'checkbox') item = form.addCheckboxItem().setChoiceValues(options);
        else if (kind === 'textarea') item = form.addParagraphTextItem();
        else item = form.addTextItem();
        item.setTitle(id + '. ' + title).setRequired(kind !== 'textarea');
        if (id === '7') item.setHelpText('包含修正時間，不包含等待他人的時間。');
        if (kind === 'textarea') item.setHelpText('選填。請勿提供客戶名稱或機密資訊。');
        if (id === '15') {
          item.setHelpText('最多選三項。').setValidation(
            FormApp.createCheckboxValidation().requireSelectAtMost(3).build()
          );
        }
        items[id] = item;
        if (options.some(value => value === '其他' || value.includes('請補充'))) {
          form.addTextItem().setTitle(id + '. 其他／補充說明（選填）').setRequired(false);
        }
      });
    });
    const contact = form.addPageBreakItem().setTitle('後續聯絡（選填）')
      .setHelpText('僅用於您選擇的訪談、模擬資料測試或進度通知。');
    form.addTextItem().setTitle('電子郵件或其他方便的聯絡方式（選填）')
      .setHelpText('請勿提供客戶資訊。').setRequired(false);

    const experienceOptions = QUESTIONNAIRE.sections[0].questions.find(q => q[0] === '4')[3];
    items['4'].setChoices(experienceOptions.map(value =>
      items['4'].createChoice(value, value === '從未參與' ? pages[4] : pages[1])
    ));
    ['17', 'A3'].forEach(id => {
      const question = QUESTIONNAIRE.sections.flatMap(s => s.questions).find(q => q[0] === id);
      items[id].setChoices(question[3].map(value => items[id].createChoice(
        value, value === '目前不需要' ? FormApp.PageNavigationType.SUBMIT : contact
      )));
    });
    // Navigation on a page-break item controls the page BEFORE it.
    // Explicit end-of-main-form choices above override this defensive skip.
    pages[4].setGoToPage(contact);
    properties.setProperty(READY_KEY, 'true');
    publishAndPrintLinks_(form);
  } finally {
    lock.releaseLock();
  }
}

function publishAndPrintLinks_(form) {
  if (form.supportsAdvancedResponderPermissions()) form.setPublished(true);
  form.setAcceptingResponses(true);
  console.log('填寫連結（分享給受訪者）：' + form.getPublishedUrl());
  console.log('編輯連結（僅供您管理）：' + form.getEditUrl());
  console.log('請在表單發佈／管理回覆者設定確認填寫權限，並用未登入的瀏覽器測試填寫連結。組織帳戶政策可能限制外部填寫。');
}
