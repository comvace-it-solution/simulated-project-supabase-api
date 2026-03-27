function createAllApiSpecSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const apiSpecs = [
    {
      sheetName: "ログインAPI",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "ログインAPI"],
        ["更新日", "2026/3/28"],
        ["メソッド", "POST"],
        ["URL", "/auth/login"],
        ["概要", "メールアドレスとパスワードを受け取り、ログイン可否を判定するAPI。\n認証成功時はユーザーIDとユーザー名を返却する。"],
      ],
      relatedTables: "users, auth",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
        ["2", "Content-Type", "◯", "-", "string", "application/json固定"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "なし"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "email", "◯", "-", "string", "メールアドレス"],
        ["2", "password", "◯", "-", "string", "パスワード"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "ログインに成功しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "userId", "◯", "-", "number", "ユーザーID"],
        ["5", "userName", "◯", "-", "string", "ユーザー名"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "email は必須です。", "email未入力"],
        ["2", "400", "password は必須です。", "password未入力"],
        ["3", "400", "Content-Type は application/json を指定してください。", "Content-Type不正"],
        ["4", "400", "リクエストボディが不正です。", "JSON不正"],
        ["5", "400", "リクエストボディに許可されていない項目が含まれています。", "未定義のbody項目を含む"],
        ["6", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["7", "401", "email または password が一致しません。", "メールアドレス未登録またはパスワード不一致"],
        ["8", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["9", "405", "許可されていないHTTPメソッドです。", "POST以外でアクセス"],
        ["10", "409", "auth が作成されていません。", "authレコード未作成"],
        ["11", "500", "ログイン処理に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "ログインに成功しました。",
        data: {
          userId: 1,
          userName: "山田太郎",
        },
      },
    },
    {
      sheetName: "従業員一覧取得API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "従業員一覧取得API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "GET"],
        ["URL", "/users"],
        ["概要", "従業員一覧を取得するAPI。"],
      ],
      relatedTables: "users",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "なし"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "GETのためbodyなし"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "ユーザー一覧を取得しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "users", "◯", "-", "array", "従業員一覧"],
        ["5", "id", "◯", "-", "number", "従業員ID"],
        ["6", "userName", "◯", "-", "string", "従業員名"],
        ["7", "email", "◯", "-", "string", "メールアドレス"],
        ["8", "currentAttendanceState", "-", "◯", "number", "現在の勤怠状態"],
        ["9", "currentAttendanceId", "-", "◯", "number", "現在の勤怠ID"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["2", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["3", "405", "許可されていないHTTPメソッドです。", "GET以外でアクセス"],
        ["4", "500", "ユーザー情報の取得に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "ユーザー一覧を取得しました。",
        data: {
          users: [
            {
              id: 1,
              userName: "山田太郎",
              email: "sample@example.com",
              currentAttendanceState: 1,
              currentAttendanceId: 10,
            },
          ],
        },
      },
    },
    {
      sheetName: "従業員詳細取得API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "従業員詳細取得API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "GET"],
        ["URL", "/users/{userId}"],
        ["概要", "指定した従業員IDの詳細情報を取得するAPI。"],
      ],
      relatedTables: "users",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userId", "◯", "-", "number", "従業員ID"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "GETのためbodyなし"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "ユーザー情報を取得しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "id", "◯", "-", "number", "従業員ID"],
        ["5", "userName", "◯", "-", "string", "従業員名"],
        ["6", "email", "◯", "-", "string", "メールアドレス"],
        ["7", "phoneNumber", "-", "◯", "string", "電話番号"],
        ["8", "postalCode", "-", "◯", "string", "郵便番号"],
        ["9", "prefecture", "-", "◯", "string", "都道府県"],
        ["10", "streetAddress", "-", "◯", "string", "住所"],
        ["11", "buildingName", "-", "◯", "string", "建物名"],
        ["12", "birthDate", "-", "◯", "string(date)", "生年月日"],
        ["13", "assignmentDate", "◯", "-", "string(date)", "配属日"],
        ["14", "currentAttendanceState", "-", "◯", "number", "現在の勤怠状態"],
        ["15", "currentAttendanceId", "-", "◯", "number", "現在の勤怠ID"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "userId が不正です。", "userIdが正の整数でない"],
        ["2", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["3", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["4", "404", "ユーザーが存在しません。", "対象ユーザーなし"],
        ["5", "405", "許可されていないHTTPメソッドです。", "GET以外でアクセス"],
        ["6", "500", "ユーザー情報の取得に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "ユーザー情報を取得しました。",
        data: {
          id: 1,
          userName: "山田太郎",
          email: "sample@example.com",
          phoneNumber: "09012345678",
          postalCode: "1500001",
          prefecture: "東京都",
          streetAddress: "渋谷区1-2-3",
          buildingName: "サンプルマンション101",
          birthDate: "1990-01-01",
          assignmentDate: "2026-03-28",
          currentAttendanceState: 1,
          currentAttendanceId: 10,
        },
      },
    },
    {
      sheetName: "従業員登録API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "従業員登録API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "POST"],
        ["URL", "/users"],
        ["概要", "従業員情報と認証情報を新規登録するAPI。"],
      ],
      relatedTables: "users, auth",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
        ["2", "Content-Type", "◯", "-", "string", "application/json固定"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "なし"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userName", "◯", "-", "string", "ユーザー名"],
        ["2", "password", "◯", "-", "string", "半角英数字6文字"],
        ["3", "email", "◯", "-", "string", "メールアドレス"],
        ["4", "phoneNumber", "◯", "-", "string", "電話番号（11桁）"],
        ["5", "postalCode", "◯", "-", "string", "郵便番号（7桁）"],
        ["6", "prefecture", "◯", "-", "string", "都道府県"],
        ["7", "streetAddress", "◯", "-", "string", "住所"],
        ["8", "buildingName", "-", "◯", "string", "建物名"],
        ["9", "birthDate", "◯", "-", "string(date)", "生年月日（YYYY-MM-DD）"],
        ["10", "assignmentDate", "◯", "-", "string(date)", "配属日（YYYY-MM-DD）"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "従業員登録に成功しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "userId", "◯", "-", "number", "登録されたユーザーID"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "userName は必須です。", "userName未入力"],
        ["2", "400", "password は必須です。", "password未入力"],
        ["3", "400", "password は半角英数字6文字で入力してください。", "password形式不正"],
        ["4", "400", "email は必須です。", "email未入力"],
        ["5", "400", "email が不正です。", "email形式不正"],
        ["6", "400", "phoneNumber は必須です。", "電話番号未入力"],
        ["7", "400", "phoneNumber が不正です。", "電話番号形式不正"],
        ["8", "400", "postalCode は必須です。", "郵便番号未入力"],
        ["9", "400", "postalCode が不正です。", "郵便番号形式不正"],
        ["10", "400", "prefecture は必須です。", "都道府県未入力"],
        ["11", "400", "streetAddress は必須です。", "住所未入力"],
        ["12", "400", "birthDate は必須です。", "生年月日未入力"],
        ["13", "400", "birthDate が不正です。", "生年月日形式不正"],
        ["14", "400", "assignmentDate は必須です。", "配属日未入力"],
        ["15", "400", "assignmentDate が不正です。", "配属日形式不正"],
        ["16", "400", "Content-Type は application/json を指定してください。", "Content-Type不正"],
        ["17", "400", "リクエストボディが不正です。", "JSON不正"],
        ["18", "400", "リクエストボディに許可されていない項目が含まれています。", "未定義のbody項目を含む"],
        ["19", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["20", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["21", "405", "許可されていないHTTPメソッドです。", "POST以外でアクセス"],
        ["22", "409", "email はすでに登録されています。", "メールアドレス重複"],
        ["23", "500", "従業員登録に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "従業員登録に成功しました。",
        data: {
          userId: 2,
        },
      },
    },
    {
      sheetName: "従業員編集API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "従業員編集API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "PATCH"],
        ["URL", "/users/{userId}"],
        ["概要", "指定した従業員IDの従業員情報を更新するAPI。userId自体は変更不可。"],
      ],
      relatedTables: "users, auth",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
        ["2", "Content-Type", "◯", "-", "string", "application/json固定"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userId", "◯", "-", "number", "更新対象の従業員ID"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userName", "◯", "-", "string", "ユーザー名"],
        ["2", "password", "-", "◯", "string", "変更時のみ半角英数字6文字"],
        ["3", "email", "◯", "-", "string", "メールアドレス"],
        ["4", "phoneNumber", "◯", "-", "string", "電話番号（11桁）"],
        ["5", "postalCode", "◯", "-", "string", "郵便番号（7桁）"],
        ["6", "prefecture", "◯", "-", "string", "都道府県"],
        ["7", "streetAddress", "◯", "-", "string", "住所"],
        ["8", "buildingName", "-", "◯", "string", "建物名"],
        ["9", "birthDate", "◯", "-", "string(date)", "生年月日（YYYY-MM-DD）"],
        ["10", "assignmentDate", "◯", "-", "string(date)", "配属日（YYYY-MM-DD）"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "従業員情報を更新しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "userId", "◯", "-", "number", "更新対象ユーザーID"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "userId が不正です。", "userIdが正の整数でない"],
        ["2", "400", "userName は必須です。", "userName未入力"],
        ["3", "400", "password は半角英数字6文字で入力してください。", "password形式不正"],
        ["4", "400", "email は必須です。", "email未入力"],
        ["5", "400", "email が不正です。", "email形式不正"],
        ["6", "400", "phoneNumber は必須です。", "電話番号未入力"],
        ["7", "400", "phoneNumber が不正です。", "電話番号形式不正"],
        ["8", "400", "postalCode は必須です。", "郵便番号未入力"],
        ["9", "400", "postalCode が不正です。", "郵便番号形式不正"],
        ["10", "400", "prefecture は必須です。", "都道府県未入力"],
        ["11", "400", "streetAddress は必須です。", "住所未入力"],
        ["12", "400", "birthDate は必須です。", "生年月日未入力"],
        ["13", "400", "birthDate が不正です。", "生年月日形式不正"],
        ["14", "400", "assignmentDate は必須です。", "配属日未入力"],
        ["15", "400", "assignmentDate が不正です。", "配属日形式不正"],
        ["16", "400", "Content-Type は application/json を指定してください。", "Content-Type不正"],
        ["17", "400", "リクエストボディが不正です。", "JSON不正"],
        ["18", "400", "リクエストボディに許可されていない項目が含まれています。", "未定義のbody項目を含む"],
        ["19", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["20", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["21", "404", "ユーザーが存在しません。", "対象ユーザーなし"],
        ["22", "405", "許可されていないHTTPメソッドです。", "PATCH以外でアクセス"],
        ["23", "409", "email はすでに登録されています。", "メールアドレス重複"],
        ["24", "500", "従業員情報の更新に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "従業員情報を更新しました。",
        data: {
          userId: 2,
        },
      },
    },
    {
      sheetName: "勤務開始API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "勤務開始API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "POST"],
        ["URL", "/attendance/start"],
        ["概要", "指定した従業員の勤務開始を登録するAPI。"],
      ],
      relatedTables: "users, attendance",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
        ["2", "Content-Type", "◯", "-", "string", "application/json固定"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "なし"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userId", "◯", "-", "number", "従業員ID"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "勤務開始に成功しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "attendanceId", "◯", "-", "number", "勤怠ID"],
        ["5", "userId", "◯", "-", "number", "従業員ID"],
        ["6", "workDate", "◯", "-", "string(date)", "勤務日"],
        ["7", "workStartDt", "◯", "-", "string(datetime)", "勤務開始日時"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "userId は必須です。", "userId未入力"],
        ["2", "400", "userId が不正です。", "userId形式不正"],
        ["3", "400", "Content-Type は application/json を指定してください。", "Content-Type不正"],
        ["4", "400", "リクエストボディが不正です。", "JSON不正"],
        ["5", "400", "リクエストボディに許可されていない項目が含まれています。", "未定義のbody項目を含む"],
        ["6", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["7", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["8", "404", "ユーザーが存在しません。", "対象ユーザーなし"],
        ["9", "405", "許可されていないHTTPメソッドです。", "POST以外でアクセス"],
        ["10", "409", "すでに勤務中です。", "勤務中状態"],
        ["11", "409", "すでに休憩中です。", "休憩中状態"],
        ["12", "409", "進行中勤務がすでに存在します。", "未終了勤務あり"],
        ["13", "500", "勤務開始処理に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "勤務開始に成功しました。",
        data: {
          attendanceId: 10,
          userId: 1,
          workDate: "2026-03-28",
          workStartDt: "2026-03-28T09:00:00.000Z",
        },
      },
    },
    {
      sheetName: "休憩開始API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "休憩開始API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "POST"],
        ["URL", "/attendance/break/start"],
        ["概要", "指定した従業員の休憩開始を登録するAPI。"],
      ],
      relatedTables: "users, attendance, attendance_breaks",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
        ["2", "Content-Type", "◯", "-", "string", "application/json固定"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "なし"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userId", "◯", "-", "number", "従業員ID"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "休憩開始に成功しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "attendanceId", "◯", "-", "number", "勤怠ID"],
        ["5", "breakId", "◯", "-", "number", "休憩ID"],
        ["6", "breakStartDt", "◯", "-", "string(datetime)", "休憩開始日時"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "userId は必須です。", "userId未入力"],
        ["2", "400", "userId が不正です。", "userId形式不正"],
        ["3", "400", "Content-Type は application/json を指定してください。", "Content-Type不正"],
        ["4", "400", "リクエストボディが不正です。", "JSON不正"],
        ["5", "400", "リクエストボディに許可されていない項目が含まれています。", "未定義のbody項目を含む"],
        ["6", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["7", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["8", "404", "ユーザーが存在しません。", "対象ユーザーなし"],
        ["9", "405", "許可されていないHTTPメソッドです。", "POST以外でアクセス"],
        ["10", "409", "非勤務中のため休憩開始できません。", "非勤務中"],
        ["11", "409", "すでに休憩中です。", "休憩中状態"],
        ["12", "409", "current_attendance_id が設定されていません。", "勤務ID不整合"],
        ["13", "409", "勤務レコードが不整合です。", "勤務データ不整合"],
        ["14", "409", "未終了の休憩が存在します。", "進行中休憩あり"],
        ["15", "500", "休憩開始処理に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "休憩開始に成功しました。",
        data: {
          attendanceId: 10,
          breakId: 20,
          breakStartDt: "2026-03-28T12:00:00.000Z",
        },
      },
    },
    {
      sheetName: "休憩終了API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "休憩終了API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "POST"],
        ["URL", "/attendance/break/end"],
        ["概要", "指定した従業員の休憩終了を登録するAPI。"],
      ],
      relatedTables: "users, attendance_breaks",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
        ["2", "Content-Type", "◯", "-", "string", "application/json固定"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "なし"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userId", "◯", "-", "number", "従業員ID"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "休憩終了に成功しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "attendanceId", "◯", "-", "number", "勤怠ID"],
        ["5", "breakId", "◯", "-", "number", "休憩ID"],
        ["6", "breakEndDt", "◯", "-", "string(datetime)", "休憩終了日時"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "userId は必須です。", "userId未入力"],
        ["2", "400", "userId が不正です。", "userId形式不正"],
        ["3", "400", "Content-Type は application/json を指定してください。", "Content-Type不正"],
        ["4", "400", "リクエストボディが不正です。", "JSON不正"],
        ["5", "400", "リクエストボディに許可されていない項目が含まれています。", "未定義のbody項目を含む"],
        ["6", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["7", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["8", "404", "ユーザーが存在しません。", "対象ユーザーなし"],
        ["9", "405", "許可されていないHTTPメソッドです。", "POST以外でアクセス"],
        ["10", "409", "休憩中ではありません。", "休憩中状態ではない"],
        ["11", "409", "current_attendance_id が設定されていません。", "勤務ID不整合"],
        ["12", "409", "未終了の休憩が存在しません。", "対象休憩なし"],
        ["13", "409", "未終了の休憩が複数存在します。", "休憩データ不整合"],
        ["14", "500", "休憩終了処理に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "休憩終了に成功しました。",
        data: {
          attendanceId: 10,
          breakId: 20,
          breakEndDt: "2026-03-28T13:00:00.000Z",
        },
      },
    },
    {
      sheetName: "勤務終了API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "勤務終了API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "POST"],
        ["URL", "/attendance/end"],
        ["概要", "指定した従業員の勤務終了を登録するAPI。"],
      ],
      relatedTables: "users, attendance, attendance_breaks",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
        ["2", "Content-Type", "◯", "-", "string", "application/json固定"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "なし"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userId", "◯", "-", "number", "従業員ID"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "勤務終了に成功しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "attendanceId", "◯", "-", "number", "勤怠ID"],
        ["5", "workEndDt", "◯", "-", "string(datetime)", "勤務終了日時"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "userId は必須です。", "userId未入力"],
        ["2", "400", "userId が不正です。", "userId形式不正"],
        ["3", "400", "Content-Type は application/json を指定してください。", "Content-Type不正"],
        ["4", "400", "リクエストボディが不正です。", "JSON不正"],
        ["5", "400", "リクエストボディに許可されていない項目が含まれています。", "未定義のbody項目を含む"],
        ["6", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["7", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["8", "404", "ユーザーが存在しません。", "対象ユーザーなし"],
        ["9", "405", "許可されていないHTTPメソッドです。", "POST以外でアクセス"],
        ["10", "409", "勤務中ではありません。", "非勤務中"],
        ["11", "409", "休憩中のため勤務終了できません。", "休憩中"],
        ["12", "409", "current_attendance_id が設定されていません。", "勤務ID不整合"],
        ["13", "409", "勤務レコードが不整合です。", "勤務データ不整合"],
        ["14", "409", "未終了の休憩が存在します。", "進行中休憩あり"],
        ["15", "500", "勤務終了処理に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "勤務終了に成功しました。",
        data: {
          attendanceId: 10,
          workEndDt: "2026-03-28T18:00:00.000Z",
        },
      },
    },
    {
      sheetName: "勤怠一覧取得API",
      meta: [
        ["システム名", "人材管理システム"],
        ["API名", "勤怠一覧取得API"],
        ["更新日", "2026/3/28"],
        ["メソッド", "GET"],
        ["URL", "/attendance/records?userId={userId}&targetMonth={YYYY-MM}"],
        ["概要", "指定した従業員・対象月の勤怠一覧を取得するAPI。"],
      ],
      relatedTables: "users, attendance, attendance_breaks",
      headers: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "x-api-key", "◯", "-", "string", "内部APIキー（<INTERNAL_API_KEY>）"],
      ],
      parameters: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "userId", "◯", "-", "number", "従業員ID"],
        ["2", "targetMonth", "◯", "-", "string", "対象月（YYYY-MM）"],
      ],
      body: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "-", "-", "-", "-", "GETのためbodyなし"],
      ],
      response200: [
        ["No.", "キー", "必須", "null", "型", "説明"],
        ["1", "result", "◯", "-", "string", "固定文字列：\"success\""],
        ["2", "message", "◯", "-", "string", "勤怠一覧を取得しました。"],
        ["3", "data", "◯", "-", "object", "レスポンス本体"],
        ["4", "userId", "◯", "-", "number", "従業員ID"],
        ["5", "targetMonth", "◯", "-", "string", "対象月"],
        ["6", "attendanceRecords", "◯", "-", "array", "勤怠一覧"],
        ["7", "id", "◯", "-", "number", "勤怠ID"],
        ["8", "workDate", "◯", "-", "string(date)", "勤務日"],
        ["9", "workStartDt", "◯", "-", "string(datetime)", "勤務開始日時"],
        ["10", "workEndDt", "-", "◯", "string(datetime)", "勤務終了日時"],
        ["11", "breaks", "◯", "-", "array", "休憩一覧"],
      ],
      responseError: [
        ["No.", "ステータス", "message", "発生条件"],
        ["1", "400", "userId は必須です。", "userId未指定"],
        ["2", "400", "targetMonth は必須です。", "targetMonth未指定"],
        ["3", "400", "userId が不正です。", "userId形式不正"],
        ["4", "400", "targetMonth の形式が不正です。", "targetMonth形式不正"],
        ["5", "401", "x-api-key ヘッダーは必須です。", "x-api-key未指定"],
        ["6", "403", "APIキーが不正です。", "x-api-key不一致"],
        ["7", "404", "ユーザーが存在しません。", "対象ユーザーなし"],
        ["8", "405", "許可されていないHTTPメソッドです。", "GET以外でアクセス"],
        ["9", "500", "勤怠一覧の取得に失敗しました", "内部例外"],
      ],
      responseExample: {
        result: "success",
        message: "勤怠一覧を取得しました。",
        data: {
          userId: 1,
          targetMonth: "2026-03",
          attendanceRecords: [
            {
              id: 10,
              workDate: "2026-03-28",
              workStartDt: "2026-03-28T09:00:00.000Z",
              workEndDt: "2026-03-28T18:00:00.000Z",
              breaks: [
                {
                  id: 20,
                  breakStartDt: "2026-03-28T12:00:00.000Z",
                  breakEndDt: "2026-03-28T13:00:00.000Z",
                },
              ],
            },
          ],
        },
      },
    },
  ];

  apiSpecs.forEach((spec) => {
    let sheet = ss.getSheetByName(spec.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(spec.sheetName);
    } else {
      sheet.clear();
      sheet.clearFormats();
      sheet.clearConditionalFormatRules();
    }

    renderApiSheet(sheet, spec);
  });
}

