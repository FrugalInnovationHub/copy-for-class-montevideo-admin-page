import React, { useEffect, useState, useRef } from 'react'
import NavigationWrapper from '../components/Navigation/NavigationWrapper';
import { getClients, getCollectionsByClientId } from '../api/calls';
import Spinner from '../components/Navigation/Spinner';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useReactToPrint } from 'react-to-print';
import { generatePDFReport } from '../helpers/generatePDF';
import { PencilSquareIcon, ArrowDownTrayIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext';
//import { useLanguage } from '../i18n/LanguageContext';
import useIsMobile from '../components/hooks/useIsMobile';


const StatisticReports = () => {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedYear, setSelectedYear] = useState("last_12_months");
  const [selectedMonth, setSelectedMonth] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const isMobile = useIsMobile();


  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [editedMonthlyData, setEditedMonthlyData] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Committed (saved) edits - persists after save
  const [committedSummary, setCommittedSummary] = useState('');
  const [committedMonthlyData, setCommittedMonthlyData] = useState([]);

  const reportRef = useRef(null);
  const handlePrintReport = useReactToPrint({
    content: () => reportRef.current,
    contentRef: reportRef,
    documentTitle: () => {
      if (selectedYear === "last_12_months") {
        const today = new Date();
        const dateStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
        return `informe_residuos_ultimos_12_meses_${dateStr}`;
      } else {
        const monthPart = selectedMonth !== '' ? `_${String(parseInt(selectedMonth) + 1).padStart(2, '0')}` : '';
        return `informe_residuos_${selectedYear}${monthPart}`;
      }
    },
    pageStyle: `
    @page { size: A3 portrait; margin: 10mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #ffffff; }
    .report-scope * { page-break-inside: avoid; }
    .report-scope { transform: scale(0.92); transform-origin: top left; }
    @media screen {
      .report-scope { transform: none !important; }
    }
    .no-print { display: none !important; }
  `
  });

  // Dedicated print method for Exportar PDF button
  const printReport = () => {
    handlePrintReport();
  };

  // Dedicated print method: creates a perfectly formatted A3 print document
  const handleDedicatedPrint = async () => {
    if (!selectedClient) {
      alert("Por favor seleccione un cliente primero.");
      return;
    }

    if (collections.length === 0) {
      alert("No hay datos de colección para este cliente.");
      return;
    }

    const reportTitle = t(getReportHeaderTitle());
    const chartTitle = getChartTitle();

    await generatePDFReport({
      selectedClient,
      selectedYear,
      selectedMonth,
      monthlyData: monthlyData.map(row => ({
        ...row,
        month: t(row.month),
        monthFull: t(row.monthFull),
      })),
      totals,
      pieChartData: pieChartData.map(item => ({ ...item, name: t(item.name) })),
      reportTitle,
      chartTitle: {
        ...chartTitle,
        main: t(chartTitle.main),
        subtitle: t(chartTitle.subtitle),
      },
      aiSummary,
      editedSummary,
      committedSummary
    });
  };

  // Generate AI Summary from report data
  const generateAISummary = async () => {
    try {
      if (!selectedClient) {
        alert("Por favor seleccione un cliente primero.");
        return;
      }

      if (collections.length === 0) {
        alert("No hay datos de colección para este cliente.");
        return;
      }

      setLoadingSummary(true);
      setAiSummary('');

      // Ensure we have valid data
      if (!monthlyData || !Array.isArray(monthlyData)) {
        throw new Error('No hay datos mensuales disponibles para generar el resumen.');
      }

      if (!totals || typeof totals !== 'object') {
        throw new Error('No hay datos de totales disponibles para generar el resumen.');
      }

      // Format report data for AI
      const reportData = {
        client: selectedClient.client_name,
        year: selectedYear === "last_12_months" ? t("Últimos 12 Meses") : selectedYear,
        month: selectedMonth !== '' ? t(MONTHS[parseInt(selectedMonth)]) : t('Todos los meses'),
        totals: {
          plasticos: totals.plasticos || 0,
          papel_carton: totals.papel_carton || 0,
          organico: totals.organico || 0,
          otros: totals.otros || 0,
          descarte: totals.descarte || 0
        },
        monthlyData: (monthlyData || []).map(row => ({
          month: row.month,
          plasticos: row.plasticos || 0,
          papel_carton: row.papel_carton || 0,
          organico: row.organico || 0,
          otros: row.otros || 0,
          descarte: row.descarte || 0
        })),
        pieChartData: pieChartData || []
      };

      const totalWeight = reportData.totals.plasticos + reportData.totals.papel_carton +
        reportData.totals.organico + reportData.totals.otros + reportData.totals.descarte;

      const prompt = language === 'en' ? `Analyze the following waste-management data and write a professional executive summary in English:

Client: ${reportData.client}
Period: ${reportData.month} ${reportData.year}

Material totals:
- Plastics: ${Math.round(reportData.totals.plasticos).toLocaleString()} kg
- Paper and cardboard: ${Math.round(reportData.totals.papel_carton).toLocaleString()} kg
- Organic waste: ${Math.round(reportData.totals.organico).toLocaleString()} kg
- Other: ${Math.round(reportData.totals.otros).toLocaleString()} kg
- Landfill waste: ${Math.round(reportData.totals.descarte).toLocaleString()} kg

Overall total: ${Math.round(totalWeight).toLocaleString()} kg

Monthly data:
${reportData.monthlyData.map(row => `- ${row.month}: ${Math.round((row.plasticos + row.papel_carton + row.organico + row.otros + row.descarte)).toLocaleString()} kg`).join('\n')}

Identify patterns, trends, the most and least collected materials, monthly variation, and opportunities for improvement. Write no more than 200 words as connected professional prose. Return only the summary.` : `Analiza los siguientes datos de gestión de residuos y genera un resumen ejecutivo narrativo en español:

Cliente: ${reportData.client}
Período: ${reportData.month} ${reportData.year}

Totales por material:
- Plásticos: ${Math.round(reportData.totals.plasticos).toLocaleString()} kg
- Papel y cartón: ${Math.round(reportData.totals.papel_carton).toLocaleString()} kg
- Orgánicos: ${Math.round(reportData.totals.organico).toLocaleString()} kg
- Otros: ${Math.round(reportData.totals.otros).toLocaleString()} kg
- Descarte: ${Math.round(reportData.totals.descarte).toLocaleString()} kg

Total general: ${Math.round(totalWeight).toLocaleString()} kg

Datos mensuales:
${reportData.monthlyData.map(row => `- ${row.month}: ${Math.round((row.plasticos + row.papel_carton + row.organico + row.otros + row.descarte)).toLocaleString()} kg`).join('\n')}

Genera un resumen narrativo que:
1. Identifique patrones y tendencias en los datos
2. Destaque los materiales más y menos recolectados
3. Analice la variación mensual
4. Proporcione insights sobre oportunidades de mejora
5. Sea profesional y conciso (máximo 200 palabras)

Redacta el texto como un informe narrativo profesional, conectando las ideas de forma natural.
Usa solo párrafos, sin títulos de sección ni listas con viñetas dentro del texto.
Responde SOLO con el resumen, sin introducción ni conclusiones adicionales.`;

      // Use Groq API (free tier, very fast)
      // Get free API key at: https://console.groq.com/
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';

      // Debug: log if API key is found (first few chars only for security)
      console.log('API Key check:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'Not found');

      if (!apiKey) {
        // Generate a narrative summary with pattern analysis
        const materialNames = {
          plasticos: 'plásticos',
          papel_carton: 'papel y cartón',
          organico: 'orgánicos',
          otros: 'otros',
          descarte: 'descarte'
        };

        // Find top material
        const topMaterial = Object.entries(reportData.totals)
          .sort(([, a], [, b]) => b - a)[0];
        const topMaterialName = materialNames[topMaterial[0]] || 'desconocido';
        const topMaterialPct = Math.round((topMaterial[1] / totalWeight) * 100);

        // Find least collected material
        const bottomMaterial = Object.entries(reportData.totals)
          .filter(([, v]) => v > 0)
          .sort(([, a], [, b]) => a - b)[0];
        const bottomMaterialName = bottomMaterial ? materialNames[bottomMaterial[0]] : null;

        // Analyze monthly trends
        const monthlyTotals = reportData.monthlyData.map(row => ({
          month: row.month,
          total: (row.plasticos || 0) + (row.papel_carton || 0) + (row.organico || 0) +
            (row.otros || 0) + (row.descarte || 0)
        }));

        const bestMonth = monthlyTotals.reduce((max, m) => m.total > max.total ? m : max, monthlyTotals[0]);
        const worstMonth = monthlyTotals.reduce((min, m) => m.total < min.total ? m : min, monthlyTotals[0]);

        // Calculate trend (compare first half vs second half if we have enough data)
        const avgFirstHalf = monthlyTotals.slice(0, Math.ceil(monthlyTotals.length / 2))
          .reduce((sum, m) => sum + m.total, 0) / Math.ceil(monthlyTotals.length / 2);
        const avgSecondHalf = monthlyTotals.slice(Math.ceil(monthlyTotals.length / 2))
          .reduce((sum, m) => sum + m.total, 0) / (monthlyTotals.length - Math.ceil(monthlyTotals.length / 2));
        const trend = avgSecondHalf > avgFirstHalf ? 'creciente' : avgSecondHalf < avgFirstHalf ? 'decreciente' : 'estable';
        //const trendChange = Math.abs(((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100);
        const trendChange = avgFirstHalf > 0
  ? Math.abs(((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100)
  : (avgSecondHalf > 0 ? 100 : 0);

        // Build narrative summary
        let summary = `Durante el período ${reportData.month} ${reportData.year}, ${reportData.client} ha gestionado un total de ${Math.round(totalWeight).toLocaleString()} kg de residuos. `;

        summary += `La distribución muestra que ${topMaterialName} representa el material dominante con ${topMaterialPct}% del total (${Math.round(topMaterial[1]).toLocaleString()} kg), `;

        if (reportData.pieChartData.length > 1) {
          const secondMaterial = reportData.pieChartData
            .sort((a, b) => b.percentage - a.percentage)[1];
          summary += `seguido de ${secondMaterial.name.toLowerCase()} con ${secondMaterial.percentage}%. `;
        }

        if (bottomMaterial && bottomMaterial[1] > 0) {
          const bottomPct = Math.round((bottomMaterial[1] / totalWeight) * 100);
          summary += `Por otro lado, ${bottomMaterialName} representa solo ${bottomPct}% del total, indicando una menor generación de este tipo de residuo. `;
        }

        if (monthlyTotals.length > 1) {
          summary += `En términos de rendimiento mensual, ${bestMonth.month} destacó como el mes con mayor recolección (${Math.round(bestMonth.total).toLocaleString()} kg), `;

          if (worstMonth.month !== bestMonth.month) {
            summary += `mientras que ${worstMonth.month} registró el menor volumen (${Math.round(worstMonth.total).toLocaleString()} kg). `;
          }

          if (monthlyTotals.length >= 3) {
            summary += `La tendencia general muestra un patrón ${trend}`;
            if (trendChange > 5) {
              summary += ` con una variación significativa del ${Math.round(trendChange)}%`;
            }
            summary += `. `;
          }
        }

        // Add insights
        if (topMaterialPct > 40) {
          summary += `El alto porcentaje de ${topMaterialName} sugiere una oportunidad para fortalecer programas específicos de reciclaje y reducir el impacto ambiental mediante una gestión más enfocada de este material. `;
        }

        if (reportData.totals.descarte > 0) {
          const descartePct = Math.round((reportData.totals.descarte / totalWeight) * 100);
          if (descartePct > 5) {
            summary += `Es importante notar que el descarte representa ${descartePct}% del total, lo cual indica áreas de mejora en la separación y clasificación de residuos. `;
          } else {
            summary += `El bajo porcentaje de descarte (${descartePct}%) refleja una efectiva separación de residuos en origen. `;
          }
        }

        summary += `Estos datos proporcionan una base sólida para optimizar las estrategias de gestión de residuos y mejorar los procesos de reciclaje en el futuro.`;

        if (language === 'en') {
          const englishMaterialNames = {
            plasticos: 'plastics',
            papel_carton: 'paper and cardboard',
            organico: 'organic waste',
            otros: 'other materials',
            descarte: 'landfill waste'
          };
          const englishTopName = englishMaterialNames[topMaterial[0]] || 'the leading material';
          let englishSummary = `During ${reportData.month} ${reportData.year}, ${reportData.client} managed a total of ${Math.round(totalWeight).toLocaleString()} kg of waste. `;
          englishSummary += `${englishTopName} was the dominant material at ${topMaterialPct}% of the total (${Math.round(topMaterial[1]).toLocaleString()} kg). `;

          if (bottomMaterial && bottomMaterial[1] > 0) {
            const bottomPct = Math.round((bottomMaterial[1] / totalWeight) * 100);
            englishSummary += `${englishMaterialNames[bottomMaterial[0]] || 'The least collected material'} represented ${bottomPct}% of the total, indicating comparatively low generation. `;
          }

          if (monthlyTotals.length > 1) {
            englishSummary += `${bestMonth.month} recorded the highest monthly collection (${Math.round(bestMonth.total).toLocaleString()} kg)`;
            if (worstMonth.month !== bestMonth.month) {
              englishSummary += `, while ${worstMonth.month} recorded the lowest (${Math.round(worstMonth.total).toLocaleString()} kg)`;
            }
            englishSummary += '. ';
            if (monthlyTotals.length >= 3) {
              const englishTrend = trend === 'creciente' ? 'increasing' : trend === 'decreciente' ? 'decreasing' : 'stable';
              englishSummary += `The overall trend was ${englishTrend}`;
              if (trendChange > 5) englishSummary += `, with a significant variation of ${Math.round(trendChange)}%`;
              englishSummary += '. ';
            }
          }

          englishSummary += 'These results provide a sound basis for improving waste-management strategies and recycling processes.';
          setAiSummary(englishSummary);
        } else {
          setAiSummary(summary);
        }
        return;
      }

      // Use Groq API if API key is provided
      const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

      const response = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // Fast and free
          messages: [
            {
              role: 'system',
              content: language === 'en'
                ? 'You are a waste-management analyst who writes concise, professional executive summaries in English.'
                : 'Eres un experto analista de gestión de residuos que genera resúmenes ejecutivos concisos y profesionales en español.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500, // Increased to allow complete paragraph responses
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Error de Groq API: ${errorMsg}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected Groq API response:', data);
        throw new Error('Formato de respuesta inesperado de Groq API.');
      }

      const summary = data.choices[0].message.content || 'No se pudo generar el resumen.';
      setAiSummary(summary);

    } catch (error) {
      console.error('Error generating AI summary:', error);
      console.error('Error details:', {
        error,
        message: error.message,
        stack: error.stack,
        monthlyData: monthlyData,
        totals: totals,
        pieChartData: pieChartData
      });

      const errorMessage = error.message || 'Error desconocido al generar el resumen';
      alert('Error al generar el resumen: ' + errorMessage + '\n\nPor favor, asegúrate de:\n1. Tener datos de colección cargados\n2. Haber seleccionado un cliente\n3. Tener configurada la API key (opcional) como VITE_GROQ_API_KEY en tu archivo .env\n\nRevisa la consola para más detalles.');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (reportGenerated && collections.length > 0 && !isEditMode && !committedSummary) {
      generateAISummary();
    }
    // Regenerate generated prose in the newly selected language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Fetch all clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        await getClients(setClients);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Fetch collections when a client is selected
  useEffect(() => {
    const fetchCollections = async () => {
      if (!selectedClient) {
        setCollections([]);
        setReportGenerated(false);
        setAiSummary('');
        // Clear edited and committed data when client is deselected
        setEditedSummary('');
        setEditedMonthlyData([]);
        setCommittedSummary('');
        setCommittedMonthlyData([]);
        setIsEditMode(false);
        setHasUnsavedChanges(false);
        return;
      }

      try {
        setLoadingCollections(true);

        let data = [];
        if (selectedClient.id === 'all_clients') {
          // Fetch collections from all clients
          const allCollectionsPromises = clients.map(client =>
            getCollectionsByClientId(client.id).catch(err => {
              console.error(`Error fetching collections for client ${client.id}:`, err);
              return [];
            })
          );
          const allCollectionsArrays = await Promise.all(allCollectionsPromises);
          data = allCollectionsArrays.flat();
        } else {
          data = await getCollectionsByClientId(selectedClient.id);
        }

        setCollections(data);
        // Reset report when client changes
        setReportGenerated(false);
        setAiSummary('');
        // Clear edited and committed data when client changes
        setEditedSummary('');
        setEditedMonthlyData([]);
        setCommittedSummary('');
        setCommittedMonthlyData([]);
        setIsEditMode(false);
        setHasUnsavedChanges(false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCollections(false);
      }
    };
    fetchCollections();
  }, [selectedClient, clients]);

  // Reset report when year or month changes
  useEffect(() => {
    setReportGenerated(false);
    setAiSummary('');
    // Clear edited and committed data when filters change
    setEditedSummary('');
    setEditedMonthlyData([]);
    setCommittedSummary('');
    setCommittedMonthlyData([]);
    setIsEditMode(false);
    setHasUnsavedChanges(false);
  }, [selectedYear, selectedMonth]);

  // Generate report function
  const generateReport = () => {
    if (!selectedClient) {
      alert("Por favor seleccione un cliente primero.");
      return;
    }

    if (collections.length === 0) {
      alert("No hay datos de colección para este cliente.");
      return;
    }

    setReportGenerated(true);
    // Automatically generate the summary paragraph
    generateAISummary();
  };

  // Edit mode handlers
  const handleEditMode = () => {
    // Initialize edited data with current data
    // Priority: editedSummary > committedSummary > aiSummary
    setEditedSummary(editedSummary || committedSummary || aiSummary);

    // Use the current monthlyData (which already includes committed edits if any)
    const dataToEdit = monthlyData || [];
    if (dataToEdit.length === 0) {
      alert("No hay datos para editar");
      return;
    }

    // If editedMonthlyData is empty, copy from current monthlyData
    // (monthlyData already reflects committed edits or original data)
    if (editedMonthlyData.length === 0) {
      const copiedData = dataToEdit.map(row => ({ ...row }));
      setEditedMonthlyData(copiedData);
    }

    setIsEditMode(true);
  };

  const handleSaveChanges = () => {
    // Commit the current edits
    setCommittedSummary(editedSummary);
    setCommittedMonthlyData(editedMonthlyData);

    setIsEditMode(false);
    setHasUnsavedChanges(false);
    // The edited data is now committed and will persist
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("¿Descartar los cambios realizados?");
      if (!confirmed) return;
    }
    setIsEditMode(false);
    // Clear current editing session, but keep committed data
    setEditedSummary('');
    setEditedMonthlyData([]);
    setHasUnsavedChanges(false);
    // committedSummary and committedMonthlyData remain intact
  };

  const handleTableCellChange = (monthIndex, field, value) => {
    // Parse the value - allow empty strings to be treated as 0
    let numValue = 0;
    if (value !== '' && value !== null && value !== undefined) {
      numValue = parseFloat(value);
      if (isNaN(numValue)) {
        numValue = 0;
      }
    }

    // Create a new array with updated values
    const newData = editedMonthlyData.map((row, index) => {
      if (index === monthIndex) {
        // Create a new object for this row with the updated field
        return {
          ...row,
          [field]: numValue
        };
      }
      return row;
    });

    console.log(`Updated ${field} at index ${monthIndex} to ${numValue}`); // Debug log
    setEditedMonthlyData(newData);
    setHasUnsavedChanges(true);
  };

  const handleSummaryChange = (value) => {
    setEditedSummary(value);
    setHasUnsavedChanges(true);
  };

  // Material categories mapping
  const MATERIAL_CATEGORIES = {
    plasticos: 'Plásticos',
    papel_carton: 'Papel y cartón',
    organico: 'Orgánicos',
    otros: 'Otros',
    otros_reciclables: 'Otros',
    descarte: 'Descarte',
    mezclado: 'Otros'
  };

  // Month names in Spanish
  const MONTHS = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  const MONTHS_SHORT_ES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const MONTHS_SHORT_EN = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const MONTHS_SHORT = language === 'en' ? MONTHS_SHORT_EN : MONTHS_SHORT_ES;
  // Generate array of years (current year and past 5 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  const availableYears = generateYears();

  // Aggregate collections data by month and material type
  const getMonthlyData = () => {
    const monthlyData = {};
    const totals = {
      plasticos: 0,
      papel_carton: 0,
      organico: 0,
      otros: 0,
      descarte: 0
    };

    // Pre-populate all 12 months with zero values for "last_12_months"
    if (selectedYear === "last_12_months") {
      const today = new Date();
      // If today is <= 25th, don't include current month (start from last month)
      // If today > 25th, include current month
      const currentDay = today.getDate();
      let referenceDate = new Date(today);

      if (currentDay <= 25) {
        referenceDate.setMonth(referenceDate.getMonth() - 1);
      }

      for (let i = 11; i >= 0; i--) {
        const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const monthKey = `${year}-${monthIndex}`;
        const monthNameShort = `${MONTHS_SHORT[monthIndex]} '${String(year).slice(-2)}`;
        const monthNameFull = `${MONTHS[monthIndex]} ${year}`;

        monthlyData[monthKey] = {
          month: monthNameShort,
          monthFull: monthNameFull,
          year: year,
          plasticos: 0,
          papel_carton: 0,
          organico: 0,
          otros: 0,
          descarte: 0,
          sortKey: `${year}-${String(monthIndex).padStart(2, '0')}`
        };
      }
    }

    collections.forEach(collection => {
      if (!collection.timeStamp && !collection.createdAt) return;

      const date = collection.timeStamp?.toDate ? collection.timeStamp.toDate() :
        collection.createdAt?.toDate ? collection.createdAt.toDate() :
          new Date(collection.timeStamp || collection.createdAt);

      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      // Filter based on selection
      if (selectedYear === "last_12_months") {
        const today = new Date();
        const currentDay = today.getDate();
        let referenceDate = new Date(today);

        // Same logic: if <= 25th, window ends last month
        if (currentDay <= 25) {
          referenceDate.setMonth(referenceDate.getMonth() - 1);
        }

        // Window start: 11 months before the reference month (total 12 months span)
        // Window end: End of reference month
        const windowStartDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 11, 1);
        // Set window end to the last millisecond of the reference month
        const windowEndDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);

        // Filter out dates outside this exact window
        if (date < windowStartDate || date > windowEndDate) return;
      } else {
        // Filter by selected year
        if (year !== selectedYear) return;
      }

      const monthKey = `${year}-${monthIndex}`;
      const monthNameShort = selectedYear === "last_12_months"
        ? `${MONTHS_SHORT[monthIndex]} '${String(year).slice(-2)}`
        : MONTHS[monthIndex];
      const monthNameFull = selectedYear === "last_12_months"
        ? `${MONTHS[monthIndex]} ${year}`
        : MONTHS[monthIndex];

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthNameShort,
          monthFull: monthNameFull,
          year: year,
          plasticos: 0,
          papel_carton: 0,
          organico: 0,
          otros: 0,
          descarte: 0,
          sortKey: `${year}-${String(monthIndex).padStart(2, '0')}`
        };
      }

      // Aggregate materials from collection
      if (collection.collections && Array.isArray(collection.collections)) {
        collection.collections.forEach(item => {
          const materialId = item.materialId?.toLowerCase() || '';
          const weight = Number(item.weight) || 0;

          // Map material to category
          if (materialId.includes('plastico')) {
            monthlyData[monthKey].plasticos += weight;
            totals.plasticos += weight;
          } else if (materialId.includes('papel') || materialId.includes('carton')) {
            monthlyData[monthKey].papel_carton += weight;
            totals.papel_carton += weight;
          } else if (materialId.includes('organico')) {
            monthlyData[monthKey].organico += weight;
            totals.organico += weight;
          } else if (materialId.includes('descarte')) {
            monthlyData[monthKey].descarte += weight;
            totals.descarte += weight;
          } else {
            monthlyData[monthKey].otros += weight;
            totals.otros += weight;
          }
        });
      }
    });

    // Convert to array and sort by date
    const dataArray = Object.values(monthlyData).sort((a, b) =>
      a.sortKey.localeCompare(b.sortKey)
    );

    return { monthlyData: dataArray, totals };
  };

  // Use edited data if available, otherwise use committed data, otherwise use original data
  const originalData = collections.length > 0 ? getMonthlyData() : { monthlyData: [], totals: {} };
  const monthlyData = editedMonthlyData.length > 0
    ? editedMonthlyData
    : (committedMonthlyData.length > 0 ? committedMonthlyData : originalData.monthlyData);

  // Recalculate totals from current monthlyData
  const totals = monthlyData.length > 0 ? {
    plasticos: monthlyData.reduce((sum, row) => sum + (row.plasticos || 0), 0),
    papel_carton: monthlyData.reduce((sum, row) => sum + (row.papel_carton || 0), 0),
    organico: monthlyData.reduce((sum, row) => sum + (row.organico || 0), 0),
    otros: monthlyData.reduce((sum, row) => sum + (row.otros || 0), 0),
    descarte: monthlyData.reduce((sum, row) => sum + (row.descarte || 0), 0)
  } : {};

  // Diversion rate: everything that isn't landfill (descarte), as a % of total weight
  const totalWeightForDiversion = (totals.plasticos || 0) + (totals.papel_carton || 0) +
    (totals.organico || 0) + (totals.otros || 0) + (totals.descarte || 0);
  const diversionRate = totalWeightForDiversion > 0
    ? Math.round(((totalWeightForDiversion - (totals.descarte || 0)) / totalWeightForDiversion) * 100)
    : null;
  const diversionColor = diversionRate === null ? '#6b7280'
    : diversionRate >= 75 ? '#16a34a'
    : diversionRate >= 50 ? '#d97706'
    : '#dc2626';

  // Unified color palette for all materials (provided palette)
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

  // Get pie chart data based on month selection
  const getPieChartData = () => {
    let data = {
      plasticos: 0,
      papel_carton: 0,
      organico: 0,
      otros: 0,
      descarte: 0
    };

    collections.forEach(collection => {
      if (!collection.timeStamp && !collection.createdAt) return;

      const date = collection.timeStamp?.toDate ? collection.timeStamp.toDate() :
        collection.createdAt?.toDate ? collection.createdAt.toDate() :
          new Date(collection.timeStamp || collection.createdAt);

      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      // Filter based on selection
      if (selectedYear === "last_12_months") {
        // Filter by past 12 months (including current month)
        const today = new Date();
        const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 12, 1);
        if (date < twelveMonthsAgo) return;
      } else {
        // Filter by selected year
        if (year !== selectedYear) return;
      }

      // Filter by selected month if provided
      if (selectedMonth !== '' && monthIndex !== parseInt(selectedMonth)) return;

      // Aggregate materials
      if (collection.collections && Array.isArray(collection.collections)) {
        collection.collections.forEach(item => {
          const materialId = item.materialId?.toLowerCase() || '';
          const weight = Number(item.weight) || 0;

          if (materialId.includes('plastico')) {
            data.plasticos += weight;
          } else if (materialId.includes('papel') || materialId.includes('carton')) {
            data.papel_carton += weight;
          } else if (materialId.includes('organico')) {
            data.organico += weight;
          } else if (materialId.includes('descarte')) {
            data.descarte += weight;
          } else {
            data.otros += weight;
          }
        });
      }
    });

    // Calculate total and convert to array format for pie chart
    const total = data.plasticos + data.papel_carton + data.organico + data.otros + data.descarte;

    if (total === 0) return [];

    const pieData = [
      {
        name: 'Plásticos (kg/mes)',
        value: data.plasticos,
        percentage: Math.round((data.plasticos / total) * 100),
        color: MATERIAL_PALETTE.plasticos.pie
      },
      {
        name: 'Papel y cartón (kg/mes)',
        value: data.papel_carton,
        percentage: Math.round((data.papel_carton / total) * 100),
        color: MATERIAL_PALETTE.papel_carton.pie
      },
      {
        name: 'Orgánicos (kg/mes)',
        value: data.organico,
        percentage: Math.round((data.organico / total) * 100),
        color: MATERIAL_PALETTE.organico.pie
      },
      {
        name: 'Otros (kg/mes)',
        value: data.otros,
        percentage: Math.round((data.otros / total) * 100),
        color: MATERIAL_PALETTE.otros.pie
      },
      {
        name: 'Descarte (kg/mes)',
        value: data.descarte,
        percentage: Math.round((data.descarte / total) * 100),
        color: MATERIAL_PALETTE.descarte.pie
      }
    ];

    // Filter out items with 0 value
    return pieData.filter(item => item.value > 0);
  };

  // Calculate pie chart data from monthlyData (which includes edits) instead of collections
  const getPieChartDataFromMonthly = () => {
    if (monthlyData.length === 0) return [];

    // Use totals calculated from monthlyData (which includes edited data)
    const total = totals.plasticos + totals.papel_carton + totals.organico + totals.otros + totals.descarte;

    if (total === 0) return [];

    const pieData = [
      {
        name: 'Plásticos (kg/mes)',
        value: totals.plasticos,
        percentage: Math.round((totals.plasticos / total) * 100),
        color: MATERIAL_PALETTE.plasticos.pie
      },
      {
        name: 'Papel y cartón (kg/mes)',
        value: totals.papel_carton,
        percentage: Math.round((totals.papel_carton / total) * 100),
        color: MATERIAL_PALETTE.papel_carton.pie
      },
      {
        name: 'Orgánicos (kg/mes)',
        value: totals.organico,
        percentage: Math.round((totals.organico / total) * 100),
        color: MATERIAL_PALETTE.organico.pie
      },
      {
        name: 'Otros (kg/mes)',
        value: totals.otros,
        percentage: Math.round((totals.otros / total) * 100),
        color: MATERIAL_PALETTE.otros.pie
      },
      {
        name: 'Descarte (kg/mes)',
        value: totals.descarte,
        percentage: Math.round((totals.descarte / total) * 100),
        color: MATERIAL_PALETTE.descarte.pie
      }
    ];

    return pieData.filter(item => item.value > 0);
  };

  const pieChartData = getPieChartDataFromMonthly();

  // Get chart title based on month selection
  const getChartTitle = () => {
    if (selectedYear === "last_12_months") {
      if (selectedMonth !== '') {
        return {
          main: '% CANTIDAD DE RESIDUOS',
          subtitle: `${MONTHS[parseInt(selectedMonth)]} (Últimos 12 Meses)`
        };
      }
      return {
        main: '% CANTIDAD DE RESIDUOS',
        subtitle: `ÚLTIMOS 12 MESES`
      };
    } else {
      if (selectedMonth !== '') {
        return {
          main: '% CANTIDAD DE RESIDUOS',
          subtitle: `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`
        };
      }
      return {
        main: '% CANTIDAD DE RESIDUOS',
        subtitle: `${selectedYear}`
      };
    }
  };

  // Header title for the report (above the table)
  const getReportHeaderTitle = () => {
    if (selectedYear === "last_12_months") {
      const suffix = selectedMonth !== ''
        ? `${MONTHS[parseInt(selectedMonth)]} (Últimos 12 Meses)`
        : `ÚLTIMOS 12 MESES`;
      return `INFORME GESTIÓN DE RESIDUOS - ${suffix}`;
    } else {
      const suffix = selectedMonth !== ''
        ? `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`
        : `${selectedYear}`;
      return `INFORME GESTIÓN DE RESIDUOS - ${suffix}`;
    }
  };

  // Custom label for pie chart
  const renderCustomLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percentage, value } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#000000"
        fontWeight="bold"
        fontSize="14"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${percentage}% (${Math.round(value).toLocaleString()} kg)`}
      </text>
    );
  };

  return (
    <NavigationWrapper>
      <div className="pt-12 w-full flex items-center justify-center">
        <div className="flex flex-col w-11/12 md:w-5/6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-5 items-center">
              <h1 className="text-3xl md:text-5xl text-black/70">Statistic Reports</h1>
              {loading && (
                <div className="w-10 h-10">
                  <Spinner />
                </div>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="w-full bg-white/20 border-[1px] border-black/40 rounded-3xl mt-8 shadow-xl shadow-black/30 p-5">
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr_0.8fr_1.5fr] gap-4 items-end">
              {/* Client Selector */}
              <div>
                <label htmlFor="client-select" className="text-black/70 font-semibold mb-2 block">
                  Cliente:
                </label>
                {loading ? (
                  <p className="text-black/50">Loading clients...</p>
                ) : (
                  <select
                    id="client-select"
                    value={selectedClient?.id || ''}
                    onChange={(e) => {
                      if (e.target.value === 'all_clients') {
                        setSelectedClient({ id: 'all_clients', client_name: 'Todos los Clientes' });
                      } else {
                        const client = clients.find(c => c.id === e.target.value);
                        setSelectedClient(client || null);
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-white/70 text-black border-2 border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer"
                  >
                    <option value="">-- Seleccionar cliente --</option>
                    <option value="all_clients">Todos los Clientes</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.client_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Year Selector */}
              <div>
                <label htmlFor="year-select" className="text-black/70 font-semibold mb-2 block">
                  Año:
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedYear(value === "last_12_months" ? value : Number(value));
                  }}
                  className="w-full p-3 rounded-xl bg-white/70 text-black border-2 border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer"
                >
                  <option value="last_12_months">Últimos 12 Meses</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selector (Optional) */}
              <div>
                <label htmlFor="month-select" className="text-black/70 font-semibold mb-2 block">
                  Mes: <span className="text-black/50 text-sm">(opcional)</span>
                </label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/70 text-black border-2 border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer"
                >
                  <option value="">-- Todos los meses --</option>
                  {MONTHS.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate / Export Buttons */}
              <div className="flex flex-col justify-end">
                <div className="flex space-x-2 flex-wrap gap-2 w-full">
                  <button
                    onClick={generateReport}
                    disabled={!selectedClient || collections.length === 0}
                    className="whitespace-nowrap bg-green-500/90 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white border border-green-600/30 rounded-xl px-4 py-3 shadow-sm font-semibold"
                    title="Obtener informe"
                  >
                    Obtener informe
                  </button>
                  <button
                    onClick={handleDedicatedPrint}
                    disabled={!reportGenerated}
                    className="whitespace-nowrap bg-white/90 hover:bg-white disabled:bg-gray-400 disabled:cursor-not-allowed text-black border border-black/30 rounded-xl p-3 shadow-sm"
                    title="Descargar PDF"
                  >
                    <ArrowDownTrayIcon className="h-6 w-6" />
                  </button>

                  {/* Edit mode buttons */}
                  {!isEditMode && reportGenerated && (
                    <button
                      onClick={handleEditMode}
                      className="whitespace-nowrap bg-blue-500/90 hover:bg-blue-600 text-white border border-blue-600/30 rounded-xl p-3 shadow-sm"
                      title="Editar datos del informe"
                    >
                      <PencilSquareIcon className="h-6 w-6" />
                    </button>
                  )}

                  {isEditMode && (
                    <>
                      <button
                        onClick={handleSaveChanges}
                        className="whitespace-nowrap bg-green-500/90 hover:bg-green-600 text-white border border-green-600/30 rounded-xl p-3 shadow-sm"
                        title="Guardar cambios"
                      >
                        <CheckIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="whitespace-nowrap bg-red-500/90 hover:bg-red-600 text-white border border-red-600/30 rounded-xl p-3 shadow-sm"
                        title="Cancelar edición"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Report content wrapper for PDF export */}
          {reportGenerated && (
            <div ref={reportRef} className="report-scope">
              <style>{`
              .report-scope th, .report-scope td { border-color: rgba(0,0,0,0.25) !important; }
              .report-scope .text-red-600 { color: #dc2626 !important; }
            `}</style>

              {/* Summary Paragraph */}
              {(aiSummary || editedSummary || committedSummary) && (
                <div className="w-full bg-white/90 border-[1px] border-black/40 rounded-3xl mt-8 mb-8 p-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  <h3 className="text-2xl font-bold mb-4 text-black/70" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Resumen Ejecutivo Producido con IA
                  </h3>
                  {isEditMode ? (
                    <textarea
                      value={editedSummary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      className="w-full p-3 border-2 border-blue-400 rounded-lg text-black/80 leading-relaxed text-justify resize-y min-h-[200px]"
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                      placeholder="Ingrese el resumen ejecutivo..."
                    />
                  ) : (
                    <p className="text-black/80 leading-relaxed whitespace-pre-line text-justify" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      {editedSummary || committedSummary || aiSummary}
                    </p>
                  )}
                </div>
              )}

              {/* Monthly Statistics Table */}
              {selectedClient && (
                <div className="flex flex-col w-full rounded-3xl mt-3 mb-8" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.4)' }}>
                  <div className="p-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.2)', backgroundColor: '#e5e7eb' }}>
                    <h2 className="text-2xl font-bold text-center" style={{ color: 'rgba(0,0,0,0.7)' }}>
                      {getReportHeaderTitle()}
                      {isEditMode && <span className="ml-3 text-blue-600 text-lg">(Modo Edición)</span>}
                    </h2>
                    <p className="text-center text-lg mt-2" style={{ color: 'rgba(0,0,0,0.6)' }}>
                      {selectedClient.client_name} - {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {loadingCollections && (
                      <div className="w-8 h-8 mt-2 mx-auto">
                        <Spinner />
                      </div>
                    )}
                  </div>

                  {!loadingCollections && collections.length === 0 && (
                    <div className="p-10 text-center text-black/50">
                      No collections found for this client.
                    </div>
                  )}

                  {!loadingCollections && collections.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr style={{ color: '#000000', backgroundColor: '#d1d5db' }}>
                            <th className="p-4 font-bold border border-gray-400 text-left">Fecha</th>
                            <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.plasticos.header }}>
                              Plásticos<br />(kg/mes)
                            </th>
                            <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.papel_carton.header }}>
                              Papel y cartón<br />(kg/mes)
                            </th>
                            <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.organico.header }}>
                              Orgánicos<br />(kg/mes)
                            </th>
                            <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.otros.header }}>
                              Otros<br />(kg/mes)
                            </th>
                            <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.descarte.header }}>
                              Descarte<br />(kg/mes)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyData.map((row, index) => (
                            <tr key={`${row.month}-${index}-${isEditMode ? 'edit' : 'view'}`} className="hover:bg-white/20 transition-colors">
                              <td className="p-3 border border-gray-400 font-semibold text-black">
                                {row.monthFull || row.month}
                              </td>
                              <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.plasticos.cell }}>
                                {isEditMode ? (
                                  <input
                                    type="number"
                                    value={parseFloat(row.plasticos.toFixed(1))}
                                    onChange={(e) => handleTableCellChange(index, 'plasticos', e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-500 rounded text-center bg-white font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    min="0"
                                    step="0.1"
                                  />
                                ) : (
                                  row.plasticos > 0 ? row.plasticos.toFixed(1) : 'SD'
                                )}
                              </td>
                              <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.papel_carton.cell }}>
                                {isEditMode ? (
                                  <input
                                    type="number"
                                    value={parseFloat(row.papel_carton.toFixed(1))}
                                    onChange={(e) => handleTableCellChange(index, 'papel_carton', e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-500 rounded text-center bg-white font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    min="0"
                                    step="0.1"
                                  />
                                ) : (
                                  row.papel_carton > 0 ? row.papel_carton.toFixed(1) : 'SD'
                                )}
                              </td>
                              <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.organico.cell }}>
                                {isEditMode ? (
                                  <input
                                    type="number"
                                    value={parseFloat(row.organico.toFixed(1))}
                                    onChange={(e) => handleTableCellChange(index, 'organico', e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-500 rounded text-center bg-white font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    min="0"
                                    step="0.1"
                                  />
                                ) : (
                                  row.organico > 0 ? row.organico.toFixed(1) : 'SD'
                                )}
                              </td>
                              <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.otros.cell }}>
                                {isEditMode ? (
                                  <input
                                    type="number"
                                    value={parseFloat(row.otros.toFixed(1))}
                                    onChange={(e) => handleTableCellChange(index, 'otros', e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-500 rounded text-center bg-white font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    min="0"
                                    step="0.1"
                                  />
                                ) : (
                                  row.otros > 0 ? row.otros.toFixed(1) : 'SD'
                                )}
                              </td>
                              <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.descarte.cell }}>
                                {isEditMode ? (
                                  <input
                                    type="number"
                                    value={parseFloat(row.descarte.toFixed(1))}
                                    onChange={(e) => handleTableCellChange(index, 'descarte', e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-500 rounded text-center bg-white font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    min="0"
                                    step="0.1"
                                  />
                                ) : (
                                  row.descarte > 0 ? row.descarte.toFixed(1) : 'SD'
                                )}
                              </td>
                            </tr>
                          ))}
                          {/* Totals Row */}
                          <tr className="bg-gray-200 font-bold">
                            <td className="p-3 border border-gray-400 text-black">
                              TOTAL {selectedYear === "last_12_months" ? "ÚLTIMOS 12 MESES" : selectedYear}
                            </td>
                            <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.plasticos.cell }}>
                              {totals.plasticos > 0 ? totals.plasticos.toFixed(1) : 'SD'}
                            </td>
                            <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.papel_carton.cell }}>
                              {totals.papel_carton > 0 ? totals.papel_carton.toFixed(1) : 'SD'}
                            </td>
                            <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.organico.cell }}>
                              {totals.organico > 0 ? totals.organico.toFixed(1) : 'SD'}
                            </td>
                            <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.otros.cell }}>
                              {totals.otros > 0 ? totals.otros.toFixed(1) : 'SD'}
                            </td>
                            <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.descarte.cell }}>
                              {totals.descarte > 0 ? totals.descarte.toFixed(1) : 'SD'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

                            {/* Diversion Rate KPI */}
              {selectedClient && collections.length > 0 && diversionRate !== null && (
                <div className="flex flex-col items-center justify-center w-full mt-4 mb-4 p-6 rounded-3xl" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.4)' }}>
                  <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'rgba(0,0,0,0.6)' }}>
                    {language === 'es' ? 'Tasa de Desvío' : 'Diversion Rate'}
                  </span>
                  <span className="text-6xl font-extrabold mt-1" style={{ color: diversionColor }}>
                    {diversionRate}%
                  </span>
                  <span className="text-xs mt-1" style={{ color: 'rgba(0,0,0,0.5)' }}>
                    {language === 'es'
                      ? 'del peso total desviado del relleno sanitario'
                      : 'of total weight diverted from landfill'}
                  </span>
                </div>
              )}

              {/* Charts Section: Pie and Bar charts together */}
              {selectedClient && collections.length > 0 && pieChartData.length > 0 && monthlyData.length > 0 && (
                <div>
                  <div className="flex flex-col md:flex-row flex-wrap items-start justify-between w-full mt-4 mb-8 gap-y-4 md:gap-x-0 md:gap-y-1">
                    {/* Pie Chart */}
                    <div className="w-full md:w-[49%] p-3 rounded-3xl" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.4)', height: isMobile ? '480px' : '720px' }}>
                      <div className="text-center mb-2">
                        <h3 className="text-2xl font-bold" style={{ color: 'rgba(0,0,0,0.7)' }}>
                          {getChartTitle().main}
                        </h3>
                        <p className="text-2xl font-bold mt-1" style={{ color: '#dc2626' }}>
                          {getChartTitle().subtitle}
                        </p>
                      </div>
                      <ResponsiveContainer width="100%" height="90%">
                        {(() => {
                          // Rearrange pie chart data to alternate large/small slices (same as PDF)
                          const sortedBySize = [...pieChartData].sort((a, b) => b.value - a.value);
                          const rearrangedPieData = [];
                          let frontIndex = 0;
                          let backIndex = sortedBySize.length - 1;
                          while (frontIndex <= backIndex) {
                            if (frontIndex <= backIndex) {
                              rearrangedPieData.push(sortedBySize[frontIndex]);
                              frontIndex++;
                            }
                            if (frontIndex <= backIndex) {
                              rearrangedPieData.push(sortedBySize[backIndex]);
                              backIndex--;
                            }
                          }
                          return (
                            <PieChart>
                              <Pie
                                data={rearrangedPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={renderCustomLabel}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {rearrangedPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Legend
                                verticalAlign="bottom"
                                height={64}
                                wrapperStyle={{ paddingTop: 10, marginTop: 16 }}
                                formatter={(value, entry) => (
                                  <span style={{ color: '#000000' }}>
                                    {value}
                                  </span>
                                )}
                              />
                              <Tooltip
                                formatter={(value, name) => [
                                  `${Math.round(value).toLocaleString()} kg`,
                                  name
                                ]}
                              />
                            </PieChart>
                          );
                        })()}
                      </ResponsiveContainer>
                    </div>

                    {/* Bar Chart - Gestión Residuos (stacked) */}
                    <div className="w-full md:w-[49%] p-3 rounded-3xl" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.4)', height: isMobile ? '480px' : '720px' }}>
                      <div className="text-center mb-8">
                        <span className="text-2xl font-bold mr-2" style={{ color: '#dc2626' }}>{selectedYear === "last_12_months" ? "ÚLTIMOS 12 MESES" : selectedYear}</span>
                        <span className="text-2xl font-bold" style={{ color: 'rgba(0,0,0,0.7)' }}>GESTIÓN RESIDUOS</span>
                      </div>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 20, bottom: 50 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" angle={-45} textAnchor="end" interval={0} height={70} />
                          <YAxis />
                          <Tooltip formatter={(value) => `${Math.round(value).toLocaleString()} kg`} />
                          <Legend
                            verticalAlign="bottom"
                            height={44}
                            align="center"
                            wrapperStyle={{ paddingTop: 40, marginTop: 16 }}
                            formatter={(value, entry) => (
                              <span style={{ color: '#000000' }}>
                                {value}
                              </span>
                            )}
                          />
                          <Bar dataKey="plasticos" name="Plásticos (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.plasticos.bar} />
                          <Bar dataKey="papel_carton" name="Papel y cartón (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.papel_carton.bar} />
                          <Bar dataKey="organico" name="Orgánicos (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.organico.bar} />
                          <Bar dataKey="otros" name="Otros (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.otros.bar} />
                          <Bar dataKey="descarte" name="Descarte (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.descarte.bar} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer with SCU Logo */}
              <div className="w-full mt-12 mb-4 pr-5 flex items-center justify-end gap-1" style={{ pageBreakInside: 'avoid' }}>
                <img
                  src="/scu_logo.png"
                  alt="SCU Logo"
                  className="w-8 h-8 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="flex flex-col items-start mt-0.5">
                  <span className="text-xs text-black/70 font-medium leading-tight">powered by</span>
                  <span className="text-sm text-black/70 font-medium leading-tight">Santa Clara University</span>
                </div>
              </div>
            </div>
          )}

          {!selectedClient && !loading && (
            <div className="flex flex-col w-full bg-white/20 border-[1px] border-black/40 rounded-3xl mt-8 mb-32 shadow-xl shadow-black/30 p-10">
              <p className="text-black/50 text-center">
                Please select a client to view their collection data.
              </p>
            </div>
          )}
        </div>
      </div>
    </NavigationWrapper>
  )
}


export default StatisticReports