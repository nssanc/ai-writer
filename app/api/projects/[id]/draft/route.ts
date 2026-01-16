import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'zh';

    const stmt = db.prepare(`
      SELECT id, content, language, version, created_at
      FROM review_drafts
      WHERE project_id = ? AND language = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const draft = stmt.get(projectId, language);

    return NextResponse.json({
      success: true,
      data: draft || null,
    });
  } catch (error) {
    console.error('获取草稿失败:', error);
    return NextResponse.json(
      { success: false, error: '获取草稿失败' },
      { status: 500 }
    );
  }
}
