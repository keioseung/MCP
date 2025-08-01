import axios from 'axios';
import { DartApiResponse, FinancialData, CompanyInfo } from '../types/dart.js';

export class DartApiService {
  private apiKey: string;
  private baseUrl = 'https://opendart.fss.or.kr/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 다중 회사의 재무제표 정보를 가져옵니다
   */
  async getFinancialData(
    corpCodes: string[],
    year: string,
    reportCode: string
  ): Promise<FinancialData[]> {
    try {
      const corpCodeParam = corpCodes.join(',');
      const url = `${this.baseUrl}/fnlttMultiAcnt.json`;
      
      const response = await axios.get<DartApiResponse>(url, {
        params: {
          crtfc_key: this.apiKey,
          corp_code: corpCodeParam,
          bsns_year: year,
          reprt_code: reportCode
        }
      });

      if (response.data.status !== '000') {
        throw new Error(`DART API Error: ${response.data.message}`);
      }

      return response.data.list || [];
    } catch (error) {
      console.error('DART API 호출 중 오류:', error);
      throw error;
    }
  }

  /**
   * 회사 목록을 가져옵니다 (예시 데이터)
   */
  async getCompanyList(): Promise<CompanyInfo[]> {
    // 실제로는 DART API에서 회사 목록을 가져와야 하지만,
    // 여기서는 주요 기업들의 예시 데이터를 반환합니다
    return [
      { corp_code: '00334624', corp_name: '삼성전자', stock_code: '005930' },
      { corp_code: '00126380', corp_name: 'SK하이닉스', stock_code: '000660' },
      { corp_code: '00164779', corp_name: '현대자동차', stock_code: '005380' },
      { corp_code: '00164779', corp_name: 'LG에너지솔루션', stock_code: '373220' },
      { corp_code: '00164779', corp_name: 'NAVER', stock_code: '035420' }
    ];
  }

  /**
   * 보고서 코드 상수
   */
  static get REPORT_CODES() {
    return {
      QUARTER1: '11013',    // 1분기보고서
      SEMI_ANNUAL: '11012', // 반기보고서
      QUARTER3: '11014',    // 3분기보고서
      ANNUAL: '11011'       // 사업보고서
    };
  }
} 