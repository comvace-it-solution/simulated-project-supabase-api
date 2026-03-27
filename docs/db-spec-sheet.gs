function createDbDefinitionSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "DB定義";

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
    sheet.clearFormats();
    sheet.clearConditionalFormatRules();
  }

  const dbSpec = [
    {
      logicalName: "認証",
      physicalName: "auth",
      columns: [
        ["1", "認証ID", "id", "INT", "-", "-", "◯", "-", "◯", "", "identity", "自動採番"],
        ["2", "ユーザーID", "user_id", "INT", "-", "-", "◯", "半角", "", "◯", "-", "users.id を参照、一意制約あり"],
        ["3", "パスワード", "password", "CHAR", "6", "6", "◯", "半角", "", "", "-", "半角英数字6文字"],
      ],
      extras: [
        ["制約", "pk_auth", "PRIMARY KEY (id)"],
        ["制約", "uq_auth_user_id", "UNIQUE (user_id)"],
        ["制約", "fk_auth_user_id_users_id", "FOREIGN KEY (user_id) REFERENCES users(id)"],
        ["制約", "chk_auth_password_length_and_charset", "password は /^[A-Za-z0-9]{6}$/"],
      ],
    },
    {
      logicalName: "ユーザー",
      physicalName: "users",
      columns: [
        ["1", "ユーザーID", "id", "INT", "-", "-", "◯", "-", "◯", "", "identity", "自動採番"],
        ["2", "ユーザー名", "user_name", "VARCHAR", "-", "50", "◯", "全角/半角", "", "", "-", "表示名。日本語可"],
        ["3", "メールアドレス", "email", "VARCHAR", "-", "50", "◯", "半角", "", "", "-", "ログインIDとして使用、ユニーク"],
        ["4", "電話番号", "phone_number", "CHAR", "11", "11", "-", "半角", "", "", "null", "ハイフンなし11桁"],
        ["5", "郵便番号", "postal_code", "CHAR", "7", "7", "-", "半角", "", "", "null", "ハイフンなし7桁"],
        ["6", "都道府県", "prefecture", "VARCHAR", "-", "20", "-", "-", "", "", "null", "住所1"],
        ["7", "住所", "street_address", "VARCHAR", "-", "255", "-", "-", "", "", "null", "住所2"],
        ["8", "建物名", "building_name", "VARCHAR", "-", "255", "-", "-", "", "", "null", "住所3"],
        ["9", "生年月日", "birth_date", "DATE", "-", "-", "-", "-", "", "", "null", "YYYY-MM-DD 形式"],
        ["10", "現在の勤怠状態", "current_attendance_state", "SMALLINT", "-", "-", "-", "-", "", "", "null", "1=勤務中、2=休憩中、null=非勤務中"],
        ["11", "現在の勤怠ID", "current_attendance_id", "INT", "-", "-", "-", "半角", "", "◯", "null", "attendance.id を参照"],
        ["12", "配属日", "assignment_date", "DATE", "-", "-", "◯", "-", "", "", "-", "YYYY-MM-DD 形式"],
        ["13", "作成日時", "created_at", "TIMESTAMPTZ", "-", "-", "◯", "-", "", "", "current_timestamp", "作成日時"],
        ["14", "更新日時", "updated_dt", "TIMESTAMPTZ", "-", "-", "◯", "-", "", "", "current_timestamp", "update 時は trigger で自動更新"],
      ],
      extras: [
        ["制約", "pk_users", "PRIMARY KEY (id)"],
        ["制約", "uq_users_email", "UNIQUE (email)"],
        ["制約", "fk_users_current_attendance_id_attendance_id", "FOREIGN KEY (current_attendance_id) REFERENCES attendance(id)"],
        ["制約", "chk_users_phone_number_format", "phone_number は 11 桁数字のみ"],
        ["制約", "chk_users_postal_code_format", "postal_code は 7 桁数字のみ"],
        ["制約", "chk_users_current_attendance_state", "current_attendance_state は 1, 2, null のみ"],
        ["制約", "chk_users_attendance_state_requires_id", "state がある場合 current_attendance_id 必須"],
        ["制約", "chk_users_attendance_id_requires_state", "current_attendance_id がある場合 state 必須"],
        ["INDEX", "idx_users_current_attendance_id", "current_attendance_id"],
        ["TRIGGER", "trg_users_set_updated_dt", "BEFORE UPDATE ON users -> fn_set_updated_dt()"],
      ],
    },
    {
      logicalName: "勤怠",
      physicalName: "attendance",
      columns: [
        ["1", "勤怠ID", "id", "INT", "-", "-", "◯", "-", "◯", "", "identity", "自動採番"],
        ["2", "ユーザーID", "user_id", "INT", "-", "-", "◯", "半角", "", "◯", "-", "users.id を参照"],
        ["3", "勤務日", "work_date", "DATE", "-", "-", "◯", "-", "", "", "-", "work_start_dt::date と一致"],
        ["4", "勤務開始日時", "work_start_dt", "TIMESTAMPTZ", "-", "-", "◯", "-", "", "", "-", "出勤打刻時刻"],
        ["5", "勤務終了日時", "work_end_dt", "TIMESTAMPTZ", "-", "-", "-", "-", "", "", "null", "退勤打刻時刻"],
        ["6", "更新日時", "updated_dt", "TIMESTAMPTZ", "-", "-", "◯", "-", "", "", "current_timestamp", "update 時は trigger で自動更新"],
      ],
      extras: [
        ["制約", "pk_attendance", "PRIMARY KEY (id)"],
        ["制約", "fk_attendance_user_id_users_id", "FOREIGN KEY (user_id) REFERENCES users(id)"],
        ["制約", "chk_attendance_work_end_after_start", "work_end_dt >= work_start_dt"],
        ["制約", "chk_attendance_work_date_matches_start", "work_date = work_start_dt::date"],
        ["INDEX", "idx_attendance_user_id", "user_id"],
        ["INDEX", "idx_attendance_user_id_work_date", "user_id, work_date"],
        ["UNIQUE INDEX", "uq_attendance_user_id_active", "work_end_dt is null の進行中勤務は 1 件まで"],
        ["TRIGGER", "trg_attendance_set_updated_dt", "BEFORE UPDATE ON attendance -> fn_set_updated_dt()"],
      ],
    },
    {
      logicalName: "休憩",
      physicalName: "attendance_breaks",
      columns: [
        ["1", "休憩ID", "id", "INT", "-", "-", "◯", "-", "◯", "", "identity", "自動採番"],
        ["2", "勤怠ID", "attendance_id", "INT", "-", "-", "◯", "半角", "", "◯", "-", "attendance.id を参照"],
        ["3", "休憩開始日時", "break_start_dt", "TIMESTAMPTZ", "-", "-", "◯", "-", "", "", "-", "休憩開始打刻時刻"],
        ["4", "休憩終了日時", "break_end_dt", "TIMESTAMPTZ", "-", "-", "-", "-", "", "", "null", "休憩終了打刻時刻"],
        ["5", "更新日時", "updated_dt", "TIMESTAMPTZ", "-", "-", "◯", "-", "", "", "current_timestamp", "update 時は trigger で自動更新"],
      ],
      extras: [
        ["制約", "pk_attendance_breaks", "PRIMARY KEY (id)"],
        ["制約", "fk_attendance_breaks_attendance_id_attendance_id", "FOREIGN KEY (attendance_id) REFERENCES attendance(id)"],
        ["制約", "chk_attendance_breaks_end_after_start", "break_end_dt >= break_start_dt"],
        ["INDEX", "idx_attendance_breaks_attendance_id", "attendance_id"],
        ["UNIQUE INDEX", "uq_attendance_breaks_attendance_id_active", "break_end_dt is null の進行中休憩は 1 件まで"],
        ["TRIGGER", "trg_attendance_breaks_set_updated_dt", "BEFORE UPDATE ON attendance_breaks -> fn_set_updated_dt()"],
      ],
    },
  ];

  renderDbDefinitionSheet(sheet, dbSpec);
}

