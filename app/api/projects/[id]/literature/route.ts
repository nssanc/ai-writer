import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { papers } = body;

    if (!papers || !Array.isArray(papers)) {
      return NextResponse.json(
        { error: '缺少文献数据' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO searched_literature
      (project_id, source, title, authors, abstract, url, pdf_url, metadata, is_selected)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const paper of papers) {
      stmt.run(
        projectId,
        'search',
        paper.title,
        paper.authors,
        paper.abstract,
        paper.url,
        paper.pdf_url || null,
        JSON.stringify({ published: paper.published })
      );
    }

    return NextResponse.json({
      success: true,
      message: `成功保存 ${papers.length} 篇文献`,
    });
  } catch (error) {
    console.error('保存文献失败:', error);
    return NextResponse.json(
      { error: '保存文献失败' },
      { status: 500 }
    );
  }
}
