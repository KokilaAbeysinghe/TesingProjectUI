export type DatePresetKey =
  | 'today'
  | 'yesterday'
  | 'last7Days'
  | 'last30Days'
  | 'thisMonth'
  | 'lastMonth';

export interface DatePreset {
  key: DatePresetKey;
  label: string;
}
