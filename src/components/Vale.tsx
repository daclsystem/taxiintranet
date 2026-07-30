import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Car,
  Phone,
  Mail,
  Globe,
  Printer,
  Download,
  MoreHorizontal,
  X,
  FileText,
  Navigation,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { obtenerVale } from '../services/valeService';
import { ValeResponse } from '../types/vale';
import { ThemeToggle } from './ThemeToggle';
import { AppPageShell } from './ui/ListPageUI';
import { AppModal } from './ui/AppModal';

interface ValeProps {
  token: string;
  onVolver: () => void;
  /** modal = encima del listado (default). page = pantalla completa (vale.html). */
  variant?: 'modal' | 'page';
}

const Field: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({
  label,
  value,
  className = '',
}) => (
  <div className={`min-w-0 ${className}`}>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-0.5">
      {label}
    </p>
    <p className="text-sm font-medium text-zinc-900 dark:text-white break-words leading-snug">
      {value || '—'}
    </p>
  </div>
);

/**
 * Vale de servicio — modal sobre el listado (o página completa en vale.html)
 */
export const Vale: React.FC<ValeProps> = ({ token, onVolver, variant = 'modal' }) => {
  const isModal = variant === 'modal';
  const [valeData, setValeData] = useState<ValeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opcionesOpen, setOpcionesOpen] = useState(false);
  const [exportando, setExportando] = useState(false);
  const valeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarVale();
  }, [token]);

  const cargarVale = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await obtenerVale(token);
      setValeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const formatearMoneda = (monto: number) => `S/ ${(monto || 0).toFixed(2)}`;

  const limpiarTexto = (texto: string) =>
    (texto || '')
      .replace(/&#x0D;\n/g, '')
      .replace(/&#13;&#10;/g, '')
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const handleImprimir = () => {
    setOpcionesOpen(false);
    window.print();
  };

  const handleDescargarPdf = async () => {
    if (!valeRef.current || !valeData) return;
    try {
      setExportando(true);
      setOpcionesOpen(false);
      const node = valeRef.current;
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`vale-${valeData.ovservicio.idservicio}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  const handleAyuda = () => {
    setOpcionesOpen(false);
    window.open(
      'https://api.whatsapp.com/send?phone=51932116459&text=necesito%20ayuda',
      '_blank'
    );
  };
  const handleWeb = () => {
    setOpcionesOpen(false);
    window.open('https://zmovilidad.com', '_blank');
  };
  const handleCorreo = () => {
    setOpcionesOpen(false);
    window.open('mailto:reservas@zmovilidad.com', '_self');
  };
  const handleLlamada = () => {
    setOpcionesOpen(false);
    window.open('tel:+15144400', '_self');
  };

  const wrap = (children: React.ReactNode) => {
    if (!isModal) {
      return <AppPageShell>{children}</AppPageShell>;
    }
    return (
      <div className="fixed inset-0 z-[70] print:static print:inset-auto">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
          onClick={onVolver}
        />
        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 print:relative print:p-0">
          <div className="relative w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[90dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-0">
            {children}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return wrap(
      <div className="flex items-center justify-center py-16 px-6">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Cargando vale...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return wrap(
      <div className="flex items-center justify-center py-12 px-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Error al cargar vale
          </h2>
          <p className="text-sm text-zinc-500 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={onVolver}
              className="h-10 px-4 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={cargarVale}
              className="h-10 px-4 rounded-xl text-sm font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!valeData) return null;

  const { ovservicio } = valeData;
  const esPendiente = ovservicio.idestado === 7;
  const esCorporativo = ovservicio.tipo.toLowerCase() === 'corporativo';

  return wrap(
    <>
      <header className="shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 print:hidden px-3 sm:px-4">
        <div className="flex items-center justify-between h-12 gap-2">
          <div className="flex items-center min-w-0 gap-2">
            {isModal ? (
              <button
                type="button"
                onClick={onVolver}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onVolver}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-sm font-semibold text-zinc-900 dark:text-white truncate">
                Vale #{ovservicio.idservicio}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDescargarPdf}
              disabled={exportando}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold
                bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {exportando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              PDF
            </button>
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold
                border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100
                hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              type="button"
              onClick={() => setOpcionesOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg
                border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200
                hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              title="Más opciones"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {!isModal && <ThemeToggle />}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto print:overflow-visible">
        <div
          ref={valeRef}
          className="zm-vale w-full border-0 rounded-none
            bg-white dark:bg-zinc-950 overflow-hidden print:shadow-none"
        >
          {/* Hero */}
          <div className="relative px-5 py-5 sm:px-7 sm:py-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <img
                  src={`${import.meta.env.BASE_URL}logoz.png`}
                  alt="Z Movilidad"
                  className="h-11 w-11 rounded-xl ring-1 ring-amber-500/30 object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                    Z Movilidad
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5">
                    {ovservicio.solicitante}, gracias por preferirnos
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      #{ovservicio.idservicio}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: ovservicio.colorcelda || '#fef3c7',
                        color: ovservicio.colortexto || '#92400e',
                      }}
                    >
                      {ovservicio.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Total
                </p>
                <p className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400 leading-none mt-1">
                  {formatearMoneda(ovservicio.costototal)}
                </p>
                <div className="mt-2.5 flex sm:justify-end flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    {ovservicio.fecha}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {ovservicio.hora}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {/* Servicio */}
            <section className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Servicio
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Cliente" value={ovservicio.nombrecomercial} />
                <Field label="Traslado" value={limpiarTexto(ovservicio.personal)} />
                <Field label="Pago" value={ovservicio.tipo} />
                {esCorporativo && (
                  <>
                    <Field
                      label="Área"
                      value={ovservicio.area && ovservicio.area !== '0' ? ovservicio.area : '—'}
                    />
                    <Field
                      label="Centro costos"
                      value={
                        ovservicio.centrocostos && ovservicio.centrocostos !== '0'
                          ? ovservicio.centrocostos
                          : '—'
                      }
                    />
                    <Field label="Motivo" value={ovservicio.motivosolicitud || '—'} />
                    <Field
                      label="Detalle motivo"
                      value={ovservicio.motivodetalle || '—'}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </>
                )}
              </div>
            </section>

            {/* Ruta */}
            <section className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Ruta
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <Field label="Origen" value={ovservicio.direccionorigen} className="flex-1" />
                </div>
                {ovservicio.ruta && (
                  <div className="flex gap-2.5 pl-6">
                    <Field
                      label="Ruta adicional"
                      value={limpiarTexto(ovservicio.ruta)}
                      className="flex-1"
                    />
                  </div>
                )}
                <div className="flex gap-2.5">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <Field label="Destino" value={ovservicio.direcciondestino} className="flex-1" />
                </div>
              </div>
            </section>

            {/* Móvil / conductor */}
            {!esPendiente && (
              <section className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Móvil y conductor
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
                    <img
                      src={ovservicio.foto}
                      alt="Conductor"
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-amber-500/25"
                      crossOrigin="anonymous"
                    />
                    <Field label="Conductor" value={ovservicio.nombres} />
                  </div>
                  <Field label="Móvil" value={ovservicio.movil} />
                  <Field label="Placa" value={ovservicio.nplaca} />
                  <Field label="Vehículo" value={ovservicio.datmovil} />
                  <Field label="Inicio" value={ovservicio.fechorproceso} />
                  <Field label="Fin" value={ovservicio.fechorfinalizado} />
                </div>
              </section>
            )}

            {/* Costos */}
            <section className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Desglose
                </h2>
                <span className="font-display text-base font-bold text-amber-600 dark:text-amber-400">
                  {formatearMoneda(ovservicio.costototal)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/70 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Costo</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
                    {formatearMoneda(ovservicio.subtotal)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/70 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Peaje</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
                    {formatearMoneda(ovservicio.peaje)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/70 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Parqueo</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
                    {formatearMoneda(ovservicio.parqueo)}
                  </p>
                </div>
              </div>
            </section>

            <p className="text-center text-[11px] text-zinc-400 pt-1">
              © {new Date().getFullYear()} Z Movilidad · Vale de servicio
            </p>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <AppModal
          open={opcionesOpen}
          onClose={() => setOpcionesOpen(false)}
          title="Opciones del vale"
          size="sm"
          priority
        >
        <div className="grid grid-cols-2 gap-1.5 -m-1">
          {[
            {
              label: 'Descargar PDF',
              icon: Download,
              onClick: handleDescargarPdf,
              primary: true,
            },
            { label: 'Imprimir', icon: Printer, onClick: handleImprimir },
            { label: 'Ayuda WhatsApp', icon: AlertCircle, onClick: handleAyuda },
            { label: 'Sitio web', icon: Globe, onClick: handleWeb },
            { label: 'Correo', icon: Mail, onClick: handleCorreo },
            { label: 'Llamar', icon: Phone, onClick: handleLlamada },
          ].map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={opt.onClick}
                disabled={exportando && opt.label === 'Descargar PDF'}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors
                  ${
                    opt.primary
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 col-span-2'
                      : 'text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                  <Icon className="w-4 h-4" />
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </AppModal>
      </div>
    </>
  );
};
