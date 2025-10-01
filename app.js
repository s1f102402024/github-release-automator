/**
 * GitHub Pages 自動公開ツール - メインアプリケーション
 */

// グローバル変数
let uploadedFiles = [];
let currentStep = 1;

/**
 * アプリケーション初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

/**
 * アプリケーションの初期化
 */
function initializeApp() {
    console.log('GitHub Pages 自動公開ツール - 初期化中...');
    
    // URLパラメータからOAuthコードをチェック
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        handleOAuthCallback(code);
    }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 認証ボタン
    const authButton = document.getElementById('auth-button');
    if (authButton) {
        authButton.addEventListener('click', handleAuth);
    }
    
    // 次へ進むボタン
    const nextButton = document.getElementById('next-to-upload');
    if (nextButton) {
        nextButton.addEventListener('click', () => navigateToStep(2));
    }
    
    // 戻るボタン
    const backButton = document.getElementById('back-to-auth');
    if (backButton) {
        backButton.addEventListener('click', () => navigateToStep(1));
    }
    
    // ファイル選択
    const selectFilesButton = document.getElementById('select-files');
    const fileInput = document.getElementById('file-input');
    if (selectFilesButton && fileInput) {
        selectFilesButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // ドラッグ＆ドロップ
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    // リポジトリ名の入力
    const repoNameInput = document.getElementById('repo-name');
    if (repoNameInput) {
        repoNameInput.addEventListener('input', validatePublishButton);
    }
    
    // 公開開始ボタン
    const publishButton = document.getElementById('start-publish');
    if (publishButton) {
        publishButton.addEventListener('click', handlePublish);
    }
    
    // 別のサイトを公開ボタン
    const publishAnotherButton = document.getElementById('publish-another');
    if (publishAnotherButton) {
        publishAnotherButton.addEventListener('click', resetApp);
    }
    
    // サイトを見るボタン
    const viewSiteButton = document.getElementById('view-site');
    if (viewSiteButton) {
        viewSiteButton.addEventListener('click', () => {
            const url = document.getElementById('published-url').href;
            window.open(url, '_blank');
        });
    }
    
    // URLコピーボタン
    const copyUrlButton = document.getElementById('copy-url');
    if (copyUrlButton) {
        copyUrlButton.addEventListener('click', copyUrlToClipboard);
    }
    
    // モーダル関連
    setupModalListeners();
}

/**
 * モーダルのイベントリスナー設定
 */
function setupModalListeners() {
    const aboutLink = document.getElementById('about-link');
    const securityLink = document.getElementById('security-link');
    const aboutModal = document.getElementById('about-modal');
    const securityModal = document.getElementById('security-modal');
    
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            showModal(aboutModal);
        });
    }
    
    if (securityLink) {
        securityLink.addEventListener('click', (e) => {
            e.preventDefault();
            showModal(securityModal);
        });
    }
    
    // モーダルを閉じる
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });
    
    // モーダルの外側をクリックで閉じる
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
}

/**
 * モーダルを表示
 */
