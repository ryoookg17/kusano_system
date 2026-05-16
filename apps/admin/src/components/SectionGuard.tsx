'use client';

import { useState, useEffect } from 'react';
import { Lock, LogIn, Loader2 } from 'lucide-react';

interface SectionGuardProps {
  children: React.ReactNode;
  sectionId: string;
  sectionName: string;
}

export default function SectionGuard({ children, sectionId, sectionName }: SectionGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 初回レンダリング時にクッキーを確認
  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const hasCookie = cookies.some(c => c.trim().startsWith(`section_auth_${sectionId}=`));
      setIsAuthenticated(hasCookie);
    };
    checkAuth();
  }, [sectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/section-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setError(data.message || 'パスワードが正しくありません');
      }
    } catch (err) {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color="#94a3b8" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
        background: 'white',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#f1f5f9',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          color: '#1e293b'
        }}>
          <Lock size={32} />
        </div>

        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          {sectionName}
        </h2>
        <p style={{
          color: '#64748b',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          このメニューを表示するには、専用のパスワードを入力してください
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                color: '#1e293b',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#1e293b',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <LogIn size={20} />
                <span>ロックを解除</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
