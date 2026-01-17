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

    // 获取项目信息
    const projectStmt = db.prepare('SELECT name, description FROM projects WHERE id = ?');
    const project = projectStmt.get(projectId) as any;
    const topic = project ? `${project.name}${project.description ? ': ' + project.description : ''}` : '文献综述';

    // 获取项目关键词
    const keywordsStmt = db.prepare(`
      SELECT keyword, category, is_primary FROM project_keywords
      WHERE project_id = ?
      ORDER BY is_primary DESC, created_at ASC
    `);
    const keywords = keywordsStmt.all(projectId) as any[];

    // 构建关键词信息
    let keywordsInfo = '';
    if (keywords.length > 0) {
      const primaryKeywords = keywords.filter(k => k.is_primary === 1);
      const secondaryKeywords = keywords.filter(k => k.is_primary === 0);

      keywordsInfo = '\n\n项目关键词：\n';
      if (primaryKeywords.length > 0) {
        keywordsInfo += '核心关键词: ' + primaryKeywords.map(k => k.keyword).join(', ') + '\n';
      }
      if (secondaryKeywords.length > 0) {
        keywordsInfo += '相关关键词: ' + secondaryKeywords.map(k => k.keyword).join(', ');
      }
    }

    // 调用AI生成撰写计划
    const planContent = await aiService.generateReviewPlan(
      analysis.writing_guide + keywordsInfo,
      topic
    );

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