function renderApiSheet(sheet, spec) {
  const blue = "#cfe2f3";
  const black = "#000000";

  sheet.setHiddenGridlines(true);
  sheet.setColumnWidth(1, 6);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 260);

  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
    .setFontFamily("Noto Sans JP")
    .setFontSize(10)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("left")
    .setWrap(true)
    .setBackground("#ffffff")
    .setBorder(false, false, false, false, false, false);

  let row = 2;

  spec.meta.forEach(([label, value]) => {
    renderMetaRow(sheet, row, label, value, blue, black);
    row++;
  });

  row++;

  drawSectionLabel(sheet, row, "関連テーブル");
  row++;
  drawMergedValueRow(sheet, row, spec.relatedTables, black);
  row += 2;

  drawSectionLabel(sheet, row, "Headers");
  row++;
  row = drawStandardTable(sheet, row, spec.headers, blue, black);
  row++;

  drawSectionLabel(sheet, row, "Parameters");
  row++;
  row = drawStandardTable(sheet, row, spec.parameters, blue, black);
  row++;

  drawSectionLabel(sheet, row, "Body: bodyに以下パラメータをJSON形式でセットする");
  row++;
  row = drawStandardTable(sheet, row, spec.body, blue, black);
  row++;

  drawSectionLabel(sheet, row, "Response 200");
  row++;
  row = drawStandardTable(sheet, row, spec.response200, blue, black);
  row++;

  drawSectionLabel(sheet, row, "Response Error");
  row++;
  row = drawErrorTable(sheet, row, spec.responseError, blue, black);
  row++;

  drawSectionLabel(sheet, row, "Response例");
  row++;
  drawJsonExample(sheet, row, spec.responseExample, black);

  sheet.getRange(1, 1, sheet.getMaxRows(), 1).clearContent();
}

