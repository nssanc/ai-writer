'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [papers, setPapers] = useState<ReferencePaper[]>([]);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

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

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();
      if (data.success) {
        setStyleAnalysis(data.data);
        alert('风格分析完成！');
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
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                project.status
              )}`}
            >
              {getStatusText(project.status)}
            </span>
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
                  参考文献
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
                  <p className="mb-2">还没有上传参考文献</p>
                  <p className="text-sm">请上传1-2篇参考期刊文献用于风格分析</p>
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

            {/* 风格分析 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                风格分析与写作指南
              </h2>

              {!styleAnalysis ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">还未进行风格分析</p>
                  <button
                    onClick={handleAnalyzeStyle}
                    disabled={analyzing || papers.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {analyzing ? '分析中...' : '开始风格分析'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">分析结果</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {styleAnalysis.analysis_result}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">写作指南</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {styleAnalysis.writing_guide}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/projects/${projectId}/guide`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      编辑写作指南 →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧操作栏 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">操作</h3>
              <div className="space-y-3">
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
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
