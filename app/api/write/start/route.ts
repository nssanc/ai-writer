import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import aiService from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, language } = body;

    if (!projectId || !language) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取撰写计划
    const planStmt = db.prepare(`
      SELECT plan_content FROM review_plans
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const plan = planStmt.get(projectId) as any;

    if (!plan) {
      return NextResponse.json(
        { error: '请先生成撰写计划' },
        { status: 400 }
      );
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';

          // 调用AI流式写作
          for await (const chunk of aiService.streamWriteReview(
            plan.plan_content,
            language
          )) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // 保存到数据库
          const saveStmt = db.prepare(`
            INSERT INTO review_drafts (project_id, content, language, version)
            VALUES (?, ?, ?, 1)
          `);
          saveStmt.run(projectId, fullContent, language);

          controller.close();
        } catch (error) {
          console.error('AI写作错误:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('启动AI写作失败:', error);
    return NextResponse.json(
      { error: '启动AI写作失败' },
      { status: 500 }
    );
  }
}
