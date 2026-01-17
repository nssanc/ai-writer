'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Template {
  id: number;
  name: string;
  description: string;
  structure: string;
  is_default: number;
  created_at: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('获取模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm('确定要删除这个模板吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchTemplates();
        alert('模板删除成功');
      } else {
        alert('删除失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除模板失败，请重试');
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
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">综述模板管理</h1>
          <p className="text-gray-600 mt-2">
            选择或自定义综述结构模板
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {template.name}
                </h3>
                {template.is_default === 1 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    默认
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {template.description}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePreview(template)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  预览
                </button>
                {template.is_default === 0 && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 预览模态框 */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedTemplate.name}
                  </h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-600 mt-2">{selectedTemplate.description}</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {selectedTemplate.structure}
                </pre>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
