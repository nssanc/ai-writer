'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Paper {
  id?: string;
  title: string;
  authors: string;
  abstract: string;
  url: string;
  pdf_url?: string;
  published?: string;
}

export default function SearchPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'arxiv' | 'pubmed'>('arxiv');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Paper[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    setSearching(true);
    setResults([]);

    try {
      const endpoint = source === 'arxiv' ? '/api/search/arxiv' : '/api/search/pubmed';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults: 20 }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        alert(data.error || '搜索失败');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请重试');
    } finally {
      setSearching(false);
    }
  };

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
            搜索文献
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索表单 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数据源
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSource('arxiv')}
                  className={`px-4 py-2 rounded-lg ${
                    source === 'arxiv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  arXiv
                </button>
                <button
                  onClick={() => setSource('pubmed')}
                  className={`px-4 py-2 rounded-lg ${
                    source === 'pubmed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  PubMed
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索关键词
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入关键词，如：machine learning, deep learning"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {searching ? '搜索中...' : '搜索'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索结果 */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              搜索结果 ({results.length})
            </h2>
            <div className="space-y-4">
              {results.map((paper, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {paper.authors}
                  </p>
                  {paper.published && (
                    <p className="text-sm text-gray-500 mb-2">
                      发表时间: {paper.published}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {paper.abstract}
                  </p>
                  <div className="flex space-x-3">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      查看详情 →
                    </a>
                    {paper.pdf_url && (
                      <a
                        href={paper.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        下载PDF →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
