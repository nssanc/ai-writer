'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Paper {
  id?: string;
  title: string;
  authors: string;
  abstract: string;
  url: string;
  pdf_url?: string;
  published?: string;
  translatedTitle?: string;
  translatedAbstract?: string;
}

export default function SearchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'arxiv' | 'pubmed'>('arxiv');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  const [translating, setTranslating] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    setSearching(true);
    setResults([]);
    setSelectedPapers(new Set());

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

  const toggleSelectAll = () => {
    if (selectedPapers.size === results.length) {
      setSelectedPapers(new Set());
    } else {
      setSelectedPapers(new Set(results.map((_, index) => index)));
    }
  };

  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedPapers);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPapers(newSelected);
  };

  const translatePaper = async (index: number) => {
    const paper = results[index];
    if (paper.translatedTitle && paper.translatedAbstract) {
      return;
    }

    setTranslating(new Set(translating).add(index));

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const newResults = [...results];
        newResults[index] = {
          ...paper,
          translatedTitle: data.data.title,
          translatedAbstract: data.data.abstract,
        };
        setResults(newResults);
      } else {
        alert('翻译失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('翻译失败:', error);
      alert('翻译失败，请重试');
    } finally {
      const newTranslating = new Set(translating);
      newTranslating.delete(index);
      setTranslating(newTranslating);
    }
  };

  const saveSelectedPapers = async () => {
    if (selectedPapers.size === 0) {
      alert('请至少选择一篇文献');
      return;
    }

    setSaving(true);
    try {
      const selectedData = Array.from(selectedPapers).map(index => results[index]);

      const response = await fetch(`/api/projects/${projectId}/literature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papers: selectedData }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`成功保存 ${selectedPapers.size} 篇文献！`);
        router.push(`/projects/${projectId}`);
      } else {
        alert('保存失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                搜索结果 ({results.length})
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  {selectedPapers.size === results.length ? '取消全选' : '全选'}
                </button>
                <button
                  onClick={saveSelectedPapers}
                  disabled={saving || selectedPapers.size === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? '保存中...' : `保存选中 (${selectedPapers.size})`}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {results.map((paper, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedPapers.has(index)}
                      onChange={() => toggleSelect(index)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="mb-3">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium text-gray-900 flex-1">
                            {paper.translatedTitle || paper.title}
                          </h3>
                          <button
                            onClick={() => translatePaper(index)}
                            disabled={translating.has(index)}
                            className="ml-3 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {translating.has(index) ? '翻译中...' : paper.translatedTitle ? '已翻译' : '翻译'}
                          </button>
                        </div>
                        {paper.translatedTitle && (
                          <p className="text-sm text-gray-500 italic">
                            原标题: {paper.title}
                          </p>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        作者: {paper.authors}
                      </p>
                      {paper.published && (
                        <p className="text-sm text-gray-500 mb-2">
                          发表时间: {paper.published}
                        </p>
                      )}

                      <div className="mb-3">
                        <p className="text-sm text-gray-700">
                          {paper.translatedAbstract || paper.abstract}
                        </p>
                        {paper.translatedAbstract && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-500 cursor-pointer">
                              查看原文摘要
                            </summary>
                            <p className="text-sm text-gray-600 mt-1 italic">
                              {paper.abstract}
                            </p>
                          </details>
                        )}
                      </div>

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
