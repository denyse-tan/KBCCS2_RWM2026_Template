import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Trash2,
  Layout,
  FileDown,
  RefreshCcw
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PageData {
  content: string;
  image: string | null;
}

interface TemplateData {
  page1: { title: string };
  page2: PageData;
  page3: PageData;
}

const INITIAL_DATA: TemplateData = {
  page1: { title: 'REAL-WORLD MATH CHALLENGE' },
  page2: { content: 'A squirrel is flying a plane at 120 km/h. If it flies for 2 hours, how far does it go?', image: null },
  page3: { content: 'Distance = Speed × Time\nDistance = 120 km/h × 2 h = 240 km', image: null },
};

const TEMPLATE_IMAGES = {
  cover: '/KBCCS2_RWM2026_Template/template1.png',
  question: '/KBCCS2_RWM2026_Template/template2.png',
  solution: '/KBCCS2_RWM2026_Template/template3.png',
};

export default function App() {
  const [data, setData] = useState<TemplateData>(INITIAL_DATA);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const scaledContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const pageRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const handleInputChange = (page: keyof TemplateData, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [page]: { ...prev[page], [field]: value }
    }));
  };

  const handleImageUpload = (page: 'page2' | 'page3', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({
          ...prev,
          [page]: { ...prev[page], image: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (page: 'page2' | 'page3') => {
    setData(prev => ({
      ...prev,
      [page]: { ...prev[page], image: null }
    }));
  };

  const downloadPdf = async () => {
    setIsDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080]
      });

      for (let i = 0; i < pageRefs.length; i++) {
        const ref = pageRefs[i].current;
        if (!ref) continue;

        // Using a slight delay and cacheBust ensures the title renders in the PNG
        const dataUrl = await toPng(ref, { 
          pixelRatio: 2,
          width: 1920,
          height: 1080,
          cacheBust: true,
        });

        if (i > 0) pdf.addPage([1920, 1080], 'landscape');
        pdf.addImage(dataUrl, 'PNG', 0, 0, 1920, 1080);
      }

      pdf.save('math-challenge.pdf');
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const resetData = () => {
    if (window.confirm('Reset all data?')) setData(INITIAL_DATA);
  };

  const PageTemplate = ({ index, children, bgImage }: { index: number, children: React.ReactNode, bgImage: string }) => (
    <div ref={pageRefs[index]} className="w-[1920px] h-[1080px] relative overflow-hidden shrink-0 font-sans bg-white">
      <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 p-20 flex flex-col z-10">
        {children}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden font-sans">
      {/* Left Panel: Editor (Orange Theme) */}
      <div className="w-1/2 border-r bg-[#FF6700] flex flex-col shadow-xl z-20 h-full overflow-hidden text-white">
        <div className="p-6 border-b border-white/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <img src="./logo.png" alt="Logo" className="h-8 w-auto brightness-0 invert" />
            <h1 className="font-bold text-xl uppercase tracking-wider">Editor</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={resetData} className="text-white hover:bg-white/20">
            <RefreshCcw size={18} />
          </Button>
        </div>

        <div ref={editorScrollRef} className="flex-1 overflow-y-auto p-8 space-y-12 pb-40">
          {/* Page 1 Editor */}
          <section ref={sectionRefs[0]} className="space-y-4">
            <div className="flex items-center gap-3 font-bold uppercase text-sm">
              <span className="w-6 h-6 rounded-full bg-white text-[#FF6700] flex items-center justify-center">1</span>
              Cover Page
            </div>
            <div className="space-y-2">
              <Label className="text-white">Main Title</Label>
              <Input 
                className="bg-white text-black h-14 text-xl font-bold" 
                value={data.page1.title} 
                onChange={(e) => handleInputChange('page1', 'title', e.target.value)}
              />
            </div>
          </section>

          {/* Page 2 Editor */}
          <section ref={sectionRefs[1]} className="space-y-4">
            <div className="flex items-center gap-3 font-bold uppercase text-sm">
              <span className="w-6 h-6 rounded-full bg-white text-[#FF6700] flex items-center justify-center">2</span>
              Question Page
            </div>
            <Textarea 
              className="bg-white text-black text-lg min-h-[150px]" 
              value={data.page2.content} 
              onChange={(e) => handleInputChange('page2', 'content', e.target.value)}
            />
            <div className="relative group border-2 border-dashed border-white/40 rounded-xl p-4 text-center cursor-pointer hover:bg-white/10 transition-colors">
              <ImageIcon className="mx-auto mb-2" />
              <span className="text-xs uppercase font-bold">Upload Question Image</span>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload('page2', e)} />
            </div>
          </section>

          {/* Page 3 Editor */}
          <section ref={sectionRefs[2]} className="space-y-4">
            <div className="flex items-center gap-3 font-bold uppercase text-sm">
              <span className="w-6 h-6 rounded-full bg-white text-[#FF6700] flex items-center justify-center">3</span>
              Solution Page
            </div>
            <Textarea 
              className="bg-white text-black text-lg min-h-[150px]" 
              value={data.page3.content} 
              onChange={(e) => handleInputChange('page3', 'content', e.target.value)}
            />
            <div className="relative group border-2 border-dashed border-white/40 rounded-xl p-4 text-center cursor-pointer hover:bg-white/10 transition-colors">
              <ImageIcon className="mx-auto mb-2" />
              <span className="text-xs uppercase font-bold">Upload Solution Image</span>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload('page3', e)} />
            </div>
          </section>
        </div>

        <div className="p-8 border-t border-white/20 shrink-0">
          <Button onClick={downloadPdf} className="w-full h-14 text-xl font-bold bg-white text-[#FF6700] hover:bg-slate-100" disabled={isDownloading}>
            {isDownloading ? <RefreshCcw className="mr-3 animate-spin" /> : <FileDown className="mr-3" />}
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div ref={previewScrollRef} className="w-1/2 bg-slate-200 h-full overflow-y-auto">
        <div className="p-12 flex flex-col items-center gap-12 min-h-full">
          <div className="flex flex-col gap-16 origin-top scale-[0.25] lg:scale-[0.2] xl:scale-[0.25] 2xl:scale-[0.3]">
            
            {/* Page 1 Preview */}
            <PageTemplate index={0} bgImage={TEMPLATE_IMAGES.cover}>
              <div className="flex-1 flex flex-col items-center justify-center text-center pb-40 pr-[550px]">
                <h1 className="text-[140px] font-black text-black leading-[1.1] max-w-[1000px] break-words line-clamp-3">
                  {data.page1.title}
                </h1>
              </div>
            </PageTemplate>

            {/* Page 2 Preview */}
            <PageTemplate index={1} bgImage={TEMPLATE_IMAGES.question}>
              <div className="flex flex-col h-full pt-20">
                <div className="flex-1 flex gap-16">
                  <div className="flex-1 pt-20 pl-10">
                    <div className="text-[55px] font-bold text-slate-700 leading-[1.4] whitespace-pre-wrap">
                      {data.page2.content}
                    </div>
                  </div>
                  <div className="w-[850px] h-full flex items-center justify-center -my-20 -mr-20">
                    {data.page2.image ? (
                      <img src={data.page2.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-[700px] h-[500px] border-8 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center bg-slate-100/50">
                        <ImageIcon size={100} className="text-slate-300" />
                        <span className="text-slate-400 text-4xl font-bold mt-4 uppercase">Image Placeholder</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PageTemplate>

            {/* Page 3 Preview */}
            <PageTemplate index={2} bgImage={TEMPLATE_IMAGES.solution}>
              <div className="flex flex-col h-full pt-20">
                <div className="flex-1 flex gap-16">
                  <div className="flex-1 pt-20 pl-10">
                    <div className="text-[55px] font-bold text-slate-700 leading-[1.4] whitespace-pre-wrap">
                      {data.page3.content}
                    </div>
                  </div>
                  <div className="w-[850px] h-full flex items-center justify-center -my-20 -mr-20">
                    {data.page3.image ? (
                      <img src={data.page3.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-[700px] h-[500px] border-8 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center bg-slate-100/50">
                        <ImageIcon size={100} className="text-slate-300" />
                        <span className="text-slate-400 text-4xl font-bold mt-4 uppercase">Image Placeholder</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PageTemplate>

          </div>
        </div>
      </div>
    </div>
  );
}