function showModal(modal) {
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * 認証状態のチェック
 */
function checkAuthStatus() {
    const token = getAccessToken();
    const username = getUsername();
    
    if (token && username) {
        showAuthenticatedUI(username);
    }
}

/**
 * 認証処理
 */
function handleAuth() {
    // 新しいタブでGitHub Personal Access Token生成ページを開く
    window.open('https://github.com/settings/tokens/new', '_blank');
    
    // トークン入力ダイアログを表示（少し遅延させる）
    setTimeout(() => {
        showTokenInputDialog();
    }, 500);
}

/**
 * OAuth コールバック処理
 */
async function handleOAuthCallback(code) {
    try {
        // 注意: この実装では、実際のトークン交換は行えません
        // 実際の本番環境では、サーバーサイドでトークン交換を行う必要があります
        
        // デモ用: GitHub Personal Access Token を使用する場合
        // ユーザーに直接トークンを入力してもらう方法
        showTokenInputDialog();
        
    } catch (error) {
        console.error('OAuth認証エラー:', error);
        alert(CONFIG.messages.errors.authFailed);
    }
}

/**
 * トークン入力ダイアログを表示（カスタムモーダル）
 */
function showTokenInputDialog() {
    const modal = document.getElementById('token-modal');
    const tokenInput = document.getElementById('token-input');
    const tokenError = document.getElementById('token-error');
    const submitButton = document.getElementById('token-submit');
    const cancelButton = document.getElementById('token-cancel');
    
    // エラーメッセージをクリア
    tokenError.style.display = 'none';
    tokenInput.value = '';
    
    // モーダルを表示
    modal.classList.add('show');
    
    // 入力フィールドにフォーカス
    setTimeout(() => tokenInput.focus(), 100);
    
    // Enterキーで送信
    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            submitButton.click();
        }
    };
    tokenInput.addEventListener('keypress', handleEnter);
    
    // 送信ボタンのイベントリスナー
    const handleSubmit = async () => {
        const token = tokenInput.value.trim();
        
        if (!token) {
            tokenError.textContent = 'トークンを入力してください。';
            tokenError.style.display = 'block';
            return;
        }
        
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            tokenError.textContent = '無効なトークン形式です。ghp_ または github_pat_ で始まる必要があります。';
            tokenError.style.display = 'block';
            return;
        }
        
        // ボタンを無効化
        submitButton.disabled = true;
        submitButton.textContent = '認証中...';
        
        try {
            await validateAndSaveToken(token);
            // 成功したらモーダルを閉じる
            modal.classList.remove('show');
            cleanup();
        } catch (error) {
            // エラーの場合は表示
            tokenError.textContent = error.message || 'トークンの検証に失敗しました。';
            tokenError.style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = '認証する';
        }
    };
    
    // キャンセルボタンのイベントリスナー
    const handleCancel = () => {
        modal.classList.remove('show');
        cleanup();
        // URLからcodeパラメータを削除
        window.history.replaceState({}, document.title, window.location.pathname);
    };
    
    // クリーンアップ関数
    const cleanup = () => {
        submitButton.removeEventListener('click', handleSubmit);
        cancelButton.removeEventListener('click', handleCancel);
        tokenInput.removeEventListener('keypress', handleEnter);
        submitButton.disabled = false;
        submitButton.textContent = '認証する';
    };
    
    // イベントリスナーを設定
    submitButton.addEventListener('click', handleSubmit);
    cancelButton.addEventListener('click', handleCancel);
}

/**
 * トークンの検証と保存
 */
async function validateAndSaveToken(token) {
    try {
        const response = await fetch(`${CONFIG.github.apiBaseUrl}/user`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            saveAccessToken(token);
            saveUsername(user.login);
            showAuthenticatedUI(user.login);
            
            // URLからcodeパラメータを削除
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            throw new Error('トークンが無効です');
        }
    } catch (error) {
        console.error('トークン検証エラー:', error);
        alert('トークンの検証に失敗しました。正しいトークンを入力してください。');
    }
}

/**
 * 認証済みUIを表示
 */
function showAuthenticatedUI(username) {
    document.getElementById('not-authenticated').style.display = 'none';
    document.getElementById('authenticated').style.display = 'block';
    document.getElementById('username').textContent = username;
}

/**
 * ステップ間のナビゲーション
 */
function navigateToStep(step) {
    // 現在のセクションを非表示
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 新しいセクションを表示
    const sections = ['auth-section', 'upload-section', 'publishing-section', 'complete-section'];
    const targetSection = document.getElementById(sections[step - 1]);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // ステップインジケーターを更新
    updateStepIndicator(step);
    currentStep = step;
}

/**
 * ステップインジケーターの更新
 */
