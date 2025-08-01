import { ChartData } from '../types/dart.js';

export class ChartGeneratorService {
  /**
   * 텍스트 기반 차트를 생성합니다
   */
  generateTextChart(chartData: ChartData, title: string): string {
    const { labels, datasets } = chartData;
    const dataset = datasets[0];
    
    if (!dataset || !dataset.data || dataset.data.length === 0) {
      return `${title}\n데이터가 없습니다.`;
    }

    const maxValue = Math.max(...dataset.data);
    const chartWidth = 50;
    
    let chart = `\n📊 ${title}\n`;
    chart += '='.repeat(chartWidth + 10) + '\n\n';

    labels.forEach((label, index) => {
      const value = dataset.data[index];
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const barLength = Math.round((percentage / 100) * chartWidth);
      const bar = '█'.repeat(barLength);
      
      chart += `${label.padEnd(15)} │ ${bar} ${this.formatNumber(value)}\n`;
    });

    chart += '\n' + '='.repeat(chartWidth + 10) + '\n';
    return chart;
  }

  /**
   * HTML 차트를 생성합니다
   */
  generateHTMLChart(chartData: ChartData, title: string): string {
    const { labels, datasets } = chartData;
    const dataset = datasets[0];
    
    if (!dataset || !dataset.data || dataset.data.length === 0) {
      return `<h3>${title}</h3><p>데이터가 없습니다.</p>`;
    }

    const maxValue = Math.max(...dataset.data);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    let html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto;">
      <h2 style="color: #333; text-align: center;">${title}</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
    `;

    labels.forEach((label, index) => {
      const value = dataset.data[index];
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const color = colors[index % colors.length];
      
      html += `
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-weight: bold; color: #333;">${label}</span>
            <span style="color: #666;">${this.formatNumber(value)}</span>
          </div>
          <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
            <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
    });

    html += `
      </div>
    </div>
    `;

    return html;
  }

  /**
   * 여러 차트를 결합한 대시보드를 생성합니다
   */
  generateDashboardHTML(charts: Array<{ data: ChartData; title: string }>): string {
    let html = `
    <div style="font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto;">
      <h1 style="color: #333; text-align: center; margin-bottom: 30px;">📊 기업 재무제표 분석 대시보드</h1>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 20px;">
    `;

    charts.forEach(chart => {
      html += `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${this.generateHTMLChart(chart.data, chart.title)}
        </div>
      `;
    });

    html += `
      </div>
    </div>
    `;

    return html;
  }

  /**
   * 텍스트 기반 대시보드를 생성합니다
   */
  generateTextDashboard(charts: Array<{ data: ChartData; title: string }>): string {
    let dashboard = '\n📊 기업 재무제표 분석 대시보드\n';
    dashboard += '='.repeat(60) + '\n\n';

    charts.forEach(chart => {
      dashboard += this.generateTextChart(chart.data, chart.title) + '\n\n';
    });

    return dashboard;
  }

  /**
   * 숫자를 한국어 형식으로 포맷합니다
   */
  private formatNumber(value: number): string {
    if (value >= 1e12) {
      return `${(value / 1e12).toFixed(1)}조원`;
    } else if (value >= 1e8) {
      return `${(value / 1e8).toFixed(1)}억원`;
    } else if (value >= 1e4) {
      return `${(value / 1e4).toFixed(1)}만원`;
    } else {
      return `${value.toLocaleString()}원`;
    }
  }

  /**
   * 요약 정보를 텍스트로 생성합니다
   */
  generateSummaryText(summary: any): string {
    return `
📊 기업 재무제표 분석 요약

🏆 최고 성과 기업: ${summary.bestPerformer}
📉 최저 성과 기업: ${summary.worstPerformer}

💰 최고 매출 기업: ${summary.highestRevenue.company} 
   (${this.formatNumber(summary.highestRevenue.amount)})

📈 최고 순이익률 기업: ${summary.highestProfitMargin.company}
   (${summary.highestProfitMargin.margin.toFixed(2)}%)

이 분석은 DART API를 통해 제공된 공시 정보를 기반으로 작성되었습니다.
    `.trim();
  }

  /**
   * 비교 테이블을 생성합니다
   */
  generateComparisonTable(metrics: any[]): string {
    let table = '\n📋 기업별 재무 지표 비교표\n';
    table += '='.repeat(80) + '\n';
    table += '기업명'.padEnd(15) + '│ 매출액'.padEnd(15) + '│ 당기순이익'.padEnd(15) + '│ 총자산'.padEnd(15) + '│ 순이익률\n';
    table += '─'.repeat(80) + '\n';

    metrics.forEach(metric => {
      const profitMargin = metric.revenue > 0 ? (metric.netIncome / metric.revenue) * 100 : 0;
      table += `${metric.company.padEnd(15)} │ ${this.formatNumber(metric.revenue).padEnd(15)} │ ${this.formatNumber(metric.netIncome).padEnd(15)} │ ${this.formatNumber(metric.totalAssets).padEnd(15)} │ ${profitMargin.toFixed(2)}%\n`;
    });

    table += '='.repeat(80) + '\n';
    return table;
  }
} 