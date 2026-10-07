import React, { useState, useMemo } from 'react';
import { Election, Candidate, Vote, User, Organization } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DownloadIcon, XCircleIcon, CheckCircleIcon, ShieldCheckIcon } from './icons';

interface ActaCierreEscrutinioModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: Election;
  organization: Organization;
  candidates: Candidate[];
  votes: Vote[];
  users: User[];
}

export const ActaCierreEscrutinioModal: React.FC<ActaCierreEscrutinioModalProps> = ({
  isOpen,
  onClose,
  election,
  organization,
  candidates,
  votes,
  users,
}) => {
  const [juries, setJuries] = useState<string>('Comité Electoral Estudiantil / Jurados de Mesa');
  const [witnesses, setWitnesses] = useState<string>('Testigos Electorales Acreditados');
  const [observations, setObservations] = useState<string>(
    'La jornada comicial digital se desarrolló con total normalidad, garantizando el sufragio secreto, individual e inalterable.'
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // 1. Tally & Census Calculations
  const metrics = useMemo(() => {
    const studentVoters = users.filter(
      (u) =>
        (u.organizationId === organization.id || !u.organizationId) &&
        (u.rol === 'Estudiante' || u.role === 'STUDENT')
    );
    const totalCensus = studentVoters.length;

    const electionVotes = votes.filter(
      (v) => v.eleccion_id === election.id || v.electionId === election.id
    );
    const totalBallotsCast = electionVotes.length;

    const participatingStudents = studentVoters.filter(
      (u) => u.ha_votado?.includes(election.id) || u.hasVoted?.[election.id]
    ).length;

    // Nivelación: check if voter participation count equals total ballots deposited in digital ballot box
    const reconciliationDifference = totalBallotsCast - participatingStudents;
    const isReconciled = reconciliationDifference === 0;

    const candidateCounts: Record<string, number> = {};
    const relevantCandidates = candidates.filter(
      (c) => c.eleccion_id === election.id || c.electionId === election.id
    );

    relevantCandidates.forEach((c) => {
      candidateCounts[c.id] = 0;
    });

    let blankVotes = 0;
    const writeInCounts: Record<string, number> = {};

    electionVotes.forEach((vote) => {
      const candId = vote.candidato_id || vote.candidateId;
      if (candId && candidateCounts.hasOwnProperty(candId)) {
        candidateCounts[candId]++;
      } else if (vote.write_in_name) {
        const name = vote.write_in_name.trim().toUpperCase();
        writeInCounts[name] = (writeInCounts[name] || 0) + 1;
      } else {
        blankVotes++;
      }
    });

    const rankedCandidates = relevantCandidates
      .map((c) => {
        const count = candidateCounts[c.id] || 0;
        const percentage =
          totalBallotsCast > 0 ? ((count / totalBallotsCast) * 100).toFixed(2) : '0.00';
        return {
          ...c,
          fullName: `${c.nombres || c.name || ''} ${c.apellido || ''}`.trim(),
          party: c.partido_politico || c.party || 'Independiente',
          count,
          percentage: Number(percentage),
        };
      })
      .sort((a, b) => b.count - a.count);

    const winner =
      rankedCandidates.length > 0 && rankedCandidates[0].count > 0 ? rankedCandidates[0] : null;
    const turnoutPercentage =
      totalCensus > 0 ? ((participatingStudents / totalCensus) * 100).toFixed(2) : '0.00';
    const abstentionPercentage =
      totalCensus > 0
        ? (((totalCensus - participatingStudents) / totalCensus) * 100).toFixed(2)
        : '0.00';

    return {
      totalCensus,
      totalBallotsCast,
      participatingStudents,
      reconciliationDifference,
      isReconciled,
      rankedCandidates,
      blankVotes,
      blankPercentage:
        totalBallotsCast > 0 ? ((blankVotes / totalBallotsCast) * 100).toFixed(2) : '0.00',
      writeInCounts,
      winner,
      turnoutPercentage,
      abstentionPercentage,
    };
  }, [election, organization, candidates, votes, users]);

  if (!isOpen) return null;

  // 2. Vectorized PDF Generation with jsPDF & AutoTable
  const handleGeneratePDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      // Header Banner
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, pageWidth, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(organization.name.toUpperCase(), pageWidth / 2, 10, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'SISTEMA ELECTORAL ESCOLAR - ACTA OFICIAL DE CIERRE Y ESCRUTINIO',
        pageWidth / 2,
        17,
        { align: 'center' }
      );

      // Election Title & Legal Preamble
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`ELECCIÓN: ${election.nombre || election.title}`, margin, 32);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const fechaCierre = new Date().toLocaleString('es-ES', {
        dateStyle: 'full',
        timeStyle: 'short',
      });
      doc.text(`Fecha y Hora de Cierre de Escrutinio: ${fechaCierre}`, margin, 37);
      doc.text(
        `Código de Auditoría Institucional: ${(organization.slug || organization.id).toUpperCase()}-${election.id}`,
        margin,
        42
      );

      // Section 1: Cuadre de Urna y Nivelación Electoral
      autoTable(doc, {
        startY: 46,
        head: [['CONCEPTO DE CONTROL ELECTORAL', 'VALOR', 'PORCENTAJE']],
        body: [
          ['Censo Electoral Total (Estudiantes Habilitados)', metrics.totalCensus.toString(), '100.00%'],
          ['Total Sufragantes Registrados en Padrón', metrics.participatingStudents.toString(), `${metrics.turnoutPercentage}%`],
          ['Total Votos Depositados en Urna Digital', metrics.totalBallotsCast.toString(), `${metrics.turnoutPercentage}%`],
          ['Abstencionismo Electoral', (metrics.totalCensus - metrics.participatingStudents).toString(), `${metrics.abstentionPercentage}%`],
          [
            'Nivelación de Mesa (Diferencia Sufragantes vs. Urna)',
            metrics.reconciliationDifference.toString(),
            metrics.isReconciled ? 'CONCILIADO EXACTO' : 'DESCUADRE DETECTADO',
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { cellPadding: 2.5 },
      });

      // Section 2: Resultados del Escrutinio por Candidatura
      const candidateRows = metrics.rankedCandidates.map((c, index) => [
        (index + 1).toString(),
        c.fullName,
        c.party,
        c.count.toString(),
        `${c.percentage.toFixed(2)}%`,
      ]);

      candidateRows.push([
        '-',
        'VOTO EN BLANCO',
        'Voto Institucional',
        metrics.blankVotes.toString(),
        `${metrics.blankPercentage}%`,
      ]);

      Object.entries(metrics.writeInCounts).forEach(([name, count]) => {
        const perc =
          metrics.totalBallotsCast > 0
            ? ((count / metrics.totalBallotsCast) * 100).toFixed(2)
            : '0.00';
        candidateRows.push(['-', `VOTO CONSIGNADO: ${name}`, 'Voto Escrito', count.toString(), `${perc}%`]);
      });

      const lastTableY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : 95;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('DISCRIMINACIÓN Y ESCRUTINIO DE VOTOS VÁLIDOS', margin, lastTableY);

      autoTable(doc, {
        startY: lastTableY + 2,
        head: [['#', 'CANDIDATO / OPCIÓN', 'MOVIMIENTO O LISTA', 'VOTOS', 'PORCENTAJE']],
        body: candidateRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        styles: { cellPadding: 2.5 },
      });

      // Section 3: Proclamación Oficial y Constancias
      const proclamationY = (doc as any).lastAutoTable?.finalY
        ? (doc as any).lastAutoTable.finalY + 7
        : 160;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('PROCLAMACIÓN DE RESULTADOS:', margin, proclamationY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const winnerText = metrics.winner
        ? `De conformidad con el escrutinio, se declara ELECTO/A a ${metrics.winner.fullName} (${metrics.winner.party}) con un total de ${metrics.winner.count} votos (${metrics.winner.percentage}%).`
        : 'No se registran votos emitidos o la elección culminó sin sufragios para proclamación.';
      doc.text(winnerText, margin, proclamationY + 5);

      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES DE LA COMISIÓN ELECTORAL:', margin, proclamationY + 11);
      doc.setFont('helvetica', 'normal');
      const obsLines = doc.splitTextToSize(
        observations || 'Sin observaciones registradas.',
        pageWidth - margin * 2
      );
      doc.text(obsLines, margin, proclamationY + 15);

      // Section 4: Firmas de Jurados y Testigos Electorales
      const signaturesY = Math.max(proclamationY + 28, 230);
      const colWidth = (pageWidth - margin * 2) / 3;

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);

      // Sign 1: Rector / Autoridad
      doc.line(margin, signaturesY + 12, margin + colWidth - 8, signaturesY + 12);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Rectoría / Autoridad Electoral', margin, signaturesY + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(organization.name, margin, signaturesY + 20);

      // Sign 2: Jurados de Votación
      doc.line(margin + colWidth, signaturesY + 12, margin + colWidth * 2 - 8, signaturesY + 12);
      doc.setFont('helvetica', 'bold');
      doc.text('Jurado de Mesa / Comisión Escrutadora', margin + colWidth, signaturesY + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(juries, margin + colWidth, signaturesY + 20);

      // Sign 3: Testigos Electorales
      doc.line(margin + colWidth * 2, signaturesY + 12, margin + colWidth * 3 - 8, signaturesY + 12);
      doc.setFont('helvetica', 'bold');
      doc.text('Testigo Electoral / Veedor', margin + colWidth * 2, signaturesY + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(witnesses, margin + colWidth * 2, signaturesY + 20);

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Este documento constituye el acta oficial e inalterable de escrutinio escolar emitida por la plataforma SIVES.',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );

      doc.save(`acta-escrutinio-${organization.slug || organization.id}-${election.id}.pdf`);
    } catch (err) {
      console.error('Error generando acta en PDF:', err);
      alert('Ocurrió un error al compilar el PDF del acta oficial.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Acta Oficial de Cierre y Escrutinio</h2>
              <p className="text-sm text-slate-500">
                {election.nombre || election.title} — {organization.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
            aria-label="Cerrar modal"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Reconciliation Status Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              metrics.isReconciled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {metrics.isReconciled ? (
                <CheckCircleIcon className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-amber-600 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-slate-900">
                  {metrics.isReconciled
                    ? 'Cuadre de Urna Válido (Nivelación 100%)'
                    : 'Descuadre en Nivelación de Mesa'}
                </h4>
                <p className="text-xs text-slate-600">
                  Total Sufragantes ({metrics.participatingStudents}) vs. Total Votos en Urna (
                  {metrics.totalBallotsCast}). Diferencia: {metrics.reconciliationDifference}.
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                metrics.isReconciled ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
              }`}
            >
              {metrics.isReconciled ? 'CONCILIADO' : 'OBSERVADO'}
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500">Censo Habilitado</span>
              <p className="text-lg font-bold text-slate-800">{metrics.totalCensus}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500">Participación</span>
              <p className="text-lg font-bold text-slate-800">{metrics.turnoutPercentage}%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500">Abstención</span>
              <p className="text-lg font-bold text-slate-800">{metrics.abstentionPercentage}%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500">Total Votos Emitidos</span>
              <p className="text-lg font-bold text-slate-800">{metrics.totalBallotsCast}</p>
            </div>
          </div>

          {/* Candidate Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Cuadro de Escrutinio por Candidato</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs">
                  <tr>
                    <th className="py-2.5 px-3 text-left">#</th>
                    <th className="py-2.5 px-3 text-left">Candidato</th>
                    <th className="py-2.5 px-3 text-left">Partido / Lista</th>
                    <th className="py-2.5 px-3 text-right">Votos</th>
                    <th className="py-2.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {metrics.rankedCandidates.map((c, i) => (
                    <tr
                      key={c.id}
                      className={i === 0 && c.count > 0 ? 'bg-emerald-50/50 font-medium' : ''}
                    >
                      <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-3 text-slate-900">{c.fullName}</td>
                      <td className="py-2 px-3 text-slate-500">{c.party}</td>
                      <td className="py-2 px-3 text-right text-slate-900 font-semibold">{c.count}</td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {c.percentage.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 px-3 text-slate-400">-</td>
                    <td className="py-2 px-3 text-slate-700">Voto en Blanco</td>
                    <td className="py-2 px-3 text-slate-400">Institucional</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-semibold">
                      {metrics.blankVotes}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {metrics.blankPercentage}%
                    </td>
                  </tr>
                  {Object.entries(metrics.writeInCounts).map(([name, count]) => {
                    const perc =
                      metrics.totalBallotsCast > 0
                        ? ((count / metrics.totalBallotsCast) * 100).toFixed(2)
                        : '0.00';
                    return (
                      <tr key={name}>
                        <td className="py-2 px-3 text-slate-400">-</td>
                        <td className="py-2 px-3 text-slate-700">Voto Consignado: {name}</td>
                        <td className="py-2 px-3 text-slate-400">Escrito</td>
                        <td className="py-2 px-3 text-right text-slate-700 font-semibold">{count}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{perc}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Signatories Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jurados de Votación / Mesa
              </label>
              <input
                type="text"
                value={juries}
                onChange={(e) => setJuries(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Testigos Electorales / Veedores
              </label>
              <input
                type="text"
                value={witnesses}
                onChange={(e) => setWitnesses(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* Observations Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones Electorales
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
          >
            Cerrar
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={isExporting}
            className="flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            {isExporting ? 'Compilando Acta...' : 'Descargar Acta Oficial en PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActaCierreEscrutinioModal;
