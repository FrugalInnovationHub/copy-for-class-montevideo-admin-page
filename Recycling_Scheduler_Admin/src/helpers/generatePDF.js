import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Constants
const MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const MATERIAL_PALETTE = {
  // Soft color palette - lighter tints for TABLE headers and cells; solid colors for charts
  plasticos: {
    header: 'rgba(42, 60, 94, 0.2)',
    cell: 'rgba(42, 60, 94, 0.12)',
    pie: '#2A3C5E',
    bar: '#2A3C5E'
  }, // Navy Blue
  papel_carton: {
    header: 'rgba(210,180,140,0.20)',
    cell: 'rgba(210,180,140,0.12)',
    pie: '#D2B48C',
    bar: '#D2B48C'
  }, // Tan
  organico: {
    header: 'rgba(73, 116, 89, 0.2)',
    cell: 'rgba(73, 116, 89, 0.12)',
    pie: '#497459',
    bar: '#497459'
  }, // Soft Green
  otros: {
    header: 'rgba(104, 64, 64, 0.2)',
    cell: 'rgba(104, 64, 64, 0.12)',
    pie: '#684040',
    bar: '#684040'
  }, // Brown
  descarte: {
    header: 'rgba(135,206,235,0.25)',
    cell: 'rgba(135,206,235,0.12)',
    pie: '#87CEEB',
    bar: '#87CEEB'
  }, // Sky Blue
};

/**
 * Generate PDF report from report data
 * @param {Object} params - Report parameters
 * @param {Object} params.selectedClient - Selected client object
 * @param {string} params.selectedYear - Selected year or "last_12_months"
 * @param {string} params.selectedMonth - Selected month index (empty string for all months)
 * @param {Array} params.monthlyData - Monthly data array
 * @param {Object} params.totals - Totals object with material totals
 * @param {Array} params.pieChartData - Pie chart data array
 * @param {string} params.reportTitle - Report title
 * @param {Object} params.chartTitle - Chart title object with main and subtitle
 * @param {string} params.aiSummary - AI-generated summary
 * @param {string} params.editedSummary - Edited summary (optional)
 * @param {string} params.committedSummary - Committed summary (optional)
 */
