/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { AppSettings, Room, Device, Consumption, Bill } from '../types';
import { 
  Settings, 
  Coins, 
  Trash2, 
  Download, 
  Upload, 
  Info, 
  Sparkles, 
  RefreshCw,
  Sliders,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  bills: Bill[];
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onResetData: () => void;
  onLoadDemoData: () => void;
  onImportData: (data: { rooms: Room[]; devices: Device[]; consumptions: Consumption[]; bills: Bill[]; settings: AppSettings }) => void;
}

export const SettingsPanel: React.FC<SettingsProps> = ({
  settings,
  rooms,
  devices,
  consumptions,
  bills,
  onUpdateSettings,
  onResetData,
  onLoadDemoData,
  onImportData
}) => {
  const [unitPrice, setUnitPrice] = useState(String(settings.unitPrice));
  const [currency, setCurrency] = useState(settings.currency);
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget ? String(settings.monthlyBudget) : '');
  const [targetKwh, setTargetKwh] = useState(settings.consumptionTargetKwh ? String(settings.consumptionTargetKwh) : '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'success' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: 'success' }), 3000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(unitPrice);
    if (isNaN(price) || price <= 0) {
      triggerStatus('Birim fiyatı sıfırdan büyük geçerli bir sayı olmalıdır.', 'error');
      return;
    }

    const budget = monthlyBudget ? parseFloat(monthlyBudget) : undefined;
    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      triggerStatus('Bütçe hedefi geçersiz.', 'error');
      return;
    }

    const kwh = targetKwh ? parseFloat(targetKwh) : undefined;
    if (kwh !== undefined && (isNaN(kwh) || kwh < 0)) {
      triggerStatus('Tüketim hedefi geçersiz.', 'error');
      return;
    }

    onUpdateSettings({
      unitPrice: price,
      currency: currency.trim() || 'TL',
      monthlyBudget: budget,
      consumptionTargetKwh: kwh
    });
    triggerStatus('Ayarlar başarıyla kaydedildi.');
  };

  // 1. BACKUP DATA (JSON Download)
  const handleExportBackup = () => {
    const backupObj = {
      rooms,
      devices,
      consumptions,
      bills,
      settings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wattly_yedek_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerStatus('Veriler JSON dosyası olarak yedeklendi.');
  };

  // 2. RESTORE DATA (JSON Import)
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.rooms && parsed.devices && parsed.consumptions && parsed.settings) {
          onImportData(parsed);
          triggerStatus('Yedek başarıyla geri yüklendi!');
        } else {
          triggerStatus('Uyumsuz yedek dosyası şablonu.', 'error');
        }
      } catch (err) {
        triggerStatus('Dosya okunamadı veya biçim hatalı.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  // 3. EXPORT CSV FOR CONSUMPTIONS & BILLS
  const handleExportCSV = () => {
    // A. Consumptions CSV
    let csvContent = "data:text/csv;charset=utf-8,ID,Cihaz,Oda,Tarih,Kwh,BirimFiyat(TL),ToplamMaliyet(TL),Not\n";
    consumptions.forEach((c) => {
      const dev = devices.find(d => d.id === c.deviceId)?.name || 'Bilinmeyen Cihaz';
      const r = rooms.find(room => room.id === c.roomId)?.name || 'Bilinmeyen Oda';
      csvContent += `"${c.id}","${dev}","${r}","${c.date}",${c.kwh},${c.unitPrice},${c.totalCost},"${c.note || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wattly_tuketim_kayitlari.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    triggerStatus('Tüketim kayıtları CSV olarak indirildi.');
  };

  // 4. GENERATE SIMPLE PRINTABLE REPORT
  const handlePrintReport = () => {
    setShowReport(true);
  };

  return (
    <div id="settings-container" className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Sistem Ayarları</h1>
        <p className="text-xs text-slate-400">Wattly uygulamasını kişiselleştirin</p>
      </div>

      {statusMessage.text && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold border animate-fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* General Configuration Form */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Sliders size={16} />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Genel Ayarlar</h3>
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Unit Price */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-bold flex items-center gap-1">
                Birim Fiyat <Coins size={12} className="text-blue-400" />
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>

            {/* Currency Symbol */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-bold">Para Birimi</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="Örn: TL, USD, €"
                className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Budget */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-bold">Aylık Bütçe Hedefi (TL)</label>
              <input
                type="number"
                placeholder="Örn: 1000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>

            {/* Monthly Target kWh */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-bold">Tüketim Limiti (kWh)</label>
              <input
                type="number"
                placeholder="Örn: 300"
                value={targetKwh}
                onChange={(e) => setTargetKwh(e.target.value)}
                className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Theme select */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold">Uygulama Teması</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: 'dark' })}
                className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                  settings.themeMode === 'dark'
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow'
                    : 'bg-slate-800 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Karanlık Tema
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: 'light' })}
                className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                  settings.themeMode === 'light'
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow'
                    : 'bg-slate-800 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Açık Tema (Klasik)
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Ayarları Güncelle
          </button>
        </form>
      </div>

      {/* APK Compilation & Capacitor wrapper integration guide */}
      <div 
        onClick={() => setShowApkGuide(true)}
        className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-slate-700/50 rounded-3xl p-5 flex justify-between items-center cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg"
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-blue-400">
            <Smartphone size={16} className="animate-bounce" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Android Telefonuma Nasıl Yüklerim?</h4>
          </div>
          <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
            Bu uygulamayı Capacitor kütüphanesiyle saniyeler içinde gerçek Android projesine (.apk) dönüştürme rehberi ve build komutları için tıklayın!
          </p>
        </div>
        <ChevronRight size={18} className="text-slate-400 shrink-0 ml-3" />
      </div>

      {/* Data Management Section */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck size={16} />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Veri Yönetimi</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Backup data */}
          <button
            onClick={handleExportBackup}
            className="h-14 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl px-4 flex flex-col justify-center items-start text-xs font-bold text-slate-200 transition-colors gap-0.5 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-[11px] text-slate-300"><Download size={14} /> Verileri Yedekle</span>
            <span className="text-[9px] text-slate-500 font-medium font-sans">JSON olarak kaydet</span>
          </button>

          {/* Restore data */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-14 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl px-4 flex flex-col justify-center items-start text-xs font-bold text-slate-200 transition-colors gap-0.5 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-[11px] text-slate-300"><Upload size={14} /> Yedek Yükle</span>
            <span className="text-[9px] text-slate-500 font-medium font-sans">Geri yükleme yap</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="h-14 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl px-4 flex flex-col justify-center items-start text-xs font-bold text-slate-200 transition-colors gap-0.5 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-[11px] text-slate-300"><FileSpreadsheet size={14} /> CSV Kayıtları</span>
            <span className="text-[9px] text-slate-500 font-medium font-sans">Eksel (Excel) raporu indir</span>
          </button>

          {/* Print PDF / Report */}
          <button
            onClick={handlePrintReport}
            className="h-14 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl px-4 flex flex-col justify-center items-start text-xs font-bold text-slate-200 transition-colors gap-0.5 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-[11px] text-slate-300"><Printer size={14} /> PDF Rapor Oluştur</span>
            <span className="text-[9px] text-slate-500 font-medium font-sans">Basit özet çıktısı al</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Load Demo Data */}
          <button
            onClick={onLoadDemoData}
            className="h-11 bg-slate-800 hover:bg-slate-750 text-blue-400 font-bold border border-blue-500/10 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} /> Demo Veri Yükle
          </button>

          {/* Reset all data */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="h-11 bg-rose-950/20 hover:bg-rose-950/30 text-rose-400 font-bold border border-rose-500/10 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 size={14} /> Tüm Verileri Sıfırla
          </button>
        </div>
      </div>

      {/* About Box */}
      <div className="bg-slate-900/10 border border-slate-800 rounded-3xl p-5 text-center space-y-2">
        <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto text-slate-400 border border-slate-700/30">
          <Info size={20} />
        </div>
        <h4 className="text-xs font-black text-white">Wattly – Akıllı Elektrik Takip</h4>
        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
          Bu uygulama, internet bağlantısı olmadan tarayıcınızda veya telefonunuzda tamamen yerel (offline-first) çalışarak bütçenizi korur.
        </p>
        <span className="text-[9px] text-slate-600 block font-mono font-bold">Sürüm v1.0.0 (Google AI Studio Build)</span>
      </div>

      {/* COMPILATION GUIDE MODAL */}
      {showApkGuide && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 animate-fade-in relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowApkGuide(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <div className="flex items-center gap-2.5 text-blue-400 border-b border-slate-800 pb-3">
              <Smartphone size={20} className="shrink-0" />
              <h2 className="text-base font-black text-white">Android APK Oluşturma Rehberi</h2>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Wattly, modern web teknolojileri (React, Tailwind v4, Vite) ile kodlanmıştır. Bu harika projeyi telefonunuza kurulabilir bir **Android APK** dosyasına dönüştürmek için Google ve Android ekosisteminin resmi wrapper kütüphanesi olan **Capacitor**'ı kullanabilirsiniz.
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-300 flex items-center gap-1.5">1. Adım: Projeyi Bilgisayarınıza İndirin</h4>
                <p className="text-slate-400">
                  AI Studio üzerindeki sağ üst menüden projenizi **ZIP** veya **GitHub** export olarak bilgisayarınıza çekin ve terminalde proje dizinine gidin.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-300 flex items-center gap-1.5">2. Adım: Android Bağımlılıklarını Kurun</h4>
                <p className="text-slate-400">Proje dizininde terminalden şu komutları sırasıyla çalıştırarak Capacitor kütüphanelerini ekleyin:</p>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto block">
{`npm install @capacitor/core @capacitor/cli
npx cap init Wattly com.wattly.app --web-dir=dist
npm install @capacitor/android
npx cap add android`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-300 flex items-center gap-1.5">3. Adım: Projeyi Derleyin ve Senkronize Edin</h4>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto block">
{`# Web uygulamasını build edin
npm run build

# Android platformuyla dosyaları senkronize edin
npx cap sync`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-300 flex items-center gap-1.5">4. Adım: APK'nızı Android Studio ile Alın</h4>
                <p className="text-slate-400">Projenizi Android Studio'da açmak için şu komutu girin:</p>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto block">
npx cap open android
                </pre>
                <p className="text-slate-400 mt-1">
                  Android Studio açıldığında en üst menüden <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> seçeneğine tıklayın. Saniyeler içinde telefonunuza gönderebileceğiniz <strong>app-debug.apk</strong> dosyanız hazır olacaktır!
                </p>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex gap-2 text-xs text-blue-300">
                <CheckCircle2 size={18} className="shrink-0 text-blue-400 mt-0.5" />
                <p>
                  <strong>Neden Bu Yöntem Harika?</strong> Bu yöntemle oluşturulan APK, web uygulamasındaki tüm IndexedDB ve LocalStorage yeteneklerini koruyarak 100% offline ve son derece akıcı çalışır.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowApkGuide(false)}
              className="w-full h-11 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}

      {/* PRINT REPORT MODAL */}
      {showReport && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 animate-fade-in relative max-h-[85vh] overflow-y-auto text-left">
            <button onClick={() => setShowReport(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-3">
              <Printer size={18} />
              <h2 className="text-base font-black text-white">Fatura & Tüketim Raporu Özet Çıktısı</h2>
            </div>

            <div className="bg-white text-slate-950 p-6 rounded-2xl font-sans text-xs space-y-4 shadow-inner leading-relaxed overflow-y-auto max-h-[50vh]">
              <div className="text-center border-b pb-3 border-slate-200">
                <h1 className="text-lg font-black tracking-tight text-blue-600">WATTLY ENERJİ RAPORU</h1>
                <p className="text-[10px] text-slate-500 mt-0.5">Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-extrabold text-slate-500 text-[10px] uppercase">Özet İstatistikler</h4>
                  <ul className="space-y-1 mt-1 font-medium text-slate-800">
                    <li>• Toplam Oda: {rooms.length}</li>
                    <li>• Toplam Cihaz: {devices.length}</li>
                    <li>• Tüketim Girişi: {consumptions.length} adet</li>
                    <li>• Girilen Fatura: {bills.length} adet</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-500 text-[10px] uppercase">Birim Ücret Bilgisi</h4>
                  <ul className="space-y-1 mt-1 font-medium text-slate-800">
                    <li>• Elektrik Tarifesi: {settings.unitPrice.toFixed(2)} TL / kWh</li>
                    <li>• Para Birimi: {settings.currency}</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-500 text-[10px] uppercase border-b pb-1">Odaların Tüketim Oranları</h4>
                <table className="w-full mt-2 text-left font-medium">
                  <thead>
                    <tr className="text-slate-400 text-[10px] border-b">
                      <th>Oda Adı</th>
                      <th>Bağlı Cihaz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(r => {
                      const devCount = devices.filter(d => d.roomId === r.id).length;
                      return (
                        <tr key={r.id} className="border-b">
                          <td className="py-1 font-bold">{r.name}</td>
                          <td className="py-1 font-mono">{devCount} adet</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-3 border-t">
                Wattly Smart System © 2026 - Tüm Hakları Saklıdır.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowReport(false)}
                className="h-11 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => window.print()}
                className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer size={14} /> Yazıcıya Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET ALL DATA MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 size={24} className="animate-bounce" />
            </div>
            <h2 className="text-base font-black text-white">Tüm Verileri Sıfırlamak İstediğinize Emin misiniz?</h2>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu işlem, eklediğiniz <strong>tüm odaları, cihazları, tüketim geçmişini ve faturaları</strong> kalıcı olarak silecektir. Bu işlem geri alınamaz!
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="h-10 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                  triggerStatus('Tüm veriler başarıyla sıfırlandı.');
                }}
                className="h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Evet, Sıfırla!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
