import React, { useState, useRef } from 'react';
import { AppSettings, Room, Device, Consumption, Bill, WaterBill } from '../types';
import {
  Settings, Coins, Trash2, Download, Upload,
  RefreshCw, Sliders, FileSpreadsheet, Printer,
  CheckCircle2, X, Github, RefreshCcw, AlertCircle, Leaf
} from 'lucide-react';

declare const __APP_VERSION__: string;
const APP_VERSION = 'v' + __APP_VERSION__;

interface SettingsProps {
  settings: AppSettings;
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  bills: Bill[];
  waterBills: WaterBill[];
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  onResetData: () => void;
  onLoadDemoData: () => void;
  onImportData: (data: { rooms: Room[]; devices: Device[]; consumptions: Consumption[]; bills: Bill[]; waterBills: WaterBill[]; settings: AppSettings }) => void;
}

type UpdateStatus = { type: 'idle' | 'loading' | 'uptodate' | 'update' | 'error'; msg: string; version?: string; apkUrl?: string };

const inputCls  = "w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-4 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono font-bold";
const labelCls  = "text-xs text-stone-500 dark:text-stone-400 font-bold";
const cardCls   = "bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 space-y-4";

export const SettingsPanel: React.FC<SettingsProps> = ({
  settings, rooms, devices, consumptions, bills, waterBills,
  onUpdateSettings, onResetData, onLoadDemoData, onImportData
}) => {
  const [unitPrice, setUnitPrice]         = useState(String(settings.unitPrice));
  const [currency, setCurrency]           = useState(settings.currency);
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget ? String(settings.monthlyBudget) : '');
  const [targetKwh, setTargetKwh]         = useState(settings.consumptionTargetKwh ? String(settings.consumptionTargetKwh) : '');
  const [githubRepo, setGithubRepo]       = useState(settings.githubRepo || 'MelihKutlukan/wattly-rj330h');
  const [co2Factor, setCo2Factor]         = useState(String(settings.co2Factor ?? 0.47));
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showReport, setShowReport]       = useState(false);
  const [statusMsg, setStatusMsg]         = useState({ text: '', type: 'success' as 'success' | 'error' });
  const [updateStatus, setUpdateStatus]   = useState<UpdateStatus>({ type: 'idle', msg: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: 'success' }), 3000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(unitPrice);
    if (isNaN(price) || price <= 0) { toast('Geçerli bir birim fiyat girin.', 'error'); return; }
    const budget = monthlyBudget ? parseFloat(monthlyBudget) : undefined;
    if (budget !== undefined && isNaN(budget)) { toast('Geçersiz bütçe değeri.', 'error'); return; }
    const kwh    = targetKwh ? parseFloat(targetKwh) : undefined;
    if (kwh !== undefined && isNaN(kwh)) { toast('Geçersiz kWh hedefi.', 'error'); return; }
    const co2 = parseFloat(co2Factor);
    if (isNaN(co2) || co2 <= 0) { toast('Geçersiz CO₂ faktörü.', 'error'); return; }

    onUpdateSettings({
      unitPrice: price,
      currency:  currency.trim() || 'TL',
      monthlyBudget: budget,
      consumptionTargetKwh: kwh,
      githubRepo: githubRepo.trim() || undefined,
      co2Factor: co2,
    });
    toast('Ayarlar başarıyla kaydedildi.');
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify({ rooms, devices, consumptions, bills, waterBills, settings }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `wattly_yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('Veriler JSON olarak yedeklendi.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.rooms && parsed.devices && parsed.consumptions && parsed.settings) {
          onImportData({ ...parsed, waterBills: parsed.waterBills || [] });
          toast('Yedek başarıyla geri yüklendi!');
        } else {
          toast('Uyumsuz yedek dosyası.', 'error');
        }
      } catch { toast('Dosya okunamadı veya bozuk.', 'error'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,ID,Cihaz,Oda,Tarih,kWh,BirimFiyat,Tutar,Not\n';
    consumptions.forEach(c => {
      const dev = devices.find(d => d.id === c.deviceId)?.name || '-';
      const r   = rooms.find(r => r.id === c.roomId)?.name     || '-';
      csv += `"${c.id}","${dev}","${r}","${c.date}",${c.kwh},${c.unitPrice},${c.totalCost},"${c.note || ''}"\n`;
    });
    const a = document.createElement('a');
    a.href = encodeURI(csv); a.download = 'wattly_tuketim_kayitlari.csv'; a.click();
    toast('Tüketim kayıtları CSV olarak indirildi.');
  };

  const checkUpdate = async () => {
    const repo = githubRepo.trim();
    if (!repo) { setUpdateStatus({ type: 'error', msg: 'GitHub repo adresi girilmemiş.' }); return; }
    setUpdateStatus({ type: 'loading', msg: 'Sunucudan versiyon kontrol ediliyor...' });
    try {
      const res  = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
      if (!res.ok) throw new Error('Release bulunamadı');
      const data = await res.json();
      const tag  = data.tag_name as string;
      const apkAsset = (data.assets as any[])?.find((a: any) => a.name.endsWith('.apk'));
      const apkUrl   = apkAsset?.browser_download_url as string | undefined;
      if (tag > APP_VERSION) {
        setUpdateStatus({ type: 'update', msg: `Yeni sürüm mevcut: ${tag}`, version: tag, apkUrl });
      } else {
        setUpdateStatus({ type: 'uptodate', msg: `Uygulama güncel — ${APP_VERSION}` });
      }
    } catch {
      setUpdateStatus({ type: 'error', msg: 'Bağlantı hatası veya geçersiz repo adresi.' });
    }
  };

  const doUpdate = () => {
    const url = updateStatus.apkUrl;
    if (!url) return;
    window.open(url, '_system');
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50">Sistem Ayarları</h1>
        <p className="text-xs text-stone-400">Wattly uygulamasını kişiselleştirin</p>
      </div>

      {statusMsg.text && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold border animate-fade-in ${
          statusMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Genel Ayarlar */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 text-amber-500">
          <Sliders size={16} />
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Genel Ayarlar</h3>
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Birim Fiyat (TL/kWh)</label>
              <input type="number" step="0.01" min="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Para Birimi</label>
              <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="TL"
                className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Aylık Bütçe Hedefi</label>
              <input type="number" placeholder="Örn: 1000" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>kWh Limiti</label>
              <input type="number" placeholder="Örn: 300" value={targetKwh} onChange={e => setTargetKwh(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* CO2 faktörü */}
          <div className="space-y-1.5">
            <label className={`${labelCls} flex items-center gap-1`}>
              <Leaf size={11} className="text-emerald-500" /> CO₂ Faktörü (kg CO₂/kWh)
            </label>
            <input type="number" step="0.01" min="0.01" value={co2Factor} onChange={e => setCo2Factor(e.target.value)} className={inputCls} />
            <p className="text-[10px] text-stone-400">Türkiye şebeke ortalaması: 0.47 kg CO₂/kWh</p>
          </div>

          {/* Tema */}
          <div className="space-y-1.5">
            <label className={labelCls}>Uygulama Teması</label>
            <div className="grid grid-cols-2 gap-2">
              {(['dark', 'light'] as const).map(mode => (
                <button key={mode} type="button" onClick={() => onUpdateSettings({ themeMode: mode })}
                  className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                    settings.themeMode === mode
                      ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 hover:border-stone-400 dark:hover:border-stone-600'
                  }`}>
                  {mode === 'dark' ? '🌙 Karanlık' : '☀️ Aydınlık'}
                </button>
              ))}
            </div>
          </div>

          <button type="submit"
            className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-xs transition-colors">
            Ayarları Güncelle
          </button>
        </form>
      </div>

      {/* OTA Güncelleme */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 text-violet-500">
          <Github size={16} />
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Otomatik Güncelleme (OTA)</h3>
        </div>
        <p className="text-[11px] text-stone-400 leading-relaxed">
          GitHub repona push ettiğinizde yeni sürümü uygulama içinden güncelleyebilirsiniz.
          Repo adresini <code className="text-violet-500 font-mono">kullaniciadi/repo</code> formatında girin.
        </p>

        <div className="space-y-1.5">
          <label className={labelCls}>GitHub Repo Adresi</label>
          <input type="text" value={githubRepo} onChange={e => setGithubRepo(e.target.value)} placeholder="Örn: melih/wattly"
            className="w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-4 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500 font-mono" />
        </div>

        {updateStatus.type !== 'idle' && (
          <div className={`rounded-2xl p-3.5 text-xs font-semibold flex items-start gap-2 ${
            updateStatus.type === 'loading'  ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700' :
            updateStatus.type === 'uptodate' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
            updateStatus.type === 'update'   ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20' :
                                               'bg-rose-500/10 text-rose-500 border border-rose-500/20'
          }`}>
            {updateStatus.type === 'loading'  && <RefreshCcw size={14} className="animate-spin shrink-0 mt-0.5" />}
            {updateStatus.type === 'uptodate' && <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
            {updateStatus.type === 'update'   && <Github size={14} className="shrink-0 mt-0.5" />}
            {updateStatus.type === 'error'    && <AlertCircle size={14} className="shrink-0 mt-0.5" />}
            <span>{updateStatus.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={checkUpdate}
            className="h-11 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
            <RefreshCcw size={14} /> Sürüm Kontrol
          </button>
          {updateStatus.type === 'update' && (
            <button onClick={doUpdate}
              className="h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all">
              <RefreshCw size={14} /> Güncelle
            </button>
          )}
        </div>

        <p className="text-[10px] text-stone-400 text-center">Mevcut sürüm: <span className="font-mono text-stone-600 dark:text-stone-400 font-bold">{APP_VERSION}</span></p>
      </div>

      {/* Veri Yönetimi */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 text-emerald-500">
          <Settings size={16} />
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Veri Yönetimi</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExportBackup}
            className="h-14 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl px-4 flex flex-col justify-center items-start gap-0.5 transition-colors">
            <span className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-stone-300 font-bold"><Download size={13} /> Yedekle (JSON)</span>
            <span className="text-[9px] text-stone-400">Tüm verileri kaydet</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="h-14 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl px-4 flex flex-col justify-center items-start gap-0.5 transition-colors">
            <span className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-stone-300 font-bold"><Upload size={13} /> Yedek Yükle</span>
            <span className="text-[9px] text-stone-400">JSON'dan geri yükle</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExportCSV}
            className="h-14 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl px-4 flex flex-col justify-center items-start gap-0.5 transition-colors">
            <span className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-stone-300 font-bold"><FileSpreadsheet size={13} /> CSV İndir</span>
            <span className="text-[9px] text-stone-400">Excel raporu</span>
          </button>
          <button onClick={() => setShowReport(true)}
            className="h-14 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl px-4 flex flex-col justify-center items-start gap-0.5 transition-colors">
            <span className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-stone-300 font-bold"><Printer size={13} /> PDF Raporu</span>
            <span className="text-[9px] text-stone-400">Özet çıktı</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-200 dark:border-stone-800">
          <button onClick={onLoadDemoData}
            className="h-11 bg-stone-100 dark:bg-stone-800 text-amber-500 font-bold border border-amber-500/20 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-amber-500/10 transition-colors">
            <RefreshCw size={13} /> Demo Veri Yükle
          </button>
          <button onClick={() => setShowResetConfirm(true)}
            className="h-11 bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-rose-500/20 transition-colors">
            <Trash2 size={13} /> Verileri Sıfırla
          </button>
        </div>
      </div>

      {/* Hakkında */}
      <div className="bg-white dark:bg-stone-900/20 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 text-center space-y-2">
        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto">
          <Coins size={18} className="text-amber-500" />
        </div>
        <h4 className="text-xs font-black text-stone-900 dark:text-stone-50">Wattly — Akıllı Enerji Takip</h4>
        <p className="text-[10px] text-stone-400 max-w-xs mx-auto">
          İnternet bağlantısı olmadan, tamamen yerel (offline-first) çalışan elektrik ve su tüketim takip uygulaması.
        </p>
        <span className="text-[9px] text-stone-400 block font-mono font-bold">{APP_VERSION}</span>
      </div>

      {/* Sıfırlama Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-scale-in text-center">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <h2 className="text-base font-black text-stone-900 dark:text-stone-50">Tüm Verileri Sıfırlansın mı?</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Tüm odalar, cihazlar, tüketim geçmişi, elektrik ve su faturaları <strong>kalıcı olarak silinecek</strong>. Bu işlem geri alınamaz!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowResetConfirm(false)}
                className="h-10 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs">Vazgeç</button>
              <button onClick={() => { onResetData(); setShowResetConfirm(false); toast('Tüm veriler sıfırlandı.'); }}
                className="h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs">Evet, Sıfırla!</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Rapor Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-lg space-y-4 relative max-h-[85vh] overflow-y-auto animate-scale-in">
            <button onClick={() => setShowReport(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"><X size={20} /></button>
            <h2 className="text-base font-black text-stone-900 dark:text-stone-50">Enerji Raporu</h2>
            <div className="bg-white text-stone-950 p-6 rounded-2xl font-sans text-xs space-y-4 leading-relaxed border border-stone-200">
              <div className="text-center border-b pb-3 border-stone-200">
                <h1 className="text-lg font-black text-amber-600">WATTLY ENERJİ RAPORU</h1>
                <p className="text-[10px] text-stone-500 mt-0.5">{new Date().toLocaleDateString('tr-TR', { dateStyle: 'long' })}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-extrabold text-stone-400 text-[10px] uppercase mb-1">İstatistikler</h4>
                  <ul className="space-y-1 text-stone-800 font-medium">
                    <li>• Toplam Oda: {rooms.length}</li>
                    <li>• Toplam Cihaz: {devices.length}</li>
                    <li>• Tüketim Kaydı: {consumptions.length}</li>
                    <li>• Elektrik Faturası: {bills.length}</li>
                    <li>• Su Faturası: {waterBills.length}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-400 text-[10px] uppercase mb-1">Tarife</h4>
                  <ul className="space-y-1 text-stone-800 font-medium">
                    <li>• Birim Fiyat: {settings.unitPrice.toFixed(2)} {settings.currency}/kWh</li>
                    <li>• CO₂ Faktörü: {(settings.co2Factor ?? 0.47)} kg/kWh</li>
                    {settings.monthlyBudget && <li>• Bütçe: {settings.monthlyBudget} {settings.currency}</li>}
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-extrabold text-stone-400 text-[10px] uppercase border-b pb-1 mb-2">Odalar</h4>
                <table className="w-full text-left">
                  <thead><tr className="text-stone-400 text-[9px] border-b"><th>Oda</th><th>Cihaz Sayısı</th></tr></thead>
                  <tbody>
                    {rooms.map(r => (
                      <tr key={r.id} className="border-b">
                        <td className="py-1 font-bold">{r.name}</td>
                        <td className="py-1 font-mono">{devices.filter(d => d.roomId === r.id).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-center text-[9px] text-stone-400 pt-2 border-t">Wattly {APP_VERSION}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowReport(false)} className="h-11 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs">Kapat</button>
              <button onClick={() => window.print()} className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
                <Printer size={13} /> Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