function renderMetaRow(sheet, row, label, value, blue, black) {
  const rail = sheet.getRange(row, 1);
  const leftRange = sheet.getRange(row, 2, 1, 3);
  const rightRange = sheet.getRange(row, 5, 1, 3);

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

  sheet.setRowHeight(row, label === "概要" ? 56 : 28);
}

function drawSectionLabel(sheet, row, label) {
  const range = sheet.getRange(row, 2, 1, 6);
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

function drawMergedValueRow(sheet, row, value, borderColor) {
  const rail = sheet.getRange(row, 1);
  const range = sheet.getRange(row, 2, 1, 6);

  range.breakApart();
  range.merge();

  rail
    .setBackground("#ffffff")
    .setBorder(false, false, false, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

  range
    .setValue(value)
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBackground("#ffffff")
    .setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
}

function drawStandardTable(sheet, startRow, rows, headerColor, borderColor) {
  rows.forEach((row, index) => {
    const rowIndex = startRow + index;
    const rail = sheet.getRange(rowIndex, 1);
    const values = [...row];
    while (values.length < 6) values.push("");

    const range = sheet.getRange(rowIndex, 2, 1, 6);
    range.breakApart();
    range.setValues([values]);

    rail
      .setBackground("#ffffff")
      .setBorder(false, false, false, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    if (index === 0) {
      range.setBackground(headerColor).setFontWeight("bold");
    } else {
      range.setBackground("#ffffff");
    }

    range.setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
  });

  return startRow + rows.length;
}

function drawErrorTable(sheet, startRow, rows, borderColor) {
  rows.forEach((row, index) => {
    const rowIndex = startRow + index;
    const rail = sheet.getRange(rowIndex, 1);

    sheet.getRange(rowIndex, 2, 1, 6).breakApart().clearContent();

    sheet.getRange(rowIndex, 2).setValue(row[0]);
    sheet.getRange(rowIndex, 3).setValue(row[1]);
    sheet.getRange(rowIndex, 4, 1, 3).merge().setValue(row[2]);
    sheet.getRange(rowIndex, 7).setValue(row[3]);

    rail
      .setBackground("#ffffff")
      .setBorder(false, false, false, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

    if (index === 0) {
      sheet.getRange(rowIndex, 2, 1, 1).setBackground("#cfe2f3").setFontWeight("bold");
      sheet.getRange(rowIndex, 3, 1, 1).setBackground("#cfe2f3").setFontWeight("bold");
      sheet.getRange(rowIndex, 4, 1, 3).setBackground("#cfe2f3").setFontWeight("bold");
      sheet.getRange(rowIndex, 7, 1, 1).setBackground("#cfe2f3").setFontWeight("bold");
    } else {
      sheet.getRange(rowIndex, 2, 1, 1).setBackground("#ffffff");
      sheet.getRange(rowIndex, 3, 1, 1).setBackground("#ffffff");
      sheet.getRange(rowIndex, 4, 1, 3).setBackground("#ffffff");
      sheet.getRange(rowIndex, 7, 1, 1).setBackground("#ffffff");
    }

    sheet.getRange(rowIndex, 2, 1, 1).setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(rowIndex, 3, 1, 1).setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(rowIndex, 4, 1, 3).setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(rowIndex, 7, 1, 1).setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);
  });

  return startRow + rows.length;
}

function drawJsonExample(sheet, row, jsonObject, borderColor) {
  const json = JSON.stringify(jsonObject, null, 2);
  const rail = sheet.getRange(row, 1);
  const range = sheet.getRange(row, 2, 1, 6);

  range.breakApart();
  range.merge();

  rail
    .setBackground("#ffffff")
    .setBorder(false, false, false, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

  range
    .setValue(json)
    .setFontFamily("Courier New")
    .setFontSize(10)
    .setWrap(true)
    .setHorizontalAlignment("left")
    .setVerticalAlignment("top")
    .setBackground("#ffffff")
    .setBorder(true, true, true, true, false, false, borderColor, SpreadsheetApp.BorderStyle.SOLID);

  const lineCount = json.split("\n").length;
  sheet.setRowHeight(row, Math.max(20 * lineCount, 120));
}