function updateStepIndicator(step) {
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 < step) {
            stepEl.classList.add('completed');
        } else if (index + 1 === step) {
            stepEl.classList.add('active');
        }
    });
}

/**
 * ファイル選択処理
 */
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    addFiles(files);
}

/**
 * ドラッグオーバー処理
 */
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

/**
 * ドラッグリーブ処理
 */
function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

/**
 * ドロップ処理
 */
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
}

/**
 * ファイルを追加
 */
function addFiles(files) {
    files.forEach(file => {
        // ファイルサイズチェック
        if (file.size > CONFIG.app.maxFileSize) {
            alert(`${file.name}: ${CONFIG.messages.errors.fileTooLarge}`);
            return;
        }
        
        // 重複チェック
        const isDuplicate = uploadedFiles.some(f => f.name === file.name);
        if (!isDuplicate) {
            uploadedFiles.push(file);
        }
    });
    
    // 合計サイズチェック
    const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > CONFIG.app.maxTotalSize) {
        alert(CONFIG.messages.errors.totalSizeTooLarge);
        uploadedFiles = uploadedFiles.slice(0, -files.length);
    }
    
    renderFileList();
    validatePublishButton();
}

/**
 * ファイルリストを表示
 */
function renderFileList() {
    const fileList = document.getElementById('file-list');
    
    if (uploadedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }
    
    fileList.innerHTML = uploadedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <div class="file-icon">${getFileIcon(file.name)}</div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="file-remove" onclick="removeFile(${index})">✕</button>
        </div>
    `).join('');
}

/**
 * ファイルを削除
 */
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderFileList();
    validatePublishButton();
}

// グローバルスコープに公開
window.removeFile = removeFile;

/**
 * 公開ボタンの有効/無効を切り替え
 */
function validatePublishButton() {
    const publishButton = document.getElementById('start-publish');
    const repoNameInput = document.getElementById('repo-name');
    const repoName = repoNameInput.value.trim();
    
    const isValid = uploadedFiles.length > 0 && 
                   repoName.length > 0 && 
                   validateRepoName(repoName);
    
    publishButton.disabled = !isValid;
}

/**
 * 公開処理
 */
async function handlePublish() {
    const repoName = document.getElementById('repo-name').value.trim();
    const token = getAccessToken();
    const username = getUsername();
    
    if (!token || !username) {
        alert(CONFIG.messages.errors.authFailed);
        return;
    }
    
    if (uploadedFiles.length === 0) {
        alert(CONFIG.messages.errors.noFiles);
        return;
    }
    
    if (!validateRepoName(repoName)) {
        alert(CONFIG.messages.errors.invalidRepoName);
        return;
    }
    
    // 公開処理画面に移動
    navigateToStep(3);
    
    try {
        // ステップ1: リポジトリ作成
        updateProgressStep(0, 'processing');
        await createRepository(token, repoName);
        updateProgressStep(0, 'completed');
        
        // ステップ2: ファイルアップロード
        updateProgressStep(1, 'processing');
        await uploadFiles(token, username, repoName);
        updateProgressStep(1, 'completed');
        
        // ステップ3: GitHub Pages 有効化
        updateProgressStep(2, 'processing');
        await enableGitHubPages(token, username, repoName);
        updateProgressStep(2, 'completed');
        
        // 完了画面に移動
        const publishedUrl = `https://${username}.github.io/${repoName}/`;
        const repoUrl = `https://github.com/${username}/${repoName}`;
        showCompletionScreen(publishedUrl, repoUrl);
        
    } catch (error) {
        console.error('公開エラー:', error);
        showError(error.message);
    }
}

/**
 * プログレスステップの更新
 */
function updateProgressStep(stepIndex, status) {
    const progressSteps = document.querySelectorAll('.progress-step');
    if (progressSteps[stepIndex]) {
        progressSteps[stepIndex].setAttribute('data-status', status);
    }
}

/**
 * リポジトリ削除
 */
