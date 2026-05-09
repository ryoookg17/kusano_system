/**
 * ブラウザ上でBlobデータを確実にファイルとしてダウンロードさせるユーティリティ。
 * Next.jsのルーターやブラウザ拡張機能の干渉を回避する。
 */
export function downloadBlob(blob: Blob, fileName: string) {
  // iframe方式: ブラウザのメインウィンドウのイベントハンドラの影響を完全に回避する
  const url = window.URL.createObjectURL(blob);

  // 非表示のiframeを使ってNext.jsの干渉を完全に回避
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  // iframe内にaタグを作成してクリック
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    const a = iframeDoc.createElement("a");
    a.href = url;
    a.download = fileName;
    iframeDoc.body.appendChild(a);
    a.click();
  } else {
    // フォールバック: window.openを使う
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // クリーンアップ
  window.setTimeout(() => {
    try { document.body.removeChild(iframe); } catch {}
    window.URL.revokeObjectURL(url);
  }, 10000);
}
