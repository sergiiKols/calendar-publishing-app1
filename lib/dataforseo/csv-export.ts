/**
 * CSV Export - Экспорт данных в CSV формат
 */

export interface CSVRow {
  [key: string]: string | number | boolean;
}

/**
 * Экспортировать данные в CSV файл
 */
export function exportToCSV(
  data: CSVRow[],
  filename: string = 'export.csv',
  columns?: string[]
) {
  if (!data || data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  // Определить колонки, если не указаны
  const columnNames = columns || Object.keys(data[0]);

  // Создать строки CSV
  const csvRows: string[] = [];

  // Заголовки
  csvRows.push(columnNames.join(','));

  // Данные
  for (const row of data) {
    const values = columnNames.map((column) => {
      const value = row[column];
      // Экранировать значения с запятыми и кавычками
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  // Создать CSV файл
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Создать ссылку для скачивания
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Экспортировать ключевые слова в CSV
 */
export function exportKeywordsToCSV(
  keywords: Array<{
    id: number;
    keyword: string;
    search_volume: number;
    cpc: number;
    competition: number;
    intent?: string;
    cluster_name?: string;
  }>,
  filename: string = 'keywords.csv'
) {
  const data = keywords.map((k) => ({
    id: k.id,
    keyword: k.keyword,
    search_volume: k.search_volume,
    cpc: k.cpc.toFixed(2),
    competition: (k.competition * 100).toFixed(0) + '%',
    intent: k.intent || '',
    cluster_name: k.cluster_name || '',
  }));

  exportToCSV(data, filename);
}

/**
 * Экспортировать кластеры в CSV
 */
export function exportClustersToCSV(
  clusters: Array<{
    id: number;
    name: string;
    keywords_count: number;
    total_search_volume: number;
    keywords: Array<{
      keyword: string;
      search_volume: number;
      cpc: number;
      competition: number;
      intent?: string;
    }>;
  }>,
  filename: string = 'clusters.csv'
) {
  const rows: CSVRow[] = [];

  for (const cluster of clusters) {
    rows.push({
      cluster_id: cluster.id,
      cluster_name: cluster.name,
      keywords_count: cluster.keywords_count,
      total_search_volume: cluster.total_search_volume,
      keywords: cluster.keywords.map(k => k.keyword).join('; '),
    });
  }

  exportToCSV(rows, filename);
}

/**
 * Экспортировать результаты SERP в CSV
 */
export function exportSERPToCSV(
  data: Array<{
    keyword: string;
    position: number;
    title: string;
    url: string;
    domain: string;
    description?: string;
  }>,
  filename: string = 'serp_results.csv'
) {
  const rows = data.map((item) => ({
    keyword: item.keyword,
    position: item.position,
    title: item.title,
    url: item.url,
    domain: item.domain,
    description: item.description?.replace(/\n/g, ' ') || '',
  }));

  exportToCSV(rows, filename);
}

/**
 * Экспортировать фильтрованные данные в CSV
 */
export function exportFilteredDataToCSV(
  data: CSVRow[],
  filters: {
    minSearchVolume?: number;
    maxCompetition?: number;
    minCPC?: number;
    onlyCommercial?: boolean;
  },
  filename: string = 'filtered_data.csv'
) {
  // Добавить информацию о фильтрах в первую строку
  const filterInfo: CSVRow = {};
  if (filters.minSearchVolume) filterInfo['Min Search Volume'] = filters.minSearchVolume;
  if (filters.maxCompetition) filterInfo['Max Competition'] = filters.maxCompetition;
  if (filters.minCPC) filterInfo['Min CPC'] = `$${filters.minCPC.toFixed(2)}`;
  if (filters.onlyCommercial) filterInfo['Only Commercial'] = 'Yes';

  const rows: CSVRow[] = [];
  if (Object.keys(filterInfo).length > 0) {
    rows.push(filterInfo);
    rows.push({}); // Пустая строка
  }

  rows.push(...data);

  exportToCSV(rows, filename);
}