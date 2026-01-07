import React, { useState } from 'react';

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
  filename: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExportCSV,
  onExportPDF,
  onExportExcel,
  disabled = false,
  filename
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: string, exportFn: () => void) => {
    setExporting(format);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      exportFn();
      setIsOpen(false);
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      alert(`Error al exportar a ${format}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-lg">download</span>
        <span>Exportar</span>
        <span className="material-symbols-outlined">expand_more</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => handleExport('csv', onExportCSV)}
              disabled={exporting !== null}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-green-600">description</span>
              <span>CSV</span>
              {exporting === 'csv' && <span className="material-symbols-outlined ml-auto animate-spin">refresh</span>}
            </button>
            <button
              onClick={() => handleExport('pdf', onExportPDF)}
              disabled={exporting !== null}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-red-600">picture_as_pdf</span>
              <span>PDF</span>
              {exporting === 'pdf' && <span className="material-symbols-outlined ml-auto animate-spin">refresh</span>}
            </button>
            <button
              onClick={() => handleExport('excel', onExportExcel)}
              disabled={exporting !== null}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-green-700">table_view</span>
              <span>Excel</span>
              {exporting === 'excel' && <span className="material-symbols-outlined ml-auto animate-spin">refresh</span>}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