async function deleteRepository(token, username, repoName) {
    try {
        const response = await fetch(`${CONFIG.github.apiBaseUrl}/repos/${username}/${repoName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok || response.status === 404) {
            // 成功または既に存在しない場合はOK
            return true;
        }
        return false;
    } catch (error) {
        console.error('リポジトリ削除エラー:', error);
        return false;
    }
}

/**
 * リポジトリ作成
 */
async function createRepository(token, repoName) {
    const username = getUsername();
    
    // 既存のリポジトリをチェック
    const checkResponse = await fetch(`${CONFIG.github.apiBaseUrl}/repos/${username}/${repoName}`, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    // リポジトリが既に存在する場合は削除
    if (checkResponse.ok) {
        console.log(`既存のリポジトリ ${repoName} を削除中...`);
        await deleteRepository(token, username, repoName);
        // 削除後、少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 新しいリポジトリを作成
    const response = await fetch(`${CONFIG.github.apiBaseUrl}/user/repos`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: repoName,
            description: 'Website published via GitHub Pages Auto Publisher',
            private: false,
            auto_init: true
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
            throw new Error(CONFIG.messages.errors.rateLimitExceeded);
        }
        throw new Error(CONFIG.messages.errors.repoCreateFailed + ': ' + (error.message || ''));
    }
    
    return response.json();
}

/**
 * ファイルアップロード
 */
async function uploadFiles(token, username, repoName) {
    // 各ファイルを順番にアップロード
    for (const file of uploadedFiles) {
        await uploadSingleFile(token, username, repoName, file);
    }
}

/**
 * 単一ファイルのアップロード
 */
async function uploadSingleFile(token, username, repoName, file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const content = btoa(
                    new Uint8Array(e.target.result)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                
                const response = await fetch(
                    `${CONFIG.github.apiBaseUrl}/repos/${username}/${repoName}/contents/${file.name}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Add ${file.name}`,
                            content: content
                        })
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }
                
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * GitHub Pages 有効化
 */
async function enableGitHubPages(token, username, repoName) {
    const response = await fetch(
        `${CONFIG.github.apiBaseUrl}/repos/${username}/${repoName}/pages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: {
                    branch: 'main',
                    path: '/'
                }
            })
        }
    );
    
    // 既に有効化されている場合は409が返る（これは正常）
    if (!response.ok && response.status !== 409) {
        // GitHub Pagesが既に有効化されている可能性があるため、確認
        const checkResponse = await fetch(
            `${CONFIG.github.apiBaseUrl}/repos/${username}/${repoName}/pages`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!checkResponse.ok) {
            throw new Error(CONFIG.messages.errors.pagesActivationFailed);
        }
    }
    
    // GitHub Pagesの有効化を待つ
    await new Promise(resolve => setTimeout(resolve, CONFIG.app.pagesActivationDelay));
}

/**
 * 完了画面を表示
 */
function showCompletionScreen(publishedUrl, repoUrl) {
    document.getElementById('published-url').href = publishedUrl;
    document.getElementById('published-url').textContent = publishedUrl;
    document.getElementById('repo-url').href = repoUrl;
    document.getElementById('repo-url').textContent = repoUrl;
    
    navigateToStep(4);
}

