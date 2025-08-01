import express from 'express';
import cors from 'cors';
import { DartApiService } from './services/dartApi.js';
import { FinancialAnalysisService } from './services/financialAnalysis.js';
import { ChartGeneratorService } from './services/chartGenerator.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 서비스 초기화
const apiKey = process.env.DART_API_KEY || 'e7153f9582f89deb2169769816dcc61c826bd5cf';
const dartService = new DartApiService(apiKey);
const analysisService = new FinancialAnalysisService();
const chartService = new ChartGeneratorService();

// 루트 경로 - API 정보 페이지
app.get('/', (req, res) => {
  res.json({
    message: 'DART Financial Analysis API Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      companies: 'GET /api/companies',
      analyze: 'POST /api/analyze',
      chart: 'POST /api/chart',
      dashboard: 'POST /api/dashboard',
      dashboardHtml: 'POST /api/dashboard/html'
    },
    usage: {
      health: '서버 상태 확인',
      companies: '분석 가능한 회사 목록 조회',
      analyze: '재무 데이터 분석 (POST body: {corp_codes, year, report_code})',
      chart: '특정 지표 차트 생성 (POST body: {corp_codes, year, report_code, metric})',
      dashboard: '텍스트 대시보드 생성',
      dashboardHtml: 'HTML 대시보드 생성'
    }
  });
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'DART Financial Analysis Server is running' });
});

// 회사 목록 조회
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await dartService.getCompanyList();
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 재무 데이터 분석
app.post('/api/analyze', async (req, res) => {
  try {
    const { corp_codes, year, report_code } = req.body;

    if (!corp_codes || !year || !report_code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: corp_codes, year, report_code'
      });
    }

    // DART API에서 재무 데이터 가져오기
    const financialData = await dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다.'
      });
    }

    // 재무 데이터 분석
    const metrics = analysisService.processFinancialData(financialData);
    const analysis = analysisService.createChartData(metrics);

    // 요약 텍스트 생성
    const summaryText = chartService.generateSummaryText(analysis.summary);

    res.json({
      success: true,
      data: {
        summary: analysis.summary,
        metrics: metrics,
        analysis: analysis,
        summaryText: summaryText
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 차트 생성
app.post('/api/chart', async (req, res) => {
  try {
    const { corp_codes, year, report_code, metric } = req.body;

    if (!corp_codes || !year || !report_code || !metric) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: corp_codes, year, report_code, metric'
      });
    }

    // DART API에서 재무 데이터 가져오기
    const financialData = await dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다.'
      });
    }

    // 재무 데이터 분석
    const metrics = analysisService.processFinancialData(financialData);
    const analysis = analysisService.createChartData(metrics);

    // 요청된 지표의 차트 데이터 가져오기
    const chartData = analysis.metrics[metric as keyof typeof analysis.metrics];
    if (!chartData) {
      return res.status(400).json({
        success: false,
        error: `지원하지 않는 지표입니다: ${metric}`
      });
    }

    // 텍스트 차트 생성
    const chartText = chartService.generateTextChart(
      chartData,
      `${metric} 비교 (${year}년)`
    );

    res.json({
      success: true,
      data: {
        chartText: chartText,
        chartData: chartData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 대시보드 생성
app.post('/api/dashboard', async (req, res) => {
  try {
    const { corp_codes, year, report_code } = req.body;

    if (!corp_codes || !year || !report_code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: corp_codes, year, report_code'
      });
    }

    // DART API에서 재무 데이터 가져오기
    const financialData = await dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다.'
      });
    }

    // 재무 데이터 분석
    const metrics = analysisService.processFinancialData(financialData);
    const analysis = analysisService.createChartData(metrics);

    // 텍스트 대시보드 생성
    const charts = [
      { data: analysis.metrics.revenue, title: '매출액 비교' },
      { data: analysis.metrics.netIncome, title: '당기순이익 비교' },
      { data: analysis.metrics.totalAssets, title: '총자산 비교' },
      { data: analysis.metrics.profitMargin, title: '순이익률 비교' },
    ];

    const dashboardText = chartService.generateTextDashboard(charts);
    const summaryText = chartService.generateSummaryText(analysis.summary);

    res.json({
      success: true,
      data: {
        dashboardText: dashboardText,
        summaryText: summaryText,
        analysis: analysis
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// HTML 대시보드 생성
app.post('/api/dashboard/html', async (req, res) => {
  try {
    const { corp_codes, year, report_code } = req.body;

    if (!corp_codes || !year || !report_code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: corp_codes, year, report_code'
      });
    }

    // DART API에서 재무 데이터 가져오기
    const financialData = await dartService.getFinancialData(
      corp_codes,
      year,
      report_code
    );

    if (financialData.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 조건에 맞는 재무 데이터를 찾을 수 없습니다.'
      });
    }

    // 재무 데이터 분석
    const metrics = analysisService.processFinancialData(financialData);
    const analysis = analysisService.createChartData(metrics);

    // HTML 대시보드 생성
    const charts = [
      { data: analysis.metrics.revenue, title: '매출액 비교' },
      { data: analysis.metrics.netIncome, title: '당기순이익 비교' },
      { data: analysis.metrics.totalAssets, title: '총자산 비교' },
      { data: analysis.metrics.profitMargin, title: '순이익률 비교' },
    ];

    const dashboardHTML = chartService.generateDashboardHTML(charts);

    res.json({
      success: true,
      data: {
        html: dashboardHTML
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 DART Financial Analysis Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API Documentation:`);
  console.log(`   GET  /api/companies - 회사 목록 조회`);
  console.log(`   POST /api/analyze - 재무 데이터 분석`);
  console.log(`   POST /api/chart - 차트 생성`);
  console.log(`   POST /api/dashboard - 대시보드 생성`);
  console.log(`   POST /api/dashboard/html - HTML 대시보드 생성`);
}); 