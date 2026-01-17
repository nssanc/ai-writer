import { NextRequest, NextResponse } from 'next/server';
import { searchPubmed } from '@/lib/pubmed';

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

    const results = await searchPubmed(query, maxResults);

    // 转换数据格式，将 authors 数组转为字符串
    const formattedResults = results.map(paper => ({
      title: paper.title,
      authors: paper.authors.join(', '),
      abstract: paper.abstract,
      url: paper.url,
      published: paper.pubDate,
    }));

    return NextResponse.json({
      success: true,
      data: formattedResults,
    });
  } catch (error) {
    console.error('PubMed搜索错误:', error);
    return NextResponse.json(
      { error: 'PubMed搜索失败' },
      { status: 500 }
    );
  }
}