export const generatePDFReport = async ({
  selectedClient,
  selectedYear,
  selectedMonth,
  monthlyData,
  totals,
  pieChartData,
  reportTitle,
  chartTitle,
  aiSummary,
  editedSummary = '',
  committedSummary = ''
}) => {
  try {
    if (!selectedClient) {
      alert("Por favor seleccione un cliente primero.");
      return;
    }

    if (!monthlyData || monthlyData.length === 0) {
      alert("No hay datos de colección para este cliente.");
      return;
    }

    // Generate filename
    let title;
    if (selectedYear === "last_12_months") {
      const today = new Date();
      const dateStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
      title = `informe_residuos_ultimos_12_meses_${dateStr}`;
    } else {
      const monthPart = selectedMonth !== '' ? `_${String(parseInt(selectedMonth) + 1).padStart(2, '0')}` : '';
      title = `informe_residuos_${selectedYear}${monthPart}`;
    }

    // Helper function to abbreviate month names (used in both table and bar chart)
    const abbreviateMonth = (monthName) => {
      if (!monthName) return '';
      // If already abbreviated (like "Ene '24"), return as is
      if (monthName.length <= 8) return monthName;
      // Extract first 3 letters for Spanish months
      const monthMap = {
        'ENERO': 'Ene', 'FEBRERO': 'Feb', 'MARZO': 'Mar', 'ABRIL': 'Abr',
        'MAYO': 'May', 'JUNIO': 'Jun', 'JULIO': 'Jul', 'AGOSTO': 'Ago',
        'SEPTIEMBRE': 'Sep', 'OCTUBRE': 'Oct', 'NOVIEMBRE': 'Nov', 'DICIEMBRE': 'Dic'
      };
      const upperMonth = monthName.toUpperCase();
      for (const [full, abbr] of Object.entries(monthMap)) {
        if (upperMonth.includes(full)) {
          // If there's a year suffix, convert 4-digit year to '24 format
          const yearMatch = monthName.match(/\s+(\d{4}|'\d{2})/);
          if (yearMatch) {
            let yearStr = yearMatch[1];
            // Convert 4-digit year (e.g., 2024) to '24 format
            if (/^\d{4}$/.test(yearStr)) {
              yearStr = `'${yearStr.slice(-2)}`;
            }
            return `${abbr} ${yearStr}`;
          }
          return abbr;
        }
      }
      return monthName.substring(0, 3);
    };

    // Build table HTML (smaller, abbreviated)
    const buildTableHTML = () => {
      let tableRows = '';
      monthlyData.forEach((row) => {
        const monthAbbr = abbreviateMonth(row.monthFull || row.month);
        tableRows += `
          <tr>
            <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; font-weight: 600; font-size: 12px; vertical-align: middle; line-height: 1;">${monthAbbr}</td>
            <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.plasticos.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${row.plasticos > 0 ? row.plasticos.toFixed(1) : 'SD'}</td>
            <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.papel_carton.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${row.papel_carton > 0 ? row.papel_carton.toFixed(1) : 'SD'}</td>
            <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.organico.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${row.organico > 0 ? row.organico.toFixed(1) : 'SD'}</td>
            <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.otros.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${row.otros > 0 ? row.otros.toFixed(1) : 'SD'}</td>
            <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.descarte.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${row.descarte > 0 ? row.descarte.toFixed(1) : 'SD'}</td>
          </tr>`;
      });

      // Totals row
      const totalLabel = selectedYear === "last_12_months" ? "TOTAL" : `TOTAL ${selectedYear}`;
      tableRows += `
        <tr style="background-color: #e5e7eb; font-weight: bold;">
          <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; font-size: 12px; vertical-align: middle; line-height: 1;">${totalLabel}</td>
          <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.plasticos.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${totals.plasticos > 0 ? totals.plasticos.toFixed(1) : 'SD'}</td>
          <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.papel_carton.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${totals.papel_carton > 0 ? totals.papel_carton.toFixed(1) : 'SD'}</td>
          <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.organico.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${totals.organico > 0 ? totals.organico.toFixed(1) : 'SD'}</td>
          <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.otros.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${totals.otros > 0 ? totals.otros.toFixed(1) : 'SD'}</td>
          <td style="padding: 4px 10px 16px 10px; border: 1px solid #000; text-align: center; background-color: ${MATERIAL_PALETTE.descarte.cell}; font-size: 12px; vertical-align: middle; line-height: 1;">${totals.descarte > 0 ? totals.descarte.toFixed(1) : 'SD'}</td>
        </tr>`;

      return `
        <div style="margin-top: 0; page-break-inside: avoid;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <colgroup>
              <col style="width: auto;">
              <col style="width: 16%;">
              <col style="width: 16%;">
              <col style="width: 16%;">
              <col style="width: 16%;">
              <col style="width: 16%;">
            </colgroup>
            <thead>
              <tr style="background-color: #d1d5db; color: #000;">
                <th style="padding: 4px 12px 16px 12px; border: 1px solid #000; text-align: left; font-weight: bold; font-size: 12px; vertical-align: middle; line-height: 1;">Fecha (mon/kg)</th>
                <th style="padding: 4px 12px 16px 12px; border: 1px solid #000; text-align: center; font-weight: bold; background-color: ${MATERIAL_PALETTE.plasticos.header}; font-size: 12px; vertical-align: middle; line-height: 1;">Plásticos</th>
                <th style="padding: 4px 12px 16px 12px; border: 1px solid #000; text-align: center; font-weight: bold; background-color: ${MATERIAL_PALETTE.papel_carton.header}; font-size: 12px; vertical-align: middle; line-height: 1;">Papel/Cartón</th>
                <th style="padding: 4px 12px 16px 12px; border: 1px solid #000; text-align: center; font-weight: bold; background-color: ${MATERIAL_PALETTE.organico.header}; font-size: 12px; vertical-align: middle; line-height: 1;">Orgánico</th>
                <th style="padding: 4px 12px 16px 12px; border: 1px solid #000; text-align: center; font-weight: bold; background-color: ${MATERIAL_PALETTE.otros.header}; font-size: 12px; vertical-align: middle; line-height: 1;">Otros</th>
                <th style="padding: 4px 12px 16px 12px; border: 1px solid #000; text-align: center; font-weight: bold; background-color: ${MATERIAL_PALETTE.descarte.header}; font-size: 12px; vertical-align: middle; line-height: 1;">Descarte</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>`;
    };

    // Build pie chart as SVG (increased size)
    const buildPieChartSVG = () => {
      if (pieChartData.length === 0) return '';

      const radius = 110; // Increased from 90
      const labelRadius = radius + 42; // Labels extend this far from center
      const svgSize = Math.ceil((labelRadius + 50) * 2); // Ensure SVG is large enough for labels with extra buffer (~404px)
      const centerX = svgSize / 2;
      const centerY = svgSize / 2;
      const labelLineRadius = radius + 18; // Increased
      let currentAngle = -90;

      const total = pieChartData.reduce((sum, item) => sum + item.value, 0);

      // Sort slices by size and rearrange to alternate large/small
      const sortedBySize = [...pieChartData].sort((a, b) => b.value - a.value);
      const rearranged = [];

      let frontIndex = 0;
      let backIndex = sortedBySize.length - 1;

      while (frontIndex <= backIndex) {
        if (frontIndex <= backIndex) {
          rearranged.push(sortedBySize[frontIndex]);
          frontIndex++;
        }
        if (frontIndex <= backIndex) {
          rearranged.push(sortedBySize[backIndex]);
          backIndex--;
        }
      }

      const paths = [];
      const labelLines = [];
      const labels = [];

      rearranged.forEach((item) => {
        const percentage = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + percentage;

        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);

        const largeArc = percentage > 180 ? 1 : 0;

        const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        paths.push(`<path d="${path}" fill="${item.color}" stroke="#fff" stroke-width="2"/>`);

        const labelAngle = startAngle + percentage / 2;
        const labelAngleRad = (labelAngle * Math.PI) / 180;

        const edgeX = centerX + radius * Math.cos(labelAngleRad);
        const edgeY = centerY + radius * Math.sin(labelAngleRad);

        const lineEndX = centerX + labelLineRadius * Math.cos(labelAngleRad);
        const lineEndY = centerY + labelLineRadius * Math.sin(labelAngleRad);

        const textX = centerX + labelRadius * Math.cos(labelAngleRad);
        const textY = centerY + labelRadius * Math.sin(labelAngleRad);

        labelLines.push(
          `<line x1="${edgeX}" y1="${edgeY}" x2="${lineEndX}" y2="${lineEndY}" stroke="#000" stroke-width="1.5"/>`
        );

        labels.push(
          `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="600" fill="#000">${item.percentage}%</text>`
        );

        currentAngle = endAngle;
      });

      // Calculate total for title
      const totalValue = pieChartData.reduce((sum, item) => sum + item.value, 0);

      return `
        <div style="display: flex; flex-direction: column; align-items: center; max-width: ${svgSize}px; flex-shrink: 0; min-height: ${svgSize + 200}px; padding-bottom: 80px;">
          <h3 style="text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 6px; color: rgba(0,0,0,0.7);">
            Porcentaje de Volumen de Residuos
          </h3>
          <p style="text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 10px; color: #dc2626;">
            ${chartTitle.subtitle}
          </p>
          <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="flex-shrink: 0; margin-top: 10px; overflow: visible;">
            ${paths.join('')}
            ${labelLines.join('')}
            ${labels.join('')}
          </svg>
        </div>`;
    };

    // Helper function to format numbers with periods as thousand separators
    const formatNumber = (num) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Build bar chart as HTML/CSS
    const buildBarChartHTML = () => {
      if (monthlyData.length === 0) return '';

      const rawMaxValue = Math.max(
        ...monthlyData.map(row =>
          row.plasticos + row.papel_carton + row.organico + row.otros + row.descarte
        ),
        100
      );

      // Round maxValue to a nice round number (multiples of 100, 200, 500, 1000, etc.)
      let maxValue;
      if (rawMaxValue <= 100) {
        maxValue = Math.ceil(rawMaxValue / 20) * 20;
      } else if (rawMaxValue <= 200) {
        maxValue = Math.ceil(rawMaxValue / 50) * 50;
      } else if (rawMaxValue <= 500) {
        maxValue = Math.ceil(rawMaxValue / 100) * 100;
      } else if (rawMaxValue <= 1000) {
        maxValue = Math.ceil(rawMaxValue / 200) * 200;
      } else if (rawMaxValue <= 2000) {
        maxValue = Math.ceil(rawMaxValue / 500) * 500;
      } else if (rawMaxValue <= 5000) {
        maxValue = Math.ceil(rawMaxValue / 1000) * 1000;
      } else {
        maxValue = Math.ceil(rawMaxValue / 2000) * 2000;
      }

      // Bar chart size - balanced for one-page layout
      const chartHeight = 350;
      const totalAvailableWidth = 850;
      const barWidth = Math.max(40, Math.min(80, (totalAvailableWidth / monthlyData.length) - 18));

      // Calculate y-axis ticks with round values
      const numTicks = 5;
      const yAxisLabels = [];
      for (let i = 0; i < numTicks; i++) {
        const value = Math.round((maxValue / (numTicks - 1)) * i);
        yAxisLabels.push(value);
      }

      // Calculate date range for title
      let dateRangeText = '';
      if (monthlyData.length > 0) {
        const firstMonth = monthlyData[0].monthFull || monthlyData[0].month;
        const lastMonth = monthlyData[monthlyData.length - 1].monthFull || monthlyData[monthlyData.length - 1].month;
        dateRangeText = `${firstMonth} – ${lastMonth}`;
      }

      // Build chart with horizontal guide lines
      const totalBarsWidth = barWidth * monthlyData.length;
      const gapWidth = monthlyData.length > 1 ? (totalAvailableWidth - totalBarsWidth) / (monthlyData.length + 1) : 25;
      const chartAreaWidth = totalAvailableWidth + 60; // Including padding

      let chartContainerHTML = '<div style="display: flex; align-items: flex-end; position: relative;">';

      // Y-axis labels
      chartContainerHTML += '<div style="display: flex; flex-direction: column-reverse; justify-content: space-between; align-items: flex-end; height: ' + chartHeight + 'px; padding-right: 10px; padding-left: 5px; min-width: 60px; margin-bottom: 50px;">';
      yAxisLabels.forEach((label) => {
        chartContainerHTML += `<div style="font-size: 14px; font-weight: 500;">${formatNumber(label)}</div>`;
      });
      chartContainerHTML += '</div>';

      // Chart area with grid lines - separate bars area from labels area
      chartContainerHTML += '<div style="position: relative; flex: 1;">';

      // Bars and grid area container
      chartContainerHTML += '<div style="position: relative; height: ' + chartHeight + 'px;">';

      // Horizontal guide lines (inside bars area only)
      for (let i = 0; i < numTicks; i++) {
        const lineY = chartHeight - (chartHeight / (numTicks - 1)) * i;
        const isBottomLine = i === 0;
        chartContainerHTML += `<div style="position: absolute; left: 0; right: 0; top: ${lineY}px; height: ${isBottomLine ? '2px' : '1px'}; background-color: ${isBottomLine ? '#000' : 'rgba(0,0,0,0.2)'}; z-index: 1;"></div>`;
      }

      // Y-axis line (left border)
      chartContainerHTML += '<div style="position: absolute; left: 0; top: 0; width: 2px; height: ' + chartHeight + 'px; background-color: #000; z-index: 1;"></div>';

      // Bars container (inside the chart height area)
      chartContainerHTML += '<div style="display: flex; align-items: flex-end; justify-content: center; padding: 0 30px; height: 100%; gap: ' + Math.max(15, gapWidth) + 'px; position: relative; z-index: 2;">';

      monthlyData.forEach((row) => {
        const stackHeights = [
          (row.plasticos / maxValue) * chartHeight,
          (row.papel_carton / maxValue) * chartHeight,
          (row.organico / maxValue) * chartHeight,
          (row.otros / maxValue) * chartHeight,
          (row.descarte / maxValue) * chartHeight
        ];

        const monthTotal = (row.plasticos || 0) + (row.papel_carton || 0) + (row.organico || 0) + (row.otros || 0) + (row.descarte || 0);

        chartContainerHTML += '<div style="display: flex; flex-direction: column; align-items: center; width: ' + barWidth + 'px; flex-shrink: 0;">';

        chartContainerHTML += '<div style="display: flex; flex-direction: column; align-items: center; position: relative;">';

        chartContainerHTML += `<div style="position: absolute; bottom: 100%; margin-bottom: 5px; font-size: 13px; font-weight: 600; text-align: center; white-space: nowrap; width: 100%;">${formatNumber(Math.round(monthTotal))}</div>`;

        const bars = [];
        if (stackHeights[4] > 0) {
          bars.push(`<div style="width: ${barWidth}px; height: ${stackHeights[4]}px; background-color: ${MATERIAL_PALETTE.descarte.bar}; border: 1px solid #000;"></div>`);
        }
        if (stackHeights[3] > 0) {
          bars.push(`<div style="width: ${barWidth}px; height: ${stackHeights[3]}px; background-color: ${MATERIAL_PALETTE.otros.bar}; border: 1px solid #000;"></div>`);
        }
        if (stackHeights[2] > 0) {
          bars.push(`<div style="width: ${barWidth}px; height: ${stackHeights[2]}px; background-color: ${MATERIAL_PALETTE.organico.bar}; border: 1px solid #000;"></div>`);
        }
        if (stackHeights[1] > 0) {
          bars.push(`<div style="width: ${barWidth}px; height: ${stackHeights[1]}px; background-color: ${MATERIAL_PALETTE.papel_carton.bar}; border: 1px solid #000;"></div>`);
        }
        if (stackHeights[0] > 0) {
          bars.push(`<div style="width: ${barWidth}px; height: ${stackHeights[0]}px; background-color: ${MATERIAL_PALETTE.plasticos.bar}; border: 1px solid #000;"></div>`);
        }

        chartContainerHTML += bars.join('');
        chartContainerHTML += '</div>';
        chartContainerHTML += '</div>';
      });

      chartContainerHTML += '</div>'; // bars container
      chartContainerHTML += '</div>'; // bars and grid area

      // X-axis labels container (separate from bars area, below the x-axis line)
      chartContainerHTML += '<div style="display: flex; justify-content: center; padding: 0 30px; gap: ' + Math.max(15, gapWidth) + 'px; margin-top: 8px;">';

      monthlyData.forEach((row) => {
        const monthAbbr = abbreviateMonth(row.month);
        chartContainerHTML += `<div style="width: ${barWidth}px; flex-shrink: 0;"><div style="font-size: 13px; text-align: center; transform: translateX(-20px) rotate(-45deg); transform-origin: center center; white-space: nowrap; height: 50px; display: flex; align-items: center; justify-content: center;">${monthAbbr}</div></div>`;
      });

      chartContainerHTML += '</div>'; // labels container
      chartContainerHTML += '</div>'; // chart area outer
      chartContainerHTML += '</div>'; // main container

      return `
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 0; margin-bottom: 40px; width: 100%;">
          <h3 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px; margin-top: 0;">
            <span style="color: rgba(0,0,0,0.7);">INFORME GESTIÓN DE RESIDUOS - ${dateRangeText}</span>
          </h3>
          ${chartContainerHTML}
        </div>`;
    };

    // Process markdown bold syntax (**text**) to HTML bold tags
    const processMarkdownBold = (text) => {
      if (!text) return text;
      // Replace **text** with <strong>text</strong>
      return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    };

    // Build summary paragraph for PDF
    const buildSummaryParagraph = () => {
      let summary = editedSummary || committedSummary || aiSummary;

      if (!summary) {
        const materialNames = {
          plasticos: 'plásticos',
          papel_carton: 'papel y cartón',
          organico: 'orgánicos',
          otros: 'otros',
          descarte: 'descarte'
        };

        const topMaterial = Object.entries(totals)
          .sort(([, a], [, b]) => b - a)[0];
        const topMaterialName = materialNames[topMaterial[0]] || 'desconocido';
        const topMaterialPct = Math.round((topMaterial[1] / (totals.plasticos + totals.papel_carton + totals.organico + totals.otros + totals.descarte)) * 100);

        const bottomMaterial = Object.entries(totals)
          .filter(([, v]) => v > 0)
          .sort(([, a], [, b]) => a - b)[0];
        const bottomMaterialName = bottomMaterial ? materialNames[bottomMaterial[0]] : null;

        const monthlyTotals = monthlyData.map(row => ({
          month: row.month,
          total: (row.plasticos || 0) + (row.papel_carton || 0) + (row.organico || 0) +
            (row.otros || 0) + (row.descarte || 0)
        }));

        const totalWeight = totals.plasticos + totals.papel_carton + totals.organico + totals.otros + totals.descarte;
        const bestMonth = monthlyTotals.length > 0 ? monthlyTotals.reduce((max, m) => m.total > max.total ? m : max, monthlyTotals[0]) : null;
        const worstMonth = monthlyTotals.length > 0 ? monthlyTotals.reduce((min, m) => m.total < min.total ? m : min, monthlyTotals[0]) : null;

        const avgFirstHalf = monthlyTotals.length > 0 ? monthlyTotals.slice(0, Math.ceil(monthlyTotals.length / 2))
          .reduce((sum, m) => sum + m.total, 0) / Math.ceil(monthlyTotals.length / 2) : 0;
        const avgSecondHalf = monthlyTotals.length > 0 ? monthlyTotals.slice(Math.ceil(monthlyTotals.length / 2))
          .reduce((sum, m) => sum + m.total, 0) / (monthlyTotals.length - Math.ceil(monthlyTotals.length / 2)) : 0;
        const trend = avgSecondHalf > avgFirstHalf ? 'creciente' : avgSecondHalf < avgFirstHalf ? 'decreciente' : 'estable';
        const trendChange = avgFirstHalf > 0 ? Math.abs(((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100) : 0;

        const monthPart = selectedMonth !== '' ? MONTHS[parseInt(selectedMonth)] : 'Todos los meses';
        const periodText = selectedYear === "last_12_months"
          ? `${monthPart} de los últimos 12 meses`
          : `${monthPart} ${selectedYear}`;

        summary = `Durante el período ${periodText}, ${selectedClient.client_name} ha gestionado un total de ${Math.round(totalWeight).toLocaleString()} kg de residuos. `;

        summary += `La distribución muestra que ${topMaterialName} representa el material dominante con ${topMaterialPct}% del total (${Math.round(topMaterial[1]).toLocaleString()} kg). `;

        if (pieChartData.length > 1) {
          const secondMaterial = pieChartData
            .sort((a, b) => b.percentage - a.percentage)[1];
          summary += `Seguido de ${secondMaterial.name.toLowerCase()} con ${secondMaterial.percentage}%. `;
        }

        if (bottomMaterial && bottomMaterial[1] > 0) {
          const bottomPct = Math.round((bottomMaterial[1] / totalWeight) * 100);
          summary += `Por otro lado, ${bottomMaterialName} representa solo ${bottomPct}% del total. `;
        }

        if (bestMonth && worstMonth) {
          summary += `En términos de rendimiento mensual, ${bestMonth.month} destacó como el mes con mayor recolección (${Math.round(bestMonth.total).toLocaleString()} kg)`;

          if (worstMonth.month !== bestMonth.month) {
            summary += `, mientras que ${worstMonth.month} registró el menor volumen (${Math.round(worstMonth.total).toLocaleString()} kg)`;
          }
          summary += `. `;

          if (monthlyTotals.length >= 3) {
            summary += `La tendencia general muestra un patrón ${trend}`;
            if (trendChange > 5) {
              summary += ` con una variación significativa del ${Math.round(trendChange)}%`;
            }
            summary += `. `;
          }
        }

        if (topMaterialPct > 40) {
          summary += `El alto porcentaje de ${topMaterialName} sugiere una oportunidad para fortalecer programas específicos de reciclaje. `;
        }

        if (totals.descarte > 0) {
          const descartePct = Math.round((totals.descarte / totalWeight) * 100);
          if (descartePct > 5) {
            summary += `Es importante notar que el descarte representa ${descartePct}% del total, lo cual indica áreas de mejora en la separación de residuos. `;
          } else {
            summary += `El bajo porcentaje de descarte (${descartePct}%) refleja una efectiva separación de residuos en origen. `;
          }
        }

        summary += `Estos datos proporcionan una base sólida para optimizar las estrategias de gestión de residuos.`;
      }

      // Process markdown bold syntax
      const processedSummary = processMarkdownBold(summary);

      return `
        <div style="page-break-inside: avoid; margin-top: 45px; margin-bottom: 15px; padding-bottom: 25px; border-bottom: 2px solid rgba(0,0,0,0.3); font-family: 'Roboto', sans-serif;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: rgba(0,0,0,0.7); font-family: 'Roboto', sans-serif;">
            Resumen Ejecutivo Producido con IA
          </h3>
          <p style="text-align: justify; line-height: 1.6; font-size: 14px; color: #000; font-family: 'Roboto', sans-serif;">
            ${processedSummary}
          </p>
        </div>`;
    };

    // Build bar chart with legend
    const buildBarChartWithLegend = () => {
      if (monthlyData.length === 0) return '';

      const barChart = buildBarChartHTML();

      const legendHTML = `
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px; flex-wrap: wrap; padding: 15px 30px 0 30px; border-top: 1px solid rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 18px; height: 16px; background-color: ${MATERIAL_PALETTE.plasticos.bar}; border: 1px solid #000; flex-shrink: 0;"></div>
            <span style="font-size: 12px; font-weight: 500; line-height: 16px; margin-top: -12px;">Plásticos</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 18px; height: 16px; background-color: ${MATERIAL_PALETTE.papel_carton.bar}; border: 1px solid #000; flex-shrink: 0;"></div>
            <span style="font-size: 12px; font-weight: 500; line-height: 16px; margin-top: -12px;">Papel y cartón</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 18px; height: 16px; background-color: ${MATERIAL_PALETTE.organico.bar}; border: 1px solid #000; flex-shrink: 0;"></div>
            <span style="font-size: 12px; font-weight: 500; line-height: 16px; margin-top: -12px;">Orgánicos</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 18px; height: 16px; background-color: ${MATERIAL_PALETTE.otros.bar}; border: 1px solid #000; flex-shrink: 0;"></div>
            <span style="font-size: 12px; font-weight: 500; line-height: 16px; margin-top: -12px;">Otros</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 18px; height: 16px; background-color: ${MATERIAL_PALETTE.descarte.bar}; border: 1px solid #000; flex-shrink: 0;"></div>
            <span style="font-size: 12px; font-weight: 500; line-height: 16px; margin-top: -12px;">Descarte</span>
          </div>
        </div>`;

      return `
        <div style="page-break-inside: avoid; margin-top: 12px; margin-bottom: 45px; padding-bottom: 15px; border-bottom: 2px solid rgba(0,0,0,0.3);">
          ${barChart}
          ${legendHTML}
        </div>`;
    };

    // Build table and pie chart side-by-side section
    const buildTableAndPieChartSideBySide = () => {
      const tableHTML = buildTableHTML();
      const pieChart = pieChartData.length > 0 ? buildPieChartSVG() : '';

      if (!pieChart) {
        // If no pie chart, just return table
        return `
          <div style="page-break-inside: avoid; margin-top: 15px;">
            ${tableHTML}
          </div>`;
      }

      return `
        <div style="page-break-inside: avoid; margin-top: 15px; display: flex; align-items: flex-start; gap: 30px; overflow: visible;">
          <div style="flex: 1; min-width: 0;">
            ${tableHTML}
          </div>
          <div style="flex: 0 0 auto; display: flex; align-items: flex-start; justify-content: center; overflow: visible;">
            ${pieChart}
          </div>
        </div>`;
    };

    // Get logo path
    const logoPath = '/logo.jpg';

    // Create a temporary container for PDF generation (optimized for one-page A3)
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1100px'; // Slightly reduced for better fit
    tempContainer.style.backgroundColor = '#fff';
    tempContainer.style.padding = '15px 40px 10px 40px'; // Reduced padding
    tempContainer.style.overflow = 'visible'; // Allow content to extend beyond container
    document.body.appendChild(tempContainer);

    // Calculate the last month's date for the header
    let lastMonthDate = '';
    if (monthlyData.length > 0) {
      const lastRow = monthlyData[monthlyData.length - 1];
      lastMonthDate = lastRow.monthFull || lastRow.month;
    }

    // Build client logo HTML - only show if logo_file exists and client is not "all_clients"
    const clientLogoPath = selectedClient.logo_file
      ? (selectedClient.logo_file.startsWith('http://') || selectedClient.logo_file.startsWith('https://')
        ? selectedClient.logo_file
        : `${window.location.origin}/${selectedClient.logo_file}`)
      : null;
    const isAllClients = selectedClient.id === 'all_clients';

    // Build logos HTML - main logo always shown, client logo shown if available and not "all clients"
    let logosHTML = '';
    if (!isAllClients && clientLogoPath) {
      // Show both client logo and main logo side by side
      logosHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
          <img src="${clientLogoPath}" alt="Client Logo" style="height: 80px; width: auto; object-fit: contain;" onerror="this.style.display='none'" />
          <img src="${window.location.origin}${logoPath}" alt="Logo" style="height: 100px; width: auto; object-fit: contain;" onerror="this.style.display='none'" />
        </div>
      `;
    } else {
      // Only show main logo
      logosHTML = `<img src="${window.location.origin}${logoPath}" alt="Logo" style="height: 100px; width: auto; object-fit: contain;" onerror="this.style.display='none'" />`;
    }

    // Create HTML content for PDF (new order: Summary -> Bar Chart -> Table & Pie Chart side-by-side)
    const printHTML = `
      <div style="font-family: 'Roboto', ui-sans-serif, system-ui, sans-serif; color: #000; background: #fff; padding-bottom: 20px; overflow: visible;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 15px;">
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <h1 style="font-size: 24px; font-weight: bold; color: rgba(0,0,0,0.7); margin: 0;">Informe de Gestión de Residuos</h1>
            <div style="font-size: 16px; color: rgba(0,0,0,0.6); margin-top: 3px;">${selectedClient.client_name} - ${lastMonthDate}</div>
          </div>
          ${logosHTML}
        </div>
        ${buildSummaryParagraph()}
        ${buildBarChartWithLegend()}
        ${buildTableAndPieChartSideBySide()}
      </div>
    `;

    tempContainer.innerHTML = printHTML;

    // Wait for images to load
    const images = tempContainer.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    await Promise.all(imagePromises);

    // Small delay to ensure rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ensure container height is calculated properly
    const containerHeight = Math.max(tempContainer.scrollHeight, tempContainer.offsetHeight, tempContainer.clientHeight);

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: tempContainer.scrollWidth,
      height: containerHeight,
      windowWidth: tempContainer.scrollWidth,
      windowHeight: containerHeight,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');

    // A3 dimensions in mm: 297 x 420 (portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a3'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate ratio to fit width
    const ratio = pdfWidth / imgWidth;
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Only add first page - force single page PDF
    pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight);

    // Add footer image to first page only
    pdf.setPage(1);

    // Load and add footer PNG image
    try {
      const footerImg = new Image();
      footerImg.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        footerImg.onload = () => {
          try {
            // Create canvas to convert image to data URL
            const canvas = document.createElement('canvas');
            canvas.width = footerImg.width;
            canvas.height = footerImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(footerImg, 0, 0);
            const footerData = canvas.toDataURL('image/png');

            // Calculate footer dimensions (width: 30mm, maintain aspect ratio)
            const footerWidth = 25; // mm - decreased size
            const footerHeight = (footerImg.height / footerImg.width) * footerWidth;
            const rightMargin = 5; // 5mm from right edge
            const bottomMargin = 5; // 5mm from bottom edge
            const footerX = pdfWidth - footerWidth - rightMargin; // Position at bottom right
            const footerY = pdfHeight - footerHeight - bottomMargin; // Position at bottom right

            // Add text to the left of the image
            const textGap = 1.5; // 0.5mm gap between text and image
            pdf.setTextColor(150, 150, 150); // Lighter gray color
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold'); // Make text bold

            // Calculate text position to align with image center vertically, moved down slightly
            const textLineHeight = 4; // Height between lines
            const verticalOffset = 1; // Move text down by 1mm
            const textCenterY = footerY + footerHeight / 2 + verticalOffset;
            const line1Y = textCenterY - textLineHeight / 2;
            const line2Y = textCenterY + textLineHeight / 2;

            // Right-align text, positioned closer to the image
            const line1Text = 'Powered';
            const line2Text = 'By';
            const textX = footerX - textGap; // Position text right before the image

            pdf.text(line1Text, textX, line1Y, { align: 'right' });
            pdf.text(line2Text, textX, line2Y, { align: 'right' });

            pdf.addImage(footerData, 'PNG', footerX, footerY, footerWidth, footerHeight);
            resolve();
          } catch (e) {
            console.log('Could not add footer image:', e);
            resolve(); // Resolve anyway to not block PDF generation
          }
        };
        footerImg.onerror = () => {
          console.log('Could not load footer image');
          resolve(); // Resolve anyway to not block PDF generation
        };
        footerImg.src = `${window.location.origin}/Frugal_Blk_BriteRed-Stack-4.png`;
      });
    } catch (e) {
      console.log('Could not add footer image:', e);
    }

    // Download the PDF
    pdf.save(`${title}.pdf`);

    // Clean up
    document.body.removeChild(tempContainer);

  } catch (e) {
    console.error("PDF generation failed:", e);
    alert("Error: " + e.message);
    // Clean up on error
    const tempContainer = document.querySelector('div[style*="-9999px"]');
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
  }
};