/**
 * エラー表示
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    
    // README.mdエラーの特別な案内
    const isReadmeError = message.includes('README.md');
    
    let errorContent = `
        <h3 style="margin-bottom: 15px; color: #721c24;">❌ エラーが発生しました</h3>
        <p style="margin-bottom: 15px;"><strong>エラー内容:</strong> ${message}</p>
    `;
    
    if (isReadmeError) {
        // README.md専用の詳細案内
        errorContent += `
            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
                <h4 style="margin-bottom: 15px; color: #721c24;">📋 README.mdエラーについて</h4>
                <p style="margin-bottom: 15px; line-height: 1.8;">
                    このエラーは、GitHubがリポジトリ作成時に自動的にREADME.mdファイルを作成するため、
                    アップロードしようとしたREADME.mdと競合が発生したことが原因です。
                </p>
                <h5 style="margin-bottom: 10px; color: #721c24;">💡 解決策（推奨順）</h5>
                <ol style="margin-left: 20px; line-height: 2;">
                    <li style="margin-bottom: 10px;">
                        <strong>README.mdを除外して再試行（最も簡単）</strong><br>
                        <span style="font-size: 0.9em;">
                        1. 「ファイル選択に戻る」ボタンをクリック<br>
                        2. ファイル一覧からREADME.mdの右側の「✕」ボタンをクリックして削除<br>
                        3. 他のファイルだけで「公開を開始」をクリック<br>
                        4. 公開後、必要に応じてGitHub上で直接README.mdを編集
                        </span>
                    </li>
                    <li style="margin-bottom: 10px;">
                        <strong>ファイル名を変更する</strong><br>
                        <span style="font-size: 0.9em;">
                        パソコン上のREADME.mdを「readme.md」（小文字）や「about.md」などに変更してから再度アップロード
                        </span>
                    </li>
                </ol>
                <div style="background: #d1ecf1; padding: 12px; border-radius: 5px; margin-top: 15px;">
                    <p style="margin: 0; font-size: 0.9em; color: #0c5460;">
                        <strong>💡 なぜREADME.mdは不要？</strong><br>
                        GitHubは新しいリポジトリを作成する際、自動的にREADME.mdファイルを生成します。
                        このファイルにはリポジトリの説明が記載され、GitHub上で直接編集できます。
                        そのため、わざわざアップロードする必要はありません。
                    </p>
                </div>
            </div>
        `;
    } else {
        // 一般的なエラーの案内
        errorContent += `
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <h4 style="margin-bottom: 15px; color: #856404;">🔧 対処方法</h4>
                
                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 10px; color: #856404;">1️⃣ トークンの権限を確認（最優先）</h5>
                    <p style="margin-bottom: 10px; line-height: 1.8;">
                        リポジトリ作成エラーの最も一般的な原因は、トークンの権限不足です。
                    </p>
                    <ol style="margin-left: 20px; line-height: 1.8; font-size: 0.95em;">
                        <li>GitHubにアクセス: <a href="https://github.com/settings/tokens" target="_blank" style="color: #0366d6;">https://github.com/settings/tokens</a></li>
                        <li>既存のトークンを削除（右側の「Delete」ボタン）</li>
                        <li>「Generate new token (classic)」ボタンをクリック</li>
                        <li><strong style="color: #dc3545;">重要: 必ず「repo」にチェック✓を入れる</strong></li>
                        <li>「Generate token」ボタンをクリック</li>
                        <li>新しいトークンをコピー</li>
                        <li>このツールに戻って再度認証</li>
                    </ol>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 10px; color: #856404;">2️⃣ 別のリポジトリ名を使用</h5>
                    <p style="margin-bottom: 10px; line-height: 1.8;">
                        リポジトリ名が既に使用されている、または無効な場合は別の名前を試してください。
                    </p>
                    <ol style="margin-left: 20px; line-height: 1.8; font-size: 0.95em;">
                        <li>下の「ファイル選択に戻る」ボタンをクリック</li>
                        <li>リポジトリ名の入力欄に別の名前を入力
                            <ul style="margin-left: 20px; margin-top: 5px;">
                                <li>例: <code>my-website</code> → <code>my-website-2</code></li>
                                <li>例: <code>test-site</code> → <code>test-site-new</code></li>
                                <li>例: 日付を追加 <code>my-site-20250102</code></li>
                            </ul>
                        </li>
                        <li>「公開を開始」ボタンをクリック</li>
                    </ol>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 10px; color: #856404;">3️⃣ GitHubで手動でリポジトリを削除</h5>
                    <p style="margin-bottom: 10px; line-height: 1.8;">
                        既存のリポジトリと同じ名前を使いたい場合は、先に削除してください。
                    </p>
                    <ol style="margin-left: 20px; line-height: 1.8; font-size: 0.95em;">
                        <li>GitHubのリポジトリ一覧にアクセス:
                            <ul style="margin-left: 20px; margin-top: 5px;">
                                <li>GitHubのトップページ右上のプロフィールアイコンをクリック</li>
                                <li>「Your repositories」をクリック</li>
                            </ul>
                        </li>
                        <li>削除したいリポジトリ名をクリックして開く</li>
                        <li>「Settings」タブをクリック</li>
                        <li>一番下までスクロール</li>
                        <li>「Danger Zone」セクションの「Delete this repository」をクリック</li>
                        <li>確認のためリポジトリ名を入力</li>
                        <li>「I understand the consequences, delete this repository」をクリック</li>
                        <li>このツールに戻って「もう一度試す」をクリック</li>
                    </ol>
                </div>
                
                <div>
                    <h5 style="margin-bottom: 10px; color: #856404;">4️⃣ その他の対処</h5>
                    <ul style="margin-left: 20px; line-height: 1.8; font-size: 0.95em;">
                        <li><strong>ファイル名に問題がある場合:</strong><br>
                            日本語、スペース、特殊記号を削除し、英数字、ハイフン（-）、アンダースコア（_）のみ使用
                        </li>
                        <li><strong>ネットワークエラーの場合:</strong><br>
                            インターネット接続を確認して、数分待ってから再試行
                        </li>
                        <li><strong>APIレート制限の場合:</strong><br>
                            1時間待ってから再試行
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    errorContent += `
        <div style="display: flex; gap: 15px; justify-content: center;">
            <button id="retry-publish" class="primary-button">もう一度試す</button>
            <button id="back-to-upload-error" class="secondary-button">ファイル選択に戻る</button>
        </div>
    `;
    
    errorElement.innerHTML = errorContent;
    
    errorElement.style.display = 'block';
    
    // すべてのプログレスステップをエラー状態に
    document.querySelectorAll('.progress-step').forEach(step => {
        if (step.getAttribute('data-status') === 'processing') {
            step.setAttribute('data-status', 'error');
        }
    });
    
    // リトライボタンのイベントリスナー
    const retryButton = document.getElementById('retry-publish');
    if (retryButton) {
        retryButton.addEventListener('click', () => {
            // プログレスステップをリセット
            document.querySelectorAll('.progress-step').forEach(step => {
                step.setAttribute('data-status', 'pending');
            });
            errorElement.style.display = 'none';
            // 公開処理を再実行
            handlePublish();
        });
    }
    
    // 戻るボタンのイベントリスナー
    const backButton = document.getElementById('back-to-upload-error');
    if (backButton) {
        backButton.addEventListener('click', () => {
            navigateToStep(2);
        });
    }
}

/**
 * URLをクリップボードにコピー
 */
function copyUrlToClipboard() {
    const url = document.getElementById('published-url').textContent;
    
    navigator.clipboard.writeText(url).then(() => {
        const button = document.getElementById('copy-url');
        const originalText = button.textContent;
        button.textContent = '✓';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('コピーエラー:', err);
        alert('URLのコピーに失敗しました');
    });
}

/**
 * アプリケーションをリセット
 */
function resetApp() {
    uploadedFiles = [];
    currentStep = 1;
    document.getElementById('repo-name').value = '';
    document.getElementById('file-input').value = '';
    renderFileList();
    
    // プログレスステップをリセット
    document.querySelectorAll('.progress-step').forEach(step => {
        step.setAttribute('data-status', 'pending');
    });
    
    // エラーメッセージを非表示
    document.getElementById('error-message').style.display = 'none';
    
    // ステップ2に戻る
    navigateToStep(2);
}
