/**
 * EXPORT TO SPREADSHEET
 * 
 * Funções para exportar dados de corridas para planilhas (CSV/Excel)
 */

import type { Ride, DailySummary } from './types';

/**
 * Converter array de corridas para CSV
 */
export function ridesToCSV(rides: Ride[]): string {
  // Cabeçalho
  const headers = [
    'Data',
    'Plataforma',
    'Valor (R$)',
    'Distância (km)',
    'Duração (min)',
    'Categoria',
    'Bônus (R$)',
    'Multiplicador',
    'Total (R$)'
  ];

  // Linhas de dados
  const rows = rides.map(ride => [
    new Date(ride.date).toLocaleString('pt-BR'),
    ride.platform.toUpperCase(),
    ride.value.toFixed(2),
    ride.distance?.toFixed(1) || '0',
    ride.duration || '0',
    ride.category || '-',
    ride.bonus?.toFixed(2) || '0.00',
    ride.multiplier || '1',
    ride.totalEarnings.toFixed(2)
  ]);

  // Combinar cabeçalho e linhas
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Baixar CSV
 */
export function downloadCSV(csvContent: string, filename: string = 'corridas.csv') {
  // Adicionar BOM para UTF-8 (suporte a caracteres especiais no Excel)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Exportar corridas para CSV
 */
export function exportRidesToCSV(rides: Ride[], filename?: string) {
  const csvContent = ridesToCSV(rides);
  const date = new Date().toISOString().split('T')[0];
  const defaultFilename = filename || `corridas_${date}.csv`;
  downloadCSV(csvContent, defaultFilename);
}

/**
 * Criar resumo diário em CSV
 */
export function dailySummaryToCSV(summary: DailySummary): string {
  const headers = ['Métrica', 'Valor'];
  
  const rows = [
    ['Data', new Date(summary.date).toLocaleDateString('pt-BR')],
    ['Total de Ganhos', `R$ ${summary.totalEarnings.toFixed(2)}`],
    ['Total de Despesas', `R$ ${summary.totalExpenses.toFixed(2)}`],
    ['Lucro Líquido', `R$ ${summary.netProfit.toFixed(2)}`],
    ['Tempo Online', `${Math.floor(summary.timeOnline / 60)}h ${summary.timeOnline % 60}m`],
    ['Total de Corridas', summary.totalRides.toString()],
    ['Bônus Total', `R$ ${summary.totalBonus.toFixed(2)}`],
    ['', ''],
    ['Ganhos por Plataforma', ''],
    ['Uber', `R$ ${summary.earningsByPlatform.uber.toFixed(2)}`],
    ['99', `R$ ${summary.earningsByPlatform['99'].toFixed(2)}`],
    ['InDriver', `R$ ${summary.earningsByPlatform.indriver.toFixed(2)}`]
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Exportar resumo diário para CSV
 */
export function exportDailySummaryToCSV(summary: DailySummary, filename?: string) {
  const csvContent = dailySummaryToCSV(summary);
  const date = new Date(summary.date).toISOString().split('T')[0];
  const defaultFilename = filename || `resumo_${date}.csv`;
  downloadCSV(csvContent, defaultFilename);
}

/**
 * Exportar relatório completo (resumo + corridas)
 */
export function exportCompleteReport(summary: DailySummary, rides: Ride[], filename?: string) {
  const summaryCSV = dailySummaryToCSV(summary);
  const ridesCSV = ridesToCSV(rides);
  
  const completeCSV = [
    '=== RESUMO DO DIA ===',
    summaryCSV,
    '',
    '',
    '=== DETALHES DAS CORRIDAS ===',
    ridesCSV
  ].join('\n');

  const date = new Date(summary.date).toISOString().split('T')[0];
  const defaultFilename = filename || `relatorio_completo_${date}.csv`;
  downloadCSV(completeCSV, defaultFilename);
}
