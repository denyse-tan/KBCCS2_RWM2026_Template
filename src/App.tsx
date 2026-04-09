import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Trash2, Layout, FileDown, RefreshCcw } from 'lucide-react';
import { toPng } from 'html-to-image';
import pptxgen from "pptxgenjs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PageData { content: string; image: string | null; }
interface TemplateData { page1: { title: string }; page2: PageData; page3: PageData; }

const INITIAL_DATA: TemplateData = {
  page1: { title: 'REAL-WORLD MATH CHALLENGE' },
  page2: { content: 'A squirrel is flying a plane at 120 km/h...', image: null },
  page3: { content: 'Distance = Speed × Time...', image: null },
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
  const pageRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const handleInputChange = (page: keyof TemplateData, field: string, value: string) => {
    setData(prev => ({ ...prev, [page]: { ...prev[page], [field]: value } }));
  };

  const handleImageUpload = (page: 'page2' | 'page3', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setData(prev => ({ ...prev, [page]: { ...prev[page], image: reader.result as string } }));
      reader.readAsDataURL(file);
    }
  };

  const downloadPptx = async () => {
    setIsDownloading(true);
    await new Promise(r => setTimeout(r, 1000)); // Crucial for Title to show up
    try {
      let pptx = new pptxgen();
      pptx.layout = 'LAYOUT_WIDE';
      for (let i = 0; i < pageRefs.length; i++) {
        const ref = pageRefs[i].current;
        if (!ref) continue;
        const dataUrl = await toPng(ref, { pixelRatio: 2, width: 1920, height: 1080, cacheBust: true });
        pptx.addSlide().addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
      }
      await pptx.writeFile({ fileName: `Math_Challenge.pptx` });
    } catch (err) { console.error(err); } finally { setIsDownloading(false); }
  };

  const PageTemplate = ({ index, children, bgImage }: { index: number, children: React.ReactNode, bgImage: string }) => (
    <div ref={pageRefs[index]} className="w-[1920px] h-[1080px] relative overflow-hidden shrink-0 bg-white">
      <img src={bgImage} className="absolute inset-0 w-full h-full object-cover" alt="" />
      {/* Increased z-index for title visibility */}
      <div className="absolute inset-0 p-20 flex flex-col z-30">
        {children}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden font-sans">
      {/* Editor Panel - KooBits Orange */}
      <div className="w-1/2 border-r bg-[#FF6700] flex flex-col shadow-xl z-20 h-full text-white">
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Using the provided logo path - make sure logo.png is in /public */}
            <img src="./logo.png" alt="Logo" className="h-10 w-auto brightness-0 invert" />
            <h1 className="font-bold text-xl uppercase">Editor</h1>
          </div>
          <Button variant="ghost" onClick={() => setData(INITIAL_DATA)} className="text-white hover:bg-white/10"><RefreshCcw size={18} /></Button>
        </div>

        <div ref={editorScrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 pb-40">
          <div className="space-y-4">
            <Label className="text-white font-bold">1. Cover Title</Label>
            <Input className="bg-white text-black h-14 text-xl font-bold" value={data.page1.title} onChange={e => handleInputChange('page1', 'title', e.target.value)} />
          </div>

          <div className="space-y-4">
            <Label className="text-white font-bold">2. Question & Image</Label>
            <Textarea className="bg-white text-black text-lg min-h-[120px]" value={data.page2.content} onChange={e => handleInputChange('page2', 'content', e.target.value)} />
            <div className="relative border-2 border-dashed border-white/40 rounded-xl p-6 text-center cursor-pointer hover:bg-white/10">
              <ImageIcon className="mx-auto mb-2" />
              <span className="text-xs font-bold uppercase">Upload Image</span>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload('page2', e)} />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-white font-bold">3. Solution & Image</Label>
            <Textarea className="bg-white text-black text-lg min-h-[120px]" value={data.page3.content} onChange={e => handleInputChange('page3', 'content', e.target.value)} />
            <div className="relative border-2 border-dashed border-white/40 rounded-xl p-6 text-center cursor-pointer hover:bg-white/10">
              <ImageIcon className="mx-auto mb-2" />
              <span className="text-xs font-bold uppercase">Upload Image</span>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload('page3', e)} />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/20">
          <Button onClick={downloadPptx} className="w-full h-16 text-2xl font-bold bg-white text-[#FF6700] hover:bg-slate-100" disabled={isDownloading}>
            {isDownloading ? <RefreshCcw className="mr-3 animate-spin" /> : <FileDown className="mr-3" />}
            {isDownloading ? 'Stretching Images...' : 'Download .PPTX'}
          </Button>
        </div>
      </div>

      {/* Right Preview Panel */}
      <div ref={previewScrollRef} className="w-1/2 bg-slate-200 h-full overflow-y-auto p-12 flex flex-col items-center gap-12">
        <div className="flex flex-col gap-16 origin-top scale-[0.25] lg:scale-[0.22] xl:scale-[0.25] 2xl:scale-[0.3]">
          
          {/* Page 1 - Title Fix */}
          <PageTemplate index={0} bgImage={TEMPLATE_IMAGES.cover}>
            <div className="flex-1 flex flex-col items-center justify-center text-center pb-40 pr-[550px]">
              <h1 className="text-[140px] font-black text-black leading-[1.1] max-w-[1000px] break-words">
                {data.page1.title}
              </h1>
            </div>
          </PageTemplate>

          {/* Page 2 - Image Stretch */}
          <PageTemplate index={1} bgImage={TEMPLATE_IMAGES.question}>
            <div className="flex h-full pt-28">
              <div className="flex-1 pt-20 pl-14 text-[55px] font-bold text-slate-700 leading-[1.4] max-w-[800px]">{data.page2.content}</div>
              <div className="w-[880px] h-[780px] flex items-center justify-center -mt-10 mr-4">
                <div className="w-[820px] h-[720px] bg-white rounded-[40px] overflow-hidden border-[12px] border-white">
                  {data.page2.image ? <img src={data.page2.image} className="w-full h-full object-fill" /> : <div className="text-slate-200"><ImageIcon size={120} /></div>}
                </div>
              </div>
            </div>
          </PageTemplate>

          {/* Page 3 - Image Stretch */}
          <PageTemplate index={2} bgImage={TEMPLATE_IMAGES.solution}>
            <div className="flex h-full pt-28">
              <div className="flex-1 pt-20 pl-14 text-[55px] font-bold text-slate-700 leading-[1.4] max-w-[800px]">{data.page3.content}</div>
              <div className="w-[880px] h-[780px] flex items-center justify-center -mt-10 mr-4">
                <div className="w-[820px] h-[720px] bg-white rounded-[40px] overflow-hidden border-[12px] border-white">
                  {data.page3.image ? <img src={data.page3.image} className="w-full h-full object-fill" /> : <div className="text-slate-200"><ImageIcon size={120} /></div>}
                </div>
              </div>
            </div>
          </PageTemplate>

        </div>
      </div>
    </div>
  );
}
