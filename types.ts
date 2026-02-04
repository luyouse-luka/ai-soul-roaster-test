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
}