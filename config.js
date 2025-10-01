/**
 * GitHub Pages 自動公開ツール - 設定ファイル
 * 
 * このファイルには、GitHub OAuth認証とAPI連携に必要な設定を記載します。
 * 実際に使用する場合は、GitHub OAuth Appを作成し、以下の設定を更新してください。
 */

const CONFIG = {
    // GitHub OAuth設定
    github: {
        // GitHub OAuth App の Client ID
        // 取得方法: https://github.com/settings/developers から新しいOAuth Appを作成
        clientId: 'YOUR_GITHUB_CLIENT_ID',
        
        // OAuth認証のリダイレクトURI
        // このURLはGitHub OAuth Appの設定と一致させる必要があります
        redirectUri: window.location.origin + window.location.pathname,
        
        // OAuth認証時に要求するスコープ（権限）
        // repo: リポジトリの読み書き権限
        // user: ユーザー情報の読み取り権限
        scope: 'repo user',
        
        // GitHub API のベースURL
        apiBaseUrl: 'https://api.github.com'
    },

    // アプリケーション設定
    app: {
        // デフォルトのリポジトリ名プレフィックス
        defaultRepoPrefix: 'my-website',
        
        // アップロード可能なファイルの最大サイズ (バイト単位)
        maxFileSize: 100 * 1024 * 1024, // 100MB
        
        // アップロード可能なファイルの総サイズ制限 (バイト単位)
        maxTotalSize: 1024 * 1024 * 1024, // 1GB
        
        // GitHub Pages が有効化されるまでの待機時間 (ミリ秒)
        pagesActivationDelay: 5000, // 5秒
        
        // セッションストレージのキー名
        storageKeys: {
            accessToken: 'github_access_token',
            username: 'github_username'
        }
    },

    // ファイルタイプとアイコンのマッピング
    fileIcons: {
        'html': '📄',
        'css': '🎨',
        'js': '⚡',
        'json': '📋',
        'md': '📝',
        'txt': '📃',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'svg': '🎨',
        'ico': '🔷',
        'pdf': '📕',
        'zip': '📦',
        'default': '📁'
    },

    // エラーメッセージ
    messages: {
        errors: {
            authFailed: 'GitHub認証に失敗しました。もう一度お試しください。',
            noFiles: 'ファイルが選択されていません。',
            invalidRepoName: 'リポジトリ名が無効です。英数字、ハイフン、アンダースコアのみ使用できます。',
            fileTooLarge: 'ファイルサイズが大きすぎます。最大100MBまでです。',
            totalSizeTooLarge: 'ファイルの合計サイズが大きすぎます。最大1GBまでです。',
            repoCreateFailed: 'リポジトリの作成に失敗しました。',
            fileUploadFailed: 'ファイルのアップロードに失敗しました。',
            pagesActivationFailed: 'GitHub Pagesの有効化に失敗しました。',
            networkError: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
            rateLimitExceeded: 'GitHub APIのレート制限に達しました。しばらく待ってから再度お試しください。',
            repoAlreadyExists: 'このリポジトリ名は既に使用されています。別の名前を選択してください。'
        },
        success: {
            repoCreated: 'リポジトリが正常に作成されました。',
            filesUploaded: 'ファイルが正常にアップロードされました。',
            pagesActivated: 'GitHub Pagesが有効化されました。'
        }
    }
};

/**
 * GitHub OAuth認証URLを生成
 * @returns {string} 認証URL
 */
function getGitHubAuthUrl() {
    const params = new URLSearchParams({
        client_id: CONFIG.github.clientId,
        redirect_uri: CONFIG.github.redirectUri,
        scope: CONFIG.github.scope,
        state: generateRandomState()
    });
    
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * ランダムなstate文字列を生成（CSRF対策）
 * @returns {string} ランダムな文字列
 */
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * ファイル拡張子からアイコンを取得
 * @param {string} filename - ファイル名
 * @returns {string} アイコン絵文字
 */
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return CONFIG.fileIcons[ext] || CONFIG.fileIcons.default;
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたサイズ
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * リポジトリ名のバリデーション
 * @param {string} name - リポジトリ名
 * @returns {boolean} 有効な場合true
 */
function validateRepoName(name) {
    // 英数字、ハイフン、アンダースコアのみ許可
    const pattern = /^[a-zA-Z0-9-_]+$/;
    return pattern.test(name) && name.length > 0 && name.length <= 100;
}

/**
 * セッションストレージにトークンを保存
 * @param {string} token - アクセストークン
 */
function saveAccessToken(token) {
    sessionStorage.setItem(CONFIG.app.storageKeys.accessToken, token);
}

/**
 * セッションストレージからトークンを取得
 * @returns {string|null} アクセストークン
 */
function getAccessToken() {
    return sessionStorage.getItem(CONFIG.app.storageKeys.accessToken);
}

/**
 * セッションストレージにユーザー名を保存
 * @param {string} username - ユーザー名
 */
function saveUsername(username) {
    sessionStorage.setItem(CONFIG.app.storageKeys.username, username);
}

/**
 * セッションストレージからユーザー名を取得
 * @returns {string|null} ユーザー名
 */
function getUsername() {
    return sessionStorage.getItem(CONFIG.app.storageKeys.username);
}

/**
 * セッションストレージをクリア
 */
function clearSession() {
    sessionStorage.removeItem(CONFIG.app.storageKeys.accessToken);
    sessionStorage.removeItem(CONFIG.app.storageKeys.username);
}

// 設定をグローバルに公開
window.CONFIG = CONFIG;
window.getGitHubAuthUrl = getGitHubAuthUrl;
window.getFileIcon = getFileIcon;
window.formatFileSize = formatFileSize;
window.validateRepoName = validateRepoName;
window.saveAccessToken = saveAccessToken;
window.getAccessToken = getAccessToken;
window.saveUsername = saveUsername;
window.getUsername = getUsername;
window.clearSession = clearSession;
