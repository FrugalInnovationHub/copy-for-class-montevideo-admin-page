import React, { useEffect, useState, useRef } from 'react'
import NavigationWrapper from '../components/Navigation/NavigationWrapper';
import { getClients, getCollectionsByClientId } from '../api/calls';
import Spinner from '../components/Navigation/Spinner';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useReactToPrint } from 'react-to-print';

const StatisticReports = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const handlePrint = () => {
    window.print();
  };

  const reportRef = useRef(null);
  const handlePrintReport = useReactToPrint({
    content: () => reportRef.current,
    contentRef: reportRef,
    documentTitle: () => {
      const monthPart = selectedMonth !== '' ? `_${String(parseInt(selectedMonth) + 1).padStart(2, '0')}` : '';
      return `informe_residuos_${selectedYear}${monthPart}`;
    },
    pageStyle: `@page { size: A4 landscape; margin: 10mm; } 
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #ffffff; }
                .no-print { display: none !important; }`
  });

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
        return;
      }

      try {
        setLoadingCollections(true);
        const data = await getCollectionsByClientId(selectedClient.id);
        setCollections(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCollections(false);
      }
    };
    fetchCollections();
  }, [selectedClient]);

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

    collections.forEach(collection => {
      if (!collection.timeStamp && !collection.createdAt) return;
      
      const date = collection.timeStamp?.toDate ? collection.timeStamp.toDate() : 
                   collection.createdAt?.toDate ? collection.createdAt.toDate() : 
                   new Date(collection.timeStamp || collection.createdAt);
      
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      
      // Filter by selected year
      if (year !== selectedYear) return;
      
      const monthKey = `${year}-${monthIndex}`;
      const monthName = MONTHS[monthIndex];

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
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

  const { monthlyData, totals } = collections.length > 0 ? getMonthlyData() : { monthlyData: [], totals: {} };

  // Unified color palette for all materials (provided palette)
  const MATERIAL_PALETTE = {
    // Lighter tints for TABLE headers and cells; solid colors kept for charts
    plasticos: {
      header: 'rgba(224,190,121,0.20)',
      cell: 'rgba(224,190,121,0.12)',
      pie: '#E0BE79',
      bar: '#E0BE79'
    }, // Burlywood
    papel_carton: {
      header: 'rgba(50,68,82,0.18)',
      cell: 'rgba(50,68,82,0.10)',
      pie: '#324452',
      bar: '#324452'
    }, // Charcoal
    organico: {
      header: 'rgba(82,117,103,0.18)',
      cell: 'rgba(82,117,103,0.10)',
      pie: '#527567',
      bar: '#527567'
    }, // Hooker's Green
    otros: {
      header: 'rgba(132,86,55,0.18)',
      cell: 'rgba(132,86,55,0.10)',
      pie: '#845637',
      bar: '#845637'
    }, // Milk Chocolate
    descarte: {
      header: 'rgba(240,218,166,0.25)',
      cell: 'rgba(240,218,166,0.12)',
      pie: '#F0DAA6',
      bar: '#F0DAA6'
    }, // Deep Champagne
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
      
      // Filter by selected year
      if (year !== selectedYear) return;
      
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

  const pieChartData = collections.length > 0 ? getPieChartData() : [];

  // Get chart title based on month selection
  const getChartTitle = () => {
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
  };

  // Header title for the report (above the table)
  const getReportHeaderTitle = () => {
    const suffix = selectedMonth !== ''
      ? `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`
      : `${selectedYear}`;
    return `INFORME GESTIÓN DE RESIDUOS - ${suffix}`;
  };

  // Custom label for pie chart
  const renderCustomLabel = (entry) => {
    return `${entry.name} ${entry.percentage}% (${Math.round(entry.value).toLocaleString()} kg)`;
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
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
                      const client = clients.find(c => c.id === e.target.value);
                      setSelectedClient(client || null);
                    }}
                    className="w-full p-3 rounded-xl bg-white/70 text-black border-2 border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer"
                  >
                    <option value="">-- Seleccionar cliente --</option>
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
                  Año: <span className="text-red-500">*</span>
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-white/70 text-black border-2 border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer"
                >
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

              {/* Print / Export Buttons */}
              <div className="flex md:justify-end">
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrint}
                    className="whitespace-nowrap bg-white/90 hover:bg-white text-black border border-black/30 rounded-xl px-4 py-2 shadow-sm"
                    title="Imprimir (guardar como PDF)"
                  >
                    Imprimir
                  </button>
                  <button
                    onClick={handlePrintReport}
                    className="whitespace-nowrap bg-white/90 hover:bg-white text-black border border-black/30 rounded-xl px-4 py-2 shadow-sm"
                    title="Exportar PDF (1 página)"
                  >
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report content wrapper for PDF export */}
          <div ref={reportRef} className="report-scope">
            <style>{`
              .report-scope th, .report-scope td { border-color: rgba(0,0,0,0.25) !important; }
              .report-scope .text-red-600 { color: #dc2626 !important; }
            `}</style>
          {/* Report Header (with logo) */}
          {selectedClient && (
            <div className="w-full bg-white border rounded-3xl mt-8 p-5 flex items-center space-x-4" style={{ borderColor: 'rgba(0,0,0,0.4)' }}>
              <img src="/logo.jpg" alt="logo" className="h-24 w-24 object-contain" />
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'rgba(0,0,0,0.7)' }}>
                {getReportHeaderTitle()}
              </h2>
            </div>
          )}

          {/* Monthly Statistics Table */}
          {selectedClient && (
            <div className="flex flex-col w-full rounded-3xl mt-8 mb-32" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.4)' }}>
              <div className="p-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.2)', backgroundColor: '#e5e7eb' }}>
                <h2 className="text-2xl font-bold text-center" style={{ color: 'rgba(0,0,0,0.7)' }}>
                  RESIDUOS - {selectedClient.client_name}
                </h2>
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
                          Plásticos<br/>(kg/mes)
                        </th>
                        <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.papel_carton.header }}>
                          Papel y cartón<br/>(kg/mes)
                        </th>
                        <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.organico.header }}>
                          Orgánicos<br/>(kg/mes)
                        </th>
                        <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.otros.header }}>
                          Otros<br/>(kg/mes)
                        </th>
                        <th className="p-4 font-bold border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.descarte.header }}>
                          Descarte<br/>(kg/mes)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((row, index) => (
                        <tr key={index} className="hover:bg-white/20 transition-colors">
                          <td className="p-3 border border-gray-400 font-semibold text-black">
                            {row.month}
                          </td>
                          <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.plasticos.cell }}>
                            {row.plasticos > 0 ? Math.round(row.plasticos).toLocaleString() : 'SD'}
                          </td>
                          <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.papel_carton.cell }}>
                            {row.papel_carton > 0 ? Math.round(row.papel_carton).toLocaleString() : 'SD'}
                          </td>
                          <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.organico.cell }}>
                            {row.organico > 0 ? Math.round(row.organico).toLocaleString() : 'SD'}
                          </td>
                          <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.otros.cell }}>
                            {row.otros > 0 ? Math.round(row.otros).toLocaleString() : 'SD'}
                          </td>
                          <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.descarte.cell }}>
                            {row.descarte > 0 ? Math.round(row.descarte).toLocaleString() : 'SD'}
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-gray-200 font-bold">
                        <td className="p-3 border border-gray-400 text-black">
                          TOTAL {selectedYear}
                        </td>
                        <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.plasticos.cell }}>
                          {totals.plasticos > 0 ? Math.round(totals.plasticos).toLocaleString() : 'SD'}
                        </td>
                        <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.papel_carton.cell }}>
                          {totals.papel_carton > 0 ? Math.round(totals.papel_carton).toLocaleString() : 'SD'}
                        </td>
                        <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.organico.cell }}>
                          {totals.organico > 0 ? Math.round(totals.organico).toLocaleString() : 'SD'}
                        </td>
                        <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.otros.cell }}>
                          {totals.otros > 0 ? Math.round(totals.otros).toLocaleString() : 'SD'}
                        </td>
                        <td className="p-3 border border-gray-400 text-center" style={{ backgroundColor: MATERIAL_PALETTE.descarte.cell }}>
                          {totals.descarte > 0 ? Math.round(totals.descarte).toLocaleString() : 'SD'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Pie Chart */}
          {selectedClient && collections.length > 0 && pieChartData.length > 0 && (
            <div className="flex flex-col w-full rounded-3xl mt-8 mb-32 p-8" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.4)' }}>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold" style={{ color: 'rgba(0,0,0,0.7)' }}>
                  {getChartTitle().main}
                </h3>
                <p className="text-2xl font-bold mt-1" style={{ color: '#dc2626' }}>
                  {getChartTitle().subtitle}
                </p>
              </div>
              
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    labelLine={true}
                    label={renderCustomLabel}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: '#374151', fontWeight: 500 }}>
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
              </ResponsiveContainer>
            </div>
          )}
          </div>

          {/* Bar Chart - Gestión Residuos (stacked) */}
          {selectedClient && monthlyData.length > 0 && (
            <div className="flex flex-col w-full rounded-3xl mt-8 mb-32 p-8" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.4)' }}>
              <div className="text-center mb-2">
                <span className="text-2xl font-bold mr-2" style={{ color: '#dc2626' }}>{selectedYear}</span>
                <span className="text-2xl font-bold" style={{ color: 'rgba(0,0,0,0.7)' }}>GESTIÓN RESIDUOS</span>
              </div>
              <ResponsiveContainer width="100%" height={520}>
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" interval={0} height={70} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Math.round(value).toLocaleString()} kg`} />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center" 
                    wrapperStyle={{ paddingTop: 24 }}
                    formatter={(value) => `${value}`} 
                  />
                  <Bar dataKey="plasticos" name="Plásticos (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.plasticos.bar} />
                  <Bar dataKey="papel_carton" name="Papel y cartón (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.papel_carton.bar} />
                  <Bar dataKey="organico" name="Orgánicos (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.organico.bar} />
                  <Bar dataKey="otros" name="Otros (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.otros.bar} />
                  <Bar dataKey="descarte" name="Descarte (kg/mes)" stackId="a" fill={MATERIAL_PALETTE.descarte.bar} />
                </BarChart>
              </ResponsiveContainer>
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

