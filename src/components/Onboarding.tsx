import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Coins, TrendingUp, CheckCircle2, ChevronRight, Zap, Leaf } from 'lucide-react';

interface OnboardingProps {
  onComplete: (unitPrice: number, loadDemo: boolean) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep]             = useState(1);
  const [unitPrice, setUnitPrice]   = useState<number>(3.25);
  const [loadDemo, setLoadDemo]     = useState<boolean>(true);
  const [priceInput, setPriceInput] = useState<string>('3.25');
  const [error, setError]           = useState<string>('');

  const handleNextStep = () => {
    if (step === 2) {
      const parsed = parseFloat(priceInput);
      if (isNaN(parsed) || parsed <= 0) {
        setError('Lütfen geçerli ve 0\'dan büyük bir birim fiyat girin.');
        return;
      }
      setUnitPrice(parsed);
      setError('');
    }
    setStep(step + 1);
  };

  const handleComplete = () => {
    onComplete(unitPrice, loadDemo);
  };

  return (
    <div id="onboarding-root" className="min-h-screen bg-stone-950 flex items-center justify-center p-4 text-stone-50 pt-safe pb-safe">
      <div className="w-full max-w-md bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-amber-500' : s < step ? 'w-2 bg-amber-500/40' : 'w-2 bg-stone-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                  <Zap size={32} className="animate-pulse" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-50">
                  Wattly'ye Hoş Geldiniz!
                </h1>
                <p className="text-sm text-stone-400 mt-2 font-medium">Akıllı Elektrik Takip & Fatura Analiz Sistemi</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex gap-4 p-4 rounded-2xl bg-stone-800/40 border border-stone-800/60">
                  <div className="text-amber-500 shrink-0 mt-1"><Sparkles size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm text-stone-100">Oda ve Cihaz Bazlı Takip</h3>
                    <p className="text-xs text-stone-400 mt-0.5">Evinizdeki odaları ve elektrikli aletlerin tüketimlerini kolayca yönetin.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-stone-800/40 border border-stone-800/60">
                  <div className="text-emerald-500 shrink-0 mt-1"><Coins size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm text-stone-100">Maliyet & Fatura Tahminleri</h3>
                    <p className="text-xs text-stone-400 mt-0.5">Mevcut kullanımlara göre ay sonu faturanızı kuruşu kuruşuna tahmin edin.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-stone-800/40 border border-stone-800/60">
                  <div className="text-teal-500 shrink-0 mt-1"><TrendingUp size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm text-stone-100">Gelişmiş Analiz ve Tasarruf</h3>
                    <p className="text-xs text-stone-400 mt-0.5">En çok elektrik tüketen 5 cihazı tespit edin, tasarruf önerilerini görün.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-stone-800/40 border border-stone-800/60">
                  <div className="text-emerald-400 shrink-0 mt-1"><Leaf size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-sm text-stone-100">CO₂ Karbon Ayak İzi</h3>
                    <p className="text-xs text-stone-400 mt-0.5">Elektrik tüketiminizin çevreye etkisini kg CO₂ olarak takip edin.</p>
                  </div>
                </div>
              </div>

              <button onClick={handleNextStep}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                Devam Et <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                  <Coins size={24} />
                </div>
                <h2 className="text-xl font-bold text-stone-50">Elektrik Birim Fiyatı</h2>
                <p className="text-xs text-stone-400 mt-1">
                  Doğru hesaplamalar için bölgenizdeki güncel 1 kWh birim fiyatını girin. Bu ayarı daha sonra değiştirebilirsiniz.
                </p>
              </div>

              <div className="bg-stone-800/30 border border-stone-800 rounded-2xl p-6 text-center space-y-4">
                <label className="block text-xs text-stone-400 font-semibold tracking-wider uppercase">Varsayılan Birim Fiyat (TL / kWh)</label>
                <div className="relative max-w-[200px] mx-auto">
                  <input
                    type="number" step="0.01" min="0" value={priceInput}
                    onChange={(e) => { setPriceInput(e.target.value); setError(''); }}
                    className="w-full text-center text-3xl font-extrabold bg-transparent border-b-2 border-stone-700 focus:border-amber-500 py-2 focus:outline-none text-stone-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-0 bottom-3 text-sm text-stone-400 font-bold">TL/kWh</span>
                </div>
                {error && <p className="text-xs text-rose-500 font-semibold mt-1">{error}</p>}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-xs text-emerald-400 font-medium">
                  Örnek Hesaplama: 7.2 kWh × {priceInput || '3.25'} = {parseFloat(((parseFloat(priceInput) || 3.25) * 7.2).toFixed(2))} TL
                </div>
              </div>

              <button onClick={handleNextStep}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                Birim Fiyatı Onayla <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 mx-auto mb-4">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-xl font-bold text-stone-50">Keşfetmeye Hazır mısınız?</h2>
                <p className="text-xs text-stone-400 mt-1">
                  Uygulamayı hemen test edebilmeniz için örnek odalar, cihazlar ve tüketim kayıtları ekleyebiliriz.
                </p>
              </div>

              <div className="space-y-3">
                <button type="button" onClick={() => setLoadDemo(true)}
                  className={`w-full p-4 rounded-2xl text-left border transition-all ${
                    loadDemo
                      ? 'bg-amber-500/10 border-amber-500 text-stone-50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-0.5 border ${loadDemo ? 'border-amber-500 text-amber-500' : 'border-stone-700 text-stone-600'}`}>
                      <CheckCircle2 size={14} className={loadDemo ? 'opacity-100' : 'opacity-0'} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-100">Örnek Demo Verileriyle Başla</h4>
                      <p className="text-xs text-stone-400 mt-1">
                        Evinizi yansıtan 4 hazır oda, 6 cihaz ve 30 günlük otomatik tüketim geçmişi yüklenir. Analizleri anında görürsünüz.
                      </p>
                    </div>
                  </div>
                </button>

                <button type="button" onClick={() => setLoadDemo(false)}
                  className={`w-full p-4 rounded-2xl text-left border transition-all ${
                    !loadDemo
                      ? 'bg-amber-500/10 border-amber-500 text-stone-50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-0.5 border ${!loadDemo ? 'border-amber-500 text-amber-500' : 'border-stone-700 text-stone-600'}`}>
                      <CheckCircle2 size={14} className={!loadDemo ? 'opacity-100' : 'opacity-0'} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-100">Temiz Başlangıç Yap</h4>
                      <p className="text-xs text-stone-400 mt-1">
                        Hiçbir veri eklenmez. Kendi odalarınızı, cihazlarınızı ve tüketim kayıtlarınızı sıfırdan ekleyerek başlarsınız.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <button onClick={handleComplete}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                Wattly'yi Başlat! <Sparkles size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
