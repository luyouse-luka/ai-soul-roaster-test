export enum AppStage {
  INTRO = 'INTRO',
  CAMERA = 'CAMERA',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  roast: string;
  dangerLevel: number; // 0-100
  title: string;
  score: number; // 人类评分
  luckyItem: string; // 幸运物品
  animalMatch: string; // 匹配生物
}