function renderDbDefinitionSheet(sheet, dbSpec) {
  const blue = "#cfe2f3";
  const black = "#000000";
  const startRow = 2;

  sheet.setHiddenGridlines(true);
  sheet.setColumnWidth(1, 6);
  sheet.setColumnWidth(2, 60);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 110);
  sheet.setColumnWidth(6, 70);
  sheet.setColumnWidth(7, 70);
  sheet.setColumnWidth(8, 80);
  sheet.setColumnWidth(9, 90);
  sheet.setColumnWidth(10, 50);
  sheet.setColumnWidth(11, 50);
  sheet.setColumnWidth(12, 140);
  sheet.setColumnWidth(13, 300);

  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
    .setFontFamily("Noto Sans JP")
    .setFontSize(10)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("left")
    .setWrap(true)
    .setBackground("#ffffff")
    .setBorder(false, false, false, false, false, false);

  let row = startRow;
  dbSpec.forEach((table, index) => {
    row = drawDbTableBlock(sheet, row, table, blue, black);
    if (index < dbSpec.length - 1) {
      row += 2;
    }
  });

  sheet.getRange(1, 1, sheet.getMaxRows(), 1).clearContent();
}

function drawDbTableBlock(sheet, startRow, table, blue, black) {
  const header = [
    "No.",
    "論理名",
    "物理名",
    "データ型",
    "最小桁",
    "最大桁",
    "Not Null",
    "半角/全角",
    "PK",
    "FK",
    "デフォルト値",
    "備考",
  ];

  let row = startRow;

  drawDbMetaRow(sheet, row, "テーブル名（論理）", table.logicalName, blue, black);
  row++;
  drawDbMetaRow(sheet, row, "テーブル名（物理）", table.physicalName, blue, black);
  row += 2;

  row = drawDbStandardTable(sheet, row, header, table.columns, blue, black);
  row += 2;

  drawDbSectionLabel(sheet, row, "制約・インデックス・トリガー");
  row++;
  row = drawDbStandardTable(
    sheet,
    row,
    ["種別", "名称", "内容"],
    table.extras,
    blue,
    black,
    [2, 2, 8],
  );

  return row;
}

function drawDbMetaRow(sheet, row, label, value, blue, black) {
  const rail = sheet.getRange(row, 1);
  const leftRange = sheet.getRange(row, 2, 1, 3);
  const rightRange = sheet.getRange(row, 5, 1, 9);

  leftRange.breakApart();
  rightRange.breakApart();
  leftRange.merge();
  rightRange.merge();

  rail
    .setBackground("#ffffff")
    .setBorder(false, false, false, true, false, false, black, SpreadsheetApp.BorderStyle.SOLID);

  leftRange
    .setValue(label)
    .setBackground(blue)
    .setFontWeight("bold")
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, false, false, black, SpreadsheetApp.BorderStyle.SOLID);

  rightRange
    .setValue(value)
    .setBackground("#ffffff")
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBorder(true, true, true, true, false, false, black, SpreadsheetApp.BorderStyle.SOLID);

  sheet.setRowHeight(row, 28);
}

function drawDbSectionLabel(sheet, row, label) {
  const range = sheet.getRange(row, 2, 1, 12);
  range.breakApart();
  range.merge();
  range
    .setValue(label)
    .setFontWeight("bold")
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle")
    .setBackground("#ffffff")
    .setBorder(false, false, false, false, false, false);
}

function drawDbStandardTable(sheet, startRow, headerRow, bodyRows, headerColor, borderColor, mergePattern) {
  let row = startRow;
  drawDbTableRow(sheet, row, headerRow, headerColor, borderColor, mergePattern, true);
  row++;

  bodyRows.forEach((bodyRow) => {
    drawDbTableRow(sheet, row, bodyRow, "#ffffff", borderColor, mergePattern, false);
    row++;
  });

  return row;
}

function drawDbTableRow(sheet, row, rowValues, fillColor, borderColor, mergePattern, isHeader) {
  const rail = sheet.getRange(row, 1);
  rail
    .setBackground("#ffffff")
    .setBorder(false, false, false, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

  if (!mergePattern) {
    const values = [...rowValues];
    while (values.length < 12) values.push("");

    const range = sheet.getRange(row, 2, 1, 12);
    range.breakApart();
    range.setValues([values]);
    range
      .setBackground(fillColor)
      .setFontWeight(isHeader ? "bold" : "normal")
      .setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    return;
  }

  let currentCol = 2;
  mergePattern.forEach((span, index) => {
    const range = sheet.getRange(row, currentCol, 1, span);
    range.breakApart();
    if (span > 1) {
      range.merge();
    }
    range
      .setValue(rowValues[index] || "")
      .setBackground(fillColor)
      .setFontWeight(isHeader ? "bold" : "normal")
      .setHorizontalAlignment("left")
      .setVerticalAlignment("middle")
      .setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    currentCol += span;
  });
}
