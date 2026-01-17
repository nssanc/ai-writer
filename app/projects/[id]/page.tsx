'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WorkflowProgress from '@/components/WorkflowProgress';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface ReferencePaper {
  id: number;
  filename: string;
  file_type: string;
  created_at: string;
}

interface StyleAnalysis {
  id: number;
  analysis_result: string;
  writing_guide: string;
  created_at: string;
}

interface ReviewPlan {
  id: number;
  plan_content: string;
  version: number;
  created_at: string;
}

interface SearchedLiterature {
  id: number;
  title: string;
  source: string;
}

interface ReviewDraft {
  id: number;
  content: string;
  language: string;
}

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [papers, setPapers] = useState<ReferencePaper[]>([]);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [plan, setPlan] = useState<ReviewPlan | null>(null);
  const [searchedLiterature, setSearchedLiterature] = useState<SearchedLiterature[]>([]);
  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');

  const handleDeleteLiterature = async (literatureId: number) => {
    if (!confirm('确定要删除这篇文献吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/literature?id=${literatureId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchProjectData();
      } else {
        alert('删除失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('删除文献失败:', error);
      alert('删除文献失败，请重试');
    }
  };

  const handleClearAllLiterature = async () => {
    if (!confirm(`确定要清除所有 ${searchedLiterature.length} 篇文献吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/literature/clear`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchProjectData();
        alert('已清除所有文献');
      } else {
        alert('清除失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('清除文献失败:', error);
      alert('清除文献失败，请重试');
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      if (projectData.success) {
        setProject(projectData.data);
      }

      const papersRes = await fetch(`/api/projects/${projectId}/papers`);
      const papersData = await papersRes.json();
      if (papersData.success) {
        setPapers(papersData.data);
      }

      const analysisRes = await fetch(`/api/projects/${projectId}/analysis`);
      const analysisData = await analysisRes.json();
      if (analysisData.success && analysisData.data) {
        setStyleAnalysis(analysisData.data);
      }

      const planRes = await fetch(`/api/projects/${projectId}/plan`);
      const planData = await planRes.json();
      if (planData.success && planData.data) {
        setPlan(planData.data);
      }

      const literatureRes = await fetch(`/api/projects/${projectId}/literature`);
      const literatureData = await literatureRes.json();
      if (literatureData.success && literatureData.data) {
        setSearchedLiterature(literatureData.data);
      }

      // Check if any draft exists (check both languages)
      const draftZhRes = await fetch(`/api/projects/${projectId}/draft?language=zh`);
      const draftZhData = await draftZhRes.json();
      const draftEnRes = await fetch(`/api/projects/${projectId}/draft?language=en`);
      const draftEnData = await draftEnRes.json();

      const allDrafts = [];
      if (draftZhData.success && draftZhData.data) {
        allDrafts.push(draftZhData.data);
      }
      if (draftEnData.success && draftEnData.data) {
        allDrafts.push(draftEnData.data);
      }
      setDrafts(allDrafts);
    } catch (error) {
      console.error('获取项目数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    if (papers.length === 0) {
      alert('请先上传参考文献');
      return;
    }

    // 如果已有分析结果，提示用户确认
    if (styleAnalysis && !confirm('已有风格分析结果，确定要重新生成吗？这将覆盖现有内容。')) {
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress('正在读取文献内容...');

    try {
      const response = await fetch('/api/analyze/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      setAnalysisProgress('正在分析写作风格...');

      const data = await response.json();
      if (data.success) {
        setAnalysisProgress('正在生成写作指南...');
        setStyleAnalysis(data.data);
        setAnalysisProgress('分析完成！');
        setTimeout(() => setAnalysisProgress(''), 2000);
        alert('风格分析完成！');
      } else {
        alert('分析失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('风格分析失败:', error);
      alert('风格分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      analyzing: '分析中',
      writing: '写作中',
      completed: '已完成',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      analyzing: 'bg-blue-100 text-blue-800',
      writing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">项目不存在</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
              >
                ← 返回项目列表
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/config"
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                ⚙️ AI 配置
              </Link>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  project.status
                )}`}
              >
                {getStatusText(project.status)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* 参考文献 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  参照文献（风格分析样本）
                </h2>
                <Link
                  href={`/projects/${projectId}/upload`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + 上传文献
                </Link>
              </div>

              {papers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">还没有上传参照文献</p>
                  <p className="text-sm">请上传1-2篇参照期刊文献用于风格分析</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {papers.map((paper) => (
                    <div
                      key={paper.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">
                            {paper.filename}
                          </p>
                          <p className="text-sm text-gray-500">
                            {paper.file_type.toUpperCase()} • {new Date(paper.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 搜索文献 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  搜索文献 ({searchedLiterature.length})
                </h2>
                <div className="flex space-x-2">
                  {searchedLiterature.length > 0 && (
                    <button
                      onClick={handleClearAllLiterature}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      清除全部
                    </button>
                  )}
                  <Link
                    href={`/projects/${projectId}/search`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + 搜索更多文献
                  </Link>
                </div>
              </div>

              {searchedLiterature.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">还没有搜索保存的文献</p>
                  <p className="text-sm">使用搜索功能查找并保存相关文献</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchedLiterature.slice(0, 5).map((lit: any) => (
                    <div
                      key={lit.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            {lit.title}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            {lit.authors}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {lit.source}
                            </span>
                            {lit.pdf_url && (
                              <a
                                href={lit.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                📄 PDF链接
                              </a>
                            )}
                            <a
                              href={lit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              🔗 查看详情
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLiterature(lit.id)}
                          className="ml-3 text-red-600 hover:text-red-700 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                  {searchedLiterature.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500">
                        共 {searchedLiterature.length} 篇文献，显示前 5 篇
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 风格分析 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    风格分析与写作指南
                  </h2>
                  {styleAnalysis && (
                    <button
                      onClick={handleAnalyzeStyle}
                      disabled={analyzing}
                      className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 transition-colors"
                    >
                      {analyzing ? '生成中...' : '🔄 重新生成'}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {!styleAnalysis ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">还未进行风格分析</p>
                    <button
                      onClick={handleAnalyzeStyle}
                      disabled={analyzing || papers.length === 0}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {analyzing ? '分析中...' : '开始风格分析'}
                    </button>
                    {analyzing && analysisProgress && (
                      <div className="mt-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-blue-600">{analysisProgress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium text-gray-900">分析结果</h3>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                          {styleAnalysis.analysis_result}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium text-gray-900">写作指南</h3>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                          {styleAnalysis.writing_guide}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Link
                        href={`/projects/${projectId}/guide`}
                        className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <span>编辑写作指南</span>
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                    {analyzing && analysisProgress && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-blue-600">{analysisProgress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧操作栏 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">操作</h3>
              <div className="space-y-3">
                <Link
                  href={`/projects/${projectId}/keywords`}
                  className="block w-full px-4 py-2 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700"
                >
                  关键词管理
                </Link>
                <Link
                  href={`/projects/${projectId}/upload`}
                  className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
                >
                  上传文献
                </Link>
                <Link
                  href={`/projects/${projectId}/search`}
                  className="block w-full px-4 py-2 bg-white text-blue-600 border border-blue-600 text-center rounded-lg hover:bg-blue-50"
                >
                  搜索文献
                </Link>
                <Link
                  href={`/projects/${projectId}/plan`}
                  className="block w-full px-4 py-2 bg-white text-blue-600 border border-blue-600 text-center rounded-lg hover:bg-blue-50"
                >
                  撰写计划
                </Link>
                <Link
                  href={`/projects/${projectId}/write`}
                  className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700"
                >
                  开始写作
                </Link>
                <Link
                  href={`/projects/${projectId}/diagram`}
                  className="block w-full px-4 py-2 bg-orange-600 text-white text-center rounded-lg hover:bg-orange-700"
                >
                  🎨 AI绘制图表
                </Link>
              </div>
            </div>

            {/* 工作流程 */}
            <WorkflowProgress
              projectId={projectId}
              hasPapers={papers.length > 0}
              hasAnalysis={styleAnalysis !== null}
              hasPlan={plan !== null}
              hasSearchedLiterature={searchedLiterature.length > 0}
              hasDraft={drafts.length > 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
