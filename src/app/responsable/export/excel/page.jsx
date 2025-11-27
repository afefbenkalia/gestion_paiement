'use client';

import { useEffect, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet } from 'lucide-react';

export default function ExportExcelPage() {
  const [type, setType] = useState('ALL');
  const [statut, setStatut] = useState('ALL');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [q, setQ] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paramsString = useMemo(() => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (statut) params.set('statut', statut);
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    if (q) params.set('q', q);
    return params.toString();
  }, [type, statut, start, end, q]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/responsable/fiche/export?${paramsString}`);
      if (!res.ok) throw new Error('Erreur de chargement');
      const json = await res.json();
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les fiches");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  const downloadExcel = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams(paramsString);
      params.set('format', 'xlsx');
      const res = await fetch(`/api/responsable/fiche/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fiches.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Impossible d'exporter le fichier XLSX");
    } finally {
      setDownloading(false);
    }
  };

  const downloadFicheExcel = async (ficheId) => {
    try {
      const res = await fetch(`/api/responsable/fiche/${ficheId}/excel`);
      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();

      // Try to use server-provided filename from Content-Disposition
      const cd = res.headers.get('Content-Disposition') || '';
      const extractFilename = (header) => {
        // Supports filename*="UTF-8''..." and filename="..."
        let m = header.match(/filename\*=UTF-8''([^;\n\r]+)/i);
        if (m && m[1]) {
          try { return decodeURIComponent(m[1]); } catch { return m[1]; }
        }
        m = header.match(/filename="?([^";\n\r]+)"?/i);
        return m && m[1] ? m[1] : '';
      };

      // Fallback: build from current row data if header missing
      const sanitize = (name) => {
        if (!name) return 'fichier';
        // Remove diacritics, replace invalid chars, collapse spaces/underscores
        const noDiacritics = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return noDiacritics
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\s/g, '_');
      };

      let filename = extractFilename(cd);
      if (filename) {
        filename = sanitize(filename);
      } else {
        const row = rows.find((r) => r.id === ficheId);
        const titre = row?.session?.titre || `fiche_${ficheId}`;
        const type = (row?.typeFiche || '').toLowerCase() || 'fiche';
        filename = `${sanitize(titre)}_${type}.xlsx`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Impossible d'exporter la fiche XLSX");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export Excel</h1>
        <p className="text-gray-600">Exporter les fiches de paie au format Excel</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="ALL">Tous</option>
              <option value="FORMATION">Formation</option>
              <option value="COORDINATION">Coordination</option>
              <option value="REGLEMENT">Règlement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut session</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="ALL">Tous</option>
              <option value="COMPLET">Complet</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input type="text" placeholder="Mémoire, session, intervenant..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {loading ? 'Chargement…' : `${rows.length} fiche(s)`}
            {error ? ` — ${error}` : ''}
          </p>
          <button onClick={downloadExcel} disabled={downloading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
            {downloading ? 'Export en cours…' : 'Exporter en Excel'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Liste des fiches</h2>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Chargement…</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Aucune fiche trouvée</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actions</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>N° Mémoire</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Intervenant</TableHead>
                  <TableHead>Brut</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <button
                        onClick={() => downloadFicheExcel(f.id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Exporter en Excel"
                      >
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      </button>
                    </TableCell>
                    <TableCell>{f.id}</TableCell>
                    <TableCell>{f.typeFiche}</TableCell>
                    <TableCell className="font-mono">{f.numMemoire}</TableCell>
                    <TableCell>{f.session ? `${f.session.id} - ${f.session.titre || ''}` : ''}</TableCell>
                    <TableCell>{f.periode || ''}</TableCell>
                    <TableCell>{f.formateur?.name || f.coordinateur?.name || ''}</TableCell>
                    <TableCell>{Number(f.montantTotalBrut || 0).toFixed(2)}</TableCell>
                    <TableCell>{Number(f.montantTotalNet || 0).toFixed(2)}</TableCell>
                    <TableCell>{f.session?.statut || ''}</TableCell>
                    <TableCell>{f.createdAt ? new Date(f.createdAt).toLocaleString('fr-FR') : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

