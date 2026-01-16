import { NextRequest, NextResponse } from 'next/server';
import { searchArxiv } from '@/lib/arxiv';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, maxResults = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: '缺少搜索关键词' },
        { status: 400 }
      );
    }

    const results = await searchArxiv(query, maxResults);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('arXiv搜索错误:', error);
    return NextResponse.json(
      { error: 'arXiv搜索失败' },
      { status: 500 }
    );
  }
}
