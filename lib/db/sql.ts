/**
 * SQL helper для совместимости с @vercel/postgres
 * Использует обычный pg Pool вместо Vercel клиента
 */

import { query } from './client';

/**
 * Template literal функция для SQL запросов
 * Совместима с синтаксисом @vercel/postgres
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<any> {
  // Конвертируем template literal в параметризованный запрос
  let text = '';
  const params: any[] = [];
  
  strings.forEach((string, i) => {
    text += string;
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  });

  const result = await query(text, params);
  return {
    rows: result.rows,
    rowCount: result.rowCount,
    command: result.command,
    fields: result.fields,
  };
}

// Добавляем метод query для совместимости
sql.query = async (text: string, params?: any[]) => {
  return query(text, params);
};
