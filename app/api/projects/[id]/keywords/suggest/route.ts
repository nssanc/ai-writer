import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { db } from '@/lib/db';

// AI推荐关键词
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { userKeywords, projectDescription } = body;

    if (!userKeywords || userKeywords.length === 0) {
      return NextResponse.json(
        { error: '请至少提供一个关键词' },
        { status: 400 }
      );
    }

    const prompt = `作为一个学术研究助手，请基于以下信息推荐相关的研究关键词：

用户提供的关键词：${userKeywords.join(', ')}
${projectDescription ? `项目描述：${projectDescription}` : ''}

请推荐10-15个相关的学术关键词，包括：
1. 核心概念的同义词和相关术语
2. 相关的研究方法
3. 相关的应用领域
4. 相关的技术和工具

请按以下JSON格式返回（不要包含markdown代码块标记）：
{
  "keywords": [
    {"keyword": "关键词1", "category": "方法类/应用类/理论类/数据类", "relevance": "相关性说明"},
    ...
  ]
}`;

    const response = await aiService.chat(prompt);

    // 解析AI返回的JSON
    let suggestions;
    try {
      // 移除可能的markdown代码块标记
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      return NextResponse.json(
        { error: 'AI响应格式错误' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: suggestions.keywords || [],
    });
  } catch (error) {
    console.error('推荐关键词失败:', error);
    return NextResponse.json(
      { error: '推荐关键词失败' },
      { status: 500 }
    );
  }
}
