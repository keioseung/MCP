import { FinancialData, FinancialMetrics, FinancialAnalysis, ChartData } from '../types/dart.js';

export class FinancialAnalysisService {
  /**
   * 재무 데이터를 분석 가능한 형태로 변환합니다
   */
  processFinancialData(data: FinancialData[]): FinancialMetrics[] {
    const metrics: FinancialMetrics[] = [];
    const companyGroups = this.groupByCompany(data);

    for (const [company, companyData] of Object.entries(companyGroups)) {
      const year = companyData[0]?.bsns_year || '';
      
      const metricsData: FinancialMetrics = {
        company,
        year,
        revenue: this.extractAmount(companyData, '매출액'),
        netIncome: this.extractAmount(companyData, '당기순이익'),
        totalAssets: this.extractAmount(companyData, '자산총계'),
        totalLiabilities: this.extractAmount(companyData, '부채총계'),
        totalEquity: this.extractAmount(companyData, '자본총계'),
        operatingIncome: this.extractAmount(companyData, '영업이익'),
        ebitda: this.extractAmount(companyData, 'EBITDA') || this.calculateEBITDA(companyData)
      };

      metrics.push(metricsData);
    }

    return metrics;
  }

  /**
   * 회사별로 데이터를 그룹화합니다
   */
  private groupByCompany(data: FinancialData[]): Record<string, FinancialData[]> {
    return data.reduce((groups, item) => {
      const company = item.stock_code || 'Unknown';
      if (!groups[company]) {
        groups[company] = [];
      }
      groups[company].push(item);
      return groups;
    }, {} as Record<string, FinancialData[]>);
  }

  /**
   * 특정 계정과목의 금액을 추출합니다
   */
  private extractAmount(data: FinancialData[], accountName: string): number {
    const item = data.find(d => d.account_nm.includes(accountName));
    if (!item) return 0;
    
    const amount = item.thstrm_amount || item.thstrm_add_amount || '0';
    return this.parseAmount(amount);
  }

  /**
   * 금액 문자열을 숫자로 변환합니다
   */
  private parseAmount(amount: string): number {
    if (!amount) return 0;
    return parseInt(amount.replace(/,/g, ''), 10) || 0;
  }

  /**
   * EBITDA를 계산합니다
   */
  private calculateEBITDA(data: FinancialData[]): number {
    const operatingIncome = this.extractAmount(data, '영업이익');
    const depreciation = this.extractAmount(data, '감가상각비');
    const amortization = this.extractAmount(data, '무형자산상각비');
    
    return operatingIncome + depreciation + amortization;
  }

  /**
   * 차트 데이터를 생성합니다
   */
  createChartData(metrics: FinancialMetrics[]): FinancialAnalysis {
    const companies = metrics.map(m => m.company);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

    return {
      companies,
      metrics: {
        revenue: this.createChartDataset(metrics, 'revenue', '매출액', colors[0]),
        netIncome: this.createChartDataset(metrics, 'netIncome', '당기순이익', colors[1]),
        totalAssets: this.createChartDataset(metrics, 'totalAssets', '총자산', colors[2]),
        totalEquity: this.createChartDataset(metrics, 'totalEquity', '총자본', colors[3]),
        debtToEquity: this.createDebtToEquityChart(metrics, colors[4]),
        returnOnEquity: this.createROEChart(metrics, colors[0]),
        profitMargin: this.createProfitMarginChart(metrics, colors[1])
      },
      summary: this.createSummary(metrics)
    };
  }

  /**
   * 기본 차트 데이터셋을 생성합니다
   */
  private createChartDataset(
    metrics: FinancialMetrics[],
    key: keyof FinancialMetrics,
    label: string,
    color: string
  ): ChartData {
    return {
      labels: metrics.map(m => m.company),
      datasets: [{
        label,
        data: metrics.map(m => m[key] as number),
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      }]
    };
  }

  /**
   * 부채비율 차트를 생성합니다
   */
  private createDebtToEquityChart(metrics: FinancialMetrics[], color: string): ChartData {
    const debtToEquityRatios = metrics.map(m => {
      return m.totalEquity > 0 ? (m.totalLiabilities / m.totalEquity) * 100 : 0;
    });

    return {
      labels: metrics.map(m => m.company),
      datasets: [{
        label: '부채비율 (%)',
        data: debtToEquityRatios,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      }]
    };
  }

  /**
   * ROE 차트를 생성합니다
   */
  private createROEChart(metrics: FinancialMetrics[], color: string): ChartData {
    const roeRatios = metrics.map(m => {
      return m.totalEquity > 0 ? (m.netIncome / m.totalEquity) * 100 : 0;
    });

    return {
      labels: metrics.map(m => m.company),
      datasets: [{
        label: 'ROE (%)',
        data: roeRatios,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      }]
    };
  }

  /**
   * 순이익률 차트를 생성합니다
   */
  private createProfitMarginChart(metrics: FinancialMetrics[], color: string): ChartData {
    const profitMargins = metrics.map(m => {
      return m.revenue > 0 ? (m.netIncome / m.revenue) * 100 : 0;
    });

    return {
      labels: metrics.map(m => m.company),
      datasets: [{
        label: '순이익률 (%)',
        data: profitMargins,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      }]
    };
  }

  /**
   * 요약 정보를 생성합니다
   */
  private createSummary(metrics: FinancialMetrics[]) {
    const bestPerformer = metrics.reduce((best, current) => 
      current.netIncome > best.netIncome ? current : best
    ).company;

    const worstPerformer = metrics.reduce((worst, current) => 
      current.netIncome < worst.netIncome ? current : worst
    ).company;

    const highestRevenue = metrics.reduce((highest, current) => 
      current.revenue > highest.revenue ? current : highest
    );

    const highestProfitMargin = metrics.reduce((highest, current) => {
      const currentMargin = current.revenue > 0 ? (current.netIncome / current.revenue) * 100 : 0;
      const highestMargin = highest.revenue > 0 ? (highest.netIncome / highest.revenue) * 100 : 0;
      return currentMargin > highestMargin ? current : highest;
    });

    return {
      bestPerformer,
      worstPerformer,
      highestRevenue: {
        company: highestRevenue.company,
        amount: highestRevenue.revenue
      },
      highestProfitMargin: {
        company: highestProfitMargin.company,
        margin: highestProfitMargin.revenue > 0 ? 
          (highestProfitMargin.netIncome / highestProfitMargin.revenue) * 100 : 0
      }
    };
  }
} 