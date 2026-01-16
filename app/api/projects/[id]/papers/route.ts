import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const stmt = db.prepare(`
      SELECT id, filename, file_type, created_at
      FROM reference_papers
      WHERE project_id = ?
      ORDER BY created_at DESC
    `);
    const papers = stmt.all(projectId);

    return NextResponse.json({
      success: true,
      data: papers,
    });
  } catch (error) {
    console.error('获取参考文献失败:', error);
    return NextResponse.json(
      { success: false, error: '获取参考文献失败' },
      { status: 500 }
    );
  }
}
