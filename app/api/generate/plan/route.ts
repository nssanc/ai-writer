import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import aiService from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: '缺少项目ID' },
        { status: 400 }
      );
    }

    // 获取风格分析结果
    const analysisStmt = db.prepare(`
      SELECT writing_guide FROM style_analysis
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const analysis = analysisStmt.get(projectId) as any;

    if (!analysis) {
      return NextResponse.json(
        { error: '请先完成风格分析' },
        { status: 400 }
      );
    }

    // 调用AI生成撰写计划
    const planContent = await aiService.generateReviewPlan(analysis.writing_guide);

    // 保存到数据库
    const saveStmt = db.prepare(`
      INSERT INTO review_plans (project_id, plan_content, version)
      VALUES (?, ?, 1)
    `);
    const result = saveStmt.run(projectId, planContent);

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        plan_content: planContent,
        version: 1,
      },
    });
  } catch (error) {
    console.error('生成撰写计划失败:', error);
    return NextResponse.json(
      { error: '生成撰写计划失败' },
      { status: 500 }
    );
  }
}
