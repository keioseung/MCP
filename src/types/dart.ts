export interface DartApiResponse {
  status: string;
  message: string;
  list: FinancialData[];
}

export interface FinancialData {
  rcept_no: string;
  bsns_year: string;
  stock_code: string;
  reprt_code: string;
  account_nm: string;
  fs_div: string;
  fs_nm: string;
  sj_div: string;
  sj_nm: string;
  thstrm_nm: string;
  thstrm_dt: string;
  thstrm_amount: string;
  thstrm_add_amount: string;
  frmtrm_nm: string;
  frmtrm_dt: string;
  frmtrm_amount: string;
  frmtrm_add_amount: string;
  bfefrmtrm_nm?: string;
  bfefrmtrm_dt?: string;
  bfefrmtrm_amount?: string;
  ord: string;
  currency: string;
}

export interface CompanyInfo {
  corp_code: string;
  corp_name: string;
  stock_code?: string;
}

export interface FinancialMetrics {
  company: string;
  year: string;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  operatingIncome: number;
  ebitda: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface FinancialAnalysis {
  companies: string[];
  metrics: {
    revenue: ChartData;
    netIncome: ChartData;
    totalAssets: ChartData;
    totalEquity: ChartData;
    debtToEquity: ChartData;
    returnOnEquity: ChartData;
    profitMargin: ChartData;
  };
  summary: {
    bestPerformer: string;
    worstPerformer: string;
    highestRevenue: { company: string; amount: number };
    highestProfitMargin: { company: string; margin: number };
  };
} 