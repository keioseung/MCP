import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DartApiService } from './services/dartApi.js';
import { FinancialAnalysisService } from './services/financialAnalysis.js';
import { ChartGeneratorService } from './services/chartGenerator.js';

class DartFinancialMCPServer {
  private server: Server;
  private dartService: DartApiService;
  private analysisService: FinancialAnalysisService;
  private chartService: ChartGeneratorService;

  constructor() {
    this.server = new Server(
      {
        name: 'dart-financial-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // DART API 키 설정
    const apiKey = 'e7153f9582f89deb2169769816dcc61c826bd5cf';
    this.dartService = new DartApiService(apiKey);
    this.analysisService = new FinancialAnalysisService();
    this.chartService = new ChartGeneratorService();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 회사 목록 조회
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_company_list',
            description: '분석 가능한 회사 목록을 가져옵니다',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'analyze_financial_data',
            description: '다중 기업의 재무제표 데이터를 분석하고 시각화합니다',
            inputSchema: {
              type: 'object',
              properties: {
                corp_codes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '분석할 회사들의 고유번호 목록',
                },
                year: {
                  type: 'string',
                  description: '분석할 사업연도 (예: 2023)',
                },
                report_code: {
                  type: 'string',
                  description: '보고서 코드 (11011: 사업보고서, 11012: 반기보고서, 11013: 1분기보고서, 11014: 3분기보고서)',
                },
              },
              required: ['corp_codes', 'year', 'report_code'],
            },
          },
          {
            name: 'generate_financial_chart',
            description: '특정 재무 지표에 대한 텍스트 차트를 생성합니다',
            inputSchema: {
              type: 'object',
              properties: {
                corp_codes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '분석할 회사들의 고유번호 목록',
                },
                year: {
                  type: 'string',
                  description: '분석할 사업연도',
                },
                report_code: {
                  type: 'string',
                  description: '보고서 코드',
                },
                metric: {
                  type: 'string',
                  description: '차트로 표시할 지표 (revenue, netIncome, totalAssets, totalEquity, debtToEquity, returnOnEquity, profitMargin)',
                },
              },
              required: ['corp_codes', 'year', 'report_code', 'metric'],
            },
          },
          {
            name: 'generate_financial_dashboard',
            description: '종합적인 재무 분석 대시보드를 생성합니다',
            inputSchema: {
              type: 'object',
              properties: {
                corp_codes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '분석할 회사들의 고유번호 목록',
                },
                year: {
                  type: 'string',
                  description: '분석할 사업연도',
                },
                report_code: {
                  type: 'string',
                  description: '보고서 코드',
                },
              },
              required: ['corp_codes', 'year', 'report_code'],
            },
          },
          {
            name: 'generate_html_dashboard',
            description: 'HTML 형식의 재무 분석 대시보드를 생성합니다',
            inputSchema: {
              type: 'object',
              properties: {
                corp_codes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '분석할 회사들의 고유번호 목록',
                },
                year: {
                  type: 'string',
                  description: '분석할 사업연도',
                },
                report_code: {
                  type: 'string',
                  description: '보고서 코드',
                },
              },
              required: ['corp_codes', 'year', 'report_code'],
            },
          },
          {
            name: 'generate_comparison_table',
            description: '기업별 재무 지표 비교표를 생성합니다',
            inputSchema: {
              type: 'object',
              properties: {
                corp_codes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '분석할 회사들의 고유번호 목록',
                },
                year: {
                  type: 'string',
                  description: '분석할 사업연도',
                },
                report_code: {
                  type: 'string',
                  description: '보고서 코드',
                },
              },
              required: ['corp_codes', 'year', 'report_code'],
            },
          },
        ],
      };
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_company_list':
            return await this.handleGetCompanyList();

          case 'analyze_financial_data':
            return await this.handleAnalyzeFinancialData(args);

          case 'generate_financial_chart':
            return await this.handleGenerateFinancialChart(args);

          case 'generate_financial_dashboard':
            return await this.handleGenerateFinancialDashboard(args);

          case 'generate_html_dashboard':
            return await this.handleGenerateHTMLDashboard(args);

          case 'generate_comparison_table':
            return await this.handleGenerateComparisonTable(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            },
          ],
        };
      }
    });
  }

  private async handleGetCompanyList() {
    const companies = await this.dartService.getCompanyList();
    
    const companyList = companies.map(company => 
      `${company.corp_name} (${company.stock_code || 'N/A'}) - ${company.corp_code}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `📋 분석 가능한 회사 목록:\n\n${companyList}\n\n위 회사들의 고유번호(corp_code)를 사용하여 재무 분석을 수행할 수 있습니다.`,
        },
      ],
    };
  }

  private async handleAnalyzeFinancialData(args: any) {
    const { corp_codes, year, report_code } = args;

    // DART API에서 재무 데이터 가져오기
    const financialData = await this.dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다. 회사 코드, 연도, 보고서 코드를 확인해주세요.',
          },
        ],
      };
    }

    // 재무 데이터 분석
    const metrics = this.analysisService.processFinancialData(financialData);
    const analysis = this.analysisService.createChartData(metrics);

    // 요약 텍스트 생성
    const summaryText = this.chartService.generateSummaryText(analysis.summary);

    // 상세 분석 결과
    const detailedAnalysis = metrics.map(metric => `
🏢 ${metric.company} (${metric.year}년)
   📊 매출액: ${this.chartService['formatNumber'](metric.revenue)}
   💰 당기순이익: ${this.chartService['formatNumber'](metric.netIncome)}
   🏦 총자산: ${this.chartService['formatNumber'](metric.totalAssets)}
   📈 총자본: ${this.chartService['formatNumber'](metric.totalEquity)}
   📊 영업이익: ${this.chartService['formatNumber'](metric.operatingIncome)}
    `).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `${summaryText}\n\n📊 상세 분석 결과:\n${detailedAnalysis}`,
        },
      ],
    };
  }

  private async handleGenerateFinancialChart(args: any) {
    const { corp_codes, year, report_code, metric } = args;

    // DART API에서 재무 데이터 가져오기
    const financialData = await this.dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다.',
          },
        ],
      };
    }

    // 재무 데이터 분석
    const metrics = this.analysisService.processFinancialData(financialData);
    const analysis = this.analysisService.createChartData(metrics);

    // 요청된 지표의 차트 데이터 가져오기
    const chartData = analysis.metrics[metric as keyof typeof analysis.metrics];
    if (!chartData) {
      return {
        content: [
          {
            type: 'text',
            text: `지원하지 않는 지표입니다: ${metric}. 지원되는 지표: revenue, netIncome, totalAssets, totalEquity, debtToEquity, returnOnEquity, profitMargin`,
          },
        ],
      };
    }

    // 텍스트 차트 생성
    const chartText = this.chartService.generateTextChart(
      chartData,
      `${metric} 비교 (${year}년)`
    );

    return {
      content: [
        {
          type: 'text',
          text: chartText,
        },
      ],
    };
  }

  private async handleGenerateFinancialDashboard(args: any) {
    const { corp_codes, year, report_code } = args;

    // DART API에서 재무 데이터 가져오기
    const financialData = await this.dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다.',
          },
        ],
      };
    }

    // 재무 데이터 분석
    const metrics = this.analysisService.processFinancialData(financialData);
    const analysis = this.analysisService.createChartData(metrics);

    // 텍스트 대시보드 생성
    const charts = [
      { data: analysis.metrics.revenue, title: '매출액 비교' },
      { data: analysis.metrics.netIncome, title: '당기순이익 비교' },
      { data: analysis.metrics.totalAssets, title: '총자산 비교' },
      { data: analysis.metrics.profitMargin, title: '순이익률 비교' },
    ];

    const dashboardText = this.chartService.generateTextDashboard(charts);

    // 요약 텍스트 생성
    const summaryText = this.chartService.generateSummaryText(analysis.summary);

    return {
      content: [
        {
          type: 'text',
          text: `${summaryText}\n\n${dashboardText}`,
        },
      ],
    };
  }

  private async handleGenerateHTMLDashboard(args: any) {
    const { corp_codes, year, report_code } = args;

    // DART API에서 재무 데이터 가져오기
    const financialData = await this.dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다.',
          },
        ],
      };
    }

    // 재무 데이터 분석
    const metrics = this.analysisService.processFinancialData(financialData);
    const analysis = this.analysisService.createChartData(metrics);

    // HTML 대시보드 생성
    const charts = [
      { data: analysis.metrics.revenue, title: '매출액 비교' },
      { data: analysis.metrics.netIncome, title: '당기순이익 비교' },
      { data: analysis.metrics.totalAssets, title: '총자산 비교' },
      { data: analysis.metrics.profitMargin, title: '순이익률 비교' },
    ];

    const dashboardHTML = this.chartService.generateDashboardHTML(charts);

    return {
      content: [
        {
          type: 'text',
          text: 'HTML 형식의 재무 분석 대시보드가 생성되었습니다. 아래 HTML을 웹 브라우저에서 열어보세요.',
        },
        {
          type: 'text',
          text: dashboardHTML,
        },
      ],
    };
  }

  private async handleGenerateComparisonTable(args: any) {
    const { corp_codes, year, report_code } = args;

    // DART API에서 재무 데이터 가져오기
    const financialData = await this.dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다.',
          },
        ],
      };
    }

    // 재무 데이터 분석
    const metrics = this.analysisService.processFinancialData(financialData);

    // 비교 테이블 생성
    const comparisonTable = this.chartService.generateComparisonTable(metrics);

    // 요약 텍스트 생성
    const analysis = this.analysisService.createChartData(metrics);
    const summaryText = this.chartService.generateSummaryText(analysis.summary);

    return {
      content: [
        {
          type: 'text',
          text: `${summaryText}\n\n${comparisonTable}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DART Financial MCP Server started');
  }
}

// 서버 실행
const server = new DartFinancialMCPServer();
server.run().catch(console.error); 