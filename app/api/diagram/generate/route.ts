import { NextRequest, NextResponse } from 'next/server';
import aiService from '@/lib/ai';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, diagramType, description, format = 'png', useArticleContent = false, language = 'zh' } = body;

    if (!projectId || !diagramType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 如果使用文章内容，从数据库读取
    let finalDescription = description || '';
    if (useArticleContent) {
      const stmt = db.prepare(`
        SELECT content FROM review_drafts
        WHERE project_id = ? AND language = ?
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const draft = stmt.get(projectId, language) as any;

      if (!draft) {
        return NextResponse.json(
          { error: '未找到文章内容，请先生成文章' },
          { status: 404 }
        );
      }

      // 使用文章内容作为上下文
      finalDescription = `基于以下文章内容生成机制图：\n\n${draft.content.substring(0, 8000)}`;
    }

    if (!finalDescription) {
      return NextResponse.json(
        { error: '缺少描述或文章内容' },
        { status: 400 }
      );
    }

    // 验证图表类型
    const validTypes = ['mechanism', 'flowchart', 'mindmap'];
    if (!validTypes.includes(diagramType)) {
      return NextResponse.json(
        { error: '无效的图表类型' },
        { status: 400 }
      );
    }

    // 验证图片格式
    const validFormats = ['png', 'svg', 'jpg'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: '无效的图片格式' },
        { status: 400 }
      );
    }

    // 调用AI生成图表代码
    const diagramCode = await aiService.generateDiagram(
      diagramType as 'mechanism' | 'flowchart' | 'mindmap',
      finalDescription
    );

    // 清理代码（移除可能的markdown代码块标记）
    let cleanCode = diagramCode.trim();
    cleanCode = cleanCode.replace(/^```mermaid\n?/i, '');
    cleanCode = cleanCode.replace(/^```\n?/i, '');
    cleanCode = cleanCode.replace(/\n?```$/i, '');
    cleanCode = cleanCode.trim();

    // 使用Mermaid Ink API生成图片
    // 将Mermaid代码编码为base64
    const encodedCode = Buffer.from(cleanCode).toString('base64');

    // 构建图片URL
    const imageUrl = `https://mermaid.ink/img/${encodedCode}?type=${format}`;

    return NextResponse.json({
      success: true,
      data: {
        code: cleanCode,
        type: diagramType,
        imageUrl: imageUrl,
        format: format,
      },
    });
  } catch (error) {
    console.error('生成图表失败:', error);
    return NextResponse.json(
      { error: '生成图表失败' },
      { status: 500 }
    );
  }
}
