'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ReviewDraft {
  id: number;
  content: string;
  language: string;
  version: number;
  created_at: string;
}

export default function WritePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    fetchDraft();
  }, [projectId, language]);

  const fetchDraft = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/draft?language=${language}`);
      const data = await response.json();
      if (data.success && data.data) {
        setDraft(data.data);
        setContent(data.data.content);
      }
    } catch (error) {
      console.error('获取草稿失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWriting = async () => {
    setWriting(true);
    setProgress('正在启动AI写作...');
    setContent('');

    try {
      const response = await fetch('/api/write/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, language }),
      });

      if (!response.ok) {
        throw new Error('启动写作失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          accumulatedContent += chunk;
          setContent(accumulatedContent);
          setProgress('AI正在写作中...');
        }
      }

      setProgress('写作完成！');
      alert('AI写作完成！');
    } catch (error) {
      console.error('AI写作失败:', error);
      alert('AI写作失败，请重试');
    } finally {
      setWriting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/projects/${projectId}`}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← 返回项目
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            AI自动写作
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 语言选择和操作 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button
                onClick={() => setLanguage('zh')}
                className={`px-4 py-2 rounded-lg ${
                  language === 'zh'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-lg ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={handleStartWriting}
              disabled={writing || !!draft}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {writing ? progress : draft ? '已生成草稿' : '开始AI写作'}
            </button>
          </div>
        </div>

        {/* 内容显示区域 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            综述内容
          </h2>
          <div className="border border-gray-300 rounded-lg p-4 min-h-[500px]">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {content || '点击"开始AI写作"按钮生成综述内容...'}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
