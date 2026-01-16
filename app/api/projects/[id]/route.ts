import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = stmt.get(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取项目详情失败' },
      { status: 500 }
    );
  }
}
