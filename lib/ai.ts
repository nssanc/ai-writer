import OpenAI from 'openai';
import db from './db';

export class AIService {
  private client: OpenAI | null = null;
  private currentModel: string = 'gpt-4';

  /**
   * 获取或创建 OpenAI 客户端
   */
  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    let config: any = null;

    // 尝试从数据库获取配置（构建时可能失败，使用 try-catch）
    try {
      const stmt = db.prepare('SELECT * FROM ai_config ORDER BY id DESC LIMIT 1');
      config = stmt.get();
    } catch (error) {
      // 构建时数据库可能不存在，忽略错误
      console.log('Database not available, using environment variables');
    }

    if (config) {
      this.client = new OpenAI({
        apiKey: config.api_key,
        baseURL: config.api_endpoint,
      });
      this.currentModel = config.model_name || 'gpt-4';
    } else {
      // 使用环境变量作为后备
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
      });
      this.currentModel = process.env.OPENAI_MODEL || 'gpt-4';
    }

    return this.client;
  }

  /**
   * 重置客户端（配置更新后调用）
   */
  resetClient() {
    this.client = null;
  }

  /**
   * 获取可用模型列表
   */
  async listModels(apiEndpoint: string, apiKey: string): Promise<string[]> {
    try {
      const tempClient = new OpenAI({
        apiKey: apiKey,
        baseURL: apiEndpoint,
      });

      const response = await tempClient.models.list();
      return response.data.map((model: any) => model.id).sort();
    } catch (error) {
      console.error('获取模型列表失败:', error);
      throw new Error('无法获取模型列表，请检查 API 配置');
    }
  }

  /**
   * 分析文献写作风格
   */
  async analyzeStyle(text: string): Promise<string> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: this.currentModel,
      messages: [
        {
          role: 'system',
          content: '你是一个学术写作风格分析专家。请分析给定文献的写作特征，包括文章结构、语言风格、引用格式、论证逻辑等方面。'
        },
        {
          role: 'user',
          content: `请分析以下学术文献的写作风格：\n\n${text.substring(0, 8000)}`
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * 生成写作指南
   */
  async generateWritingGuide(styleAnalysis: string): Promise<string> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: this.currentModel,
      messages: [
        {
          role: 'system',
          content: '你是一个学术写作指导专家。基于风格分析结果，生成详细的写作指南（Markdown格式）。'
        },
        {
          role: 'user',
          content: `基于以下风格分析，生成一份详细的写作指南：\n\n${styleAnalysis}`
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * 生成综述撰写计划
   */
  async generateReviewPlan(writingGuide: string, topic: string): Promise<string> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: this.currentModel,
      messages: [
        {
          role: 'system',
          content: '你是一个学术综述规划专家。生成详细的综述撰写计划（Markdown格式），包括章节大纲、关键词、预期字数等。'
        },
        {
          role: 'user',
          content: `主题：${topic}\n\n写作指南：\n${writingGuide}\n\n请生成详细的综述撰写计划。`
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * 流式生成综述内容
   */
  async *streamWriteReview(
    plan: string,
    guide: string,
    references: string,
    language: 'zh' | 'en'
  ): AsyncGenerator<string> {
    const client = this.getClient();
    const languagePrompt = language === 'zh' ? '中文' : '英文';

    const stream = await client.chat.completions.create({
      model: this.currentModel,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的学术综述撰写专家。请严格按照提供的写作指南和撰写计划，用${languagePrompt}撰写高质量的文献综述。`
        },
        {
          role: 'user',
          content: `写作指南：\n${guide}\n\n撰写计划：\n${plan}\n\n参考文献：\n${references}\n\n请开始撰写综述。`
        }
      ],
      stream: true,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }
}

export default new AIService();
