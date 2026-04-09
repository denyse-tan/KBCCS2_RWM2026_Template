import React, { useState, useRef, useEffect } from 'react';
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
  cover: '/template1.png',
  question: '/template2.png',
  solution: '/template3.png',
};

export default function App() {
  const [data, setData] = useState<TemplateData>(INITIAL_DATA);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const scaledContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const pageRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  const isSyncing = useRef(false);

  const handleEditorScroll = () => {
    if (isSyncing.current) return;
    
    const editor = editorScrollRef.current;
    const preview = previewScrollRef.current;
    const scaledContainer = scaledContainerRef.current;
    if (!editor || !preview || !scaledContainer) return;

    // Determine which section is currently active in the editor
    const editorSections = sectionRefs.map(ref => ref.current);
    const scrollTop = editor.scrollTop;
    
    let activeIndex = 0;
    for (let i = 0; i < editorSections.length; i++) {
      const section = editorSections[i];
      if (section && section.offsetTop <= scrollTop + 300) {
        activeIndex = i;
      }
    }

    // Scroll preview to the corresponding page
    const targetPage = pageRefs[activeIndex].current;
    if (targetPage) {
      isSyncing.current = true;
      
      // Calculate actual scale dynamically
      const actualHeight = scaledContainer.getBoundingClientRect().height;
      const unscaledHeight = scaledContainer.scrollHeight;
      const currentScale = actualHeight / unscaledHeight;

      // Calculate target scroll position
      const targetScrollTop = (targetPage.offsetTop * currentScale) + 48;

      preview.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      
      setTimeout(() => { isSyncing.current = false; }, 500);
    }
  };

  const handleInputChange = (page: keyof TemplateData, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        [field]: value
      }
    }));
  };

  const handleImageUpload = (page: 'page2' | 'page3', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({
          ...prev,
          [page]: {
            ...prev[page],
            image: reader.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (page: 'page2' | 'page3') => {
    setData(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        image: null
      }
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

        const dataUrl = await toPng(ref, { 
          pixelRatio: 2,
          width: 1920,
          height: 1080
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
    if (window.confirm('Reset all data?')) {
      setData(INITIAL_DATA);
    }
  };

  const PageTemplate = ({ 
    index, 
    children, 
    bgImage
  }: { 
    index: number, 
    children: React.ReactNode, 
    bgImage: string
  }) => (
    <div 
      ref={pageRefs[index]}
      className="w-[1920px] h-[1080px] relative overflow-hidden shrink-0 font-sans bg-white"
    >
      {/* Content Overlay */}
      <div className="absolute inset-0 p-20 flex flex-col z-10">
        {children}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden font-sans">
      {/* Left Panel: Editor (50%) */}
      <div className="w-1/2 border-r bg-white flex flex-col shadow-xl z-20 h-full overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Layout className="text-primary" size={24} />
            <h1 className="font-bold text-xl">Editor</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={resetData}>
            <RefreshCcw size={18} />
          </Button>
        </div>

        <div 
          ref={editorScrollRef}
          onScroll={handleEditorScroll}
          className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth"
        >
          <div className="p-8 space-y-24 pb-40">
            {/* Page 1 Editor */}
            <section ref={sectionRefs[0]} className="relative p-10 rounded-3xl overflow-hidden border shadow-lg min-h-[400px] flex flex-col justify-center bg-slate-50">
              <img src={TEMPLATE_IMAGES.cover} className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" referrerPolicy="no-referrer" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 text-primary font-bold uppercase text-sm tracking-widest">
                  <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-base">1</span>
                  Cover Page
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold">Main Title</Label>
                  <Input 
                    className="h-16 text-2xl font-black border-2 focus:border-primary transition-all bg-white/80 backdrop-blur-sm"
                    value={data.page1.title}
                    onChange={(e) => handleInputChange('page1', 'title', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Page 2 Editor */}
            <section ref={sectionRefs[1]} className="relative p-10 rounded-3xl overflow-hidden border shadow-lg min-h-[600px] flex flex-col justify-center bg-slate-50">
              <img src={TEMPLATE_IMAGES.question} className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" referrerPolicy="no-referrer" />
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3 text-primary font-bold uppercase text-sm tracking-widest">
                  <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-base">2</span>
                  Question Page
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold">Question Text</Label>
                  <Textarea 
                    className="text-xl min-h-[250px] border-2 focus:border-primary transition-all bg-white/80 backdrop-blur-sm leading-relaxed"
                    value={data.page2.content}
                    onChange={(e) => handleInputChange('page2', 'content', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold">Illustration (Right Side)</Label>
                  {!data.page2.image ? (
                    <div className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-3 bg-white/50 hover:bg-white/80 transition-all cursor-pointer relative group">
                      <ImageIcon className="text-muted-foreground group-hover:text-primary transition-colors" size={40} />
                      <span className="text-sm font-bold uppercase tracking-wider">Upload Image</span>
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload('page2', e)} />
                    </div>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden border-2 shadow-md">
                      <img src={data.page2.image} alt="Preview" className="w-full h-64 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="lg" className="h-12 px-6 font-bold" onClick={() => removeImage('page2')}>
                          <Trash2 className="mr-2" size={20} />
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Page 3 Editor */}
            <section ref={sectionRefs[2]} className="relative p-10 rounded-3xl overflow-hidden border shadow-lg min-h-[600px] flex flex-col justify-center bg-slate-50">
              <img src={TEMPLATE_IMAGES.solution} className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" referrerPolicy="no-referrer" />
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3 text-primary font-bold uppercase text-sm tracking-widest">
                  <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-base">3</span>
                  Solution Page
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold">Solution Text</Label>
                  <Textarea 
                    className="text-xl min-h-[250px] border-2 focus:border-primary transition-all bg-white/80 backdrop-blur-sm leading-relaxed"
                    value={data.page3.content}
                    onChange={(e) => handleInputChange('page3', 'content', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold">Illustration (Right Side)</Label>
                  {!data.page3.image ? (
                    <div className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-3 bg-white/50 hover:bg-white/80 transition-all cursor-pointer relative group">
                      <ImageIcon className="text-muted-foreground group-hover:text-primary transition-colors" size={40} />
                      <span className="text-sm font-bold uppercase tracking-wider">Upload Image</span>
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload('page3', e)} />
                    </div>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden border-2 shadow-md">
                      <img src={data.page3.image} alt="Preview" className="w-full h-64 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="lg" className="h-12 px-6 font-bold" onClick={() => removeImage('page3')}>
                          <Trash2 className="mr-2" size={20} />
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 shrink-0">
          <Button 
            onClick={downloadPdf} 
            className="w-full h-14 text-xl font-bold shadow-lg" 
            size="lg"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <RefreshCcw className="mr-3 animate-spin" size={24} />
            ) : (
              <FileDown className="mr-3" size={24} />
            )}
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Right Panel: Continuous Preview (50%) */}
      <div 
        ref={previewScrollRef}
        className="w-1/2 bg-slate-200 h-full overflow-y-auto custom-scrollbar scroll-smooth"
      >
        <div className="p-12 flex flex-col items-center gap-12 min-h-full">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm mb-4">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Continuous Preview</span>
          </div>

          {/* Scaled down container for preview */}
          <div 
            ref={scaledContainerRef}
            className="flex flex-col gap-16 origin-top scale-[0.25] lg:scale-[0.2] xl:scale-[0.25] 2xl:scale-[0.3]"
          >
            
            {/* Page 1 */}
            <PageTemplate index={0} bgImage={TEMPLATE_IMAGES.cover}>
              <div className="flex-1 flex flex-col items-center justify-center text-center pb-40 pr-80">
                <h1 className="text-[160px] font-black text-[#635BFF] leading-[1.1] max-w-[1200px] drop-shadow-sm">
                  {data.page1.title}
                </h1>
              </div>
            </PageTemplate>

            {/* Page 2 */}
            <PageTemplate index={1} bgImage={TEMPLATE_IMAGES.question}>
              <div className="flex flex-col h-full pt-20">
                <div className="flex-1 flex gap-16">
                  <div className="flex-1 flex flex-col gap-10 pt-20 pl-10">
                    <div className="text-[55px] font-bold text-slate-600 leading-[1.4] whitespace-pre-wrap">
                      {data.page2.content}
                    </div>
                  </div>
                  <div className="w-[850px] h-full flex items-center justify-center -my-20 -mr-20">
                    {data.page2.image && (
                      <div className="w-full h-full bg-white flex items-center justify-center">
                        <img src={data.page2.image} alt="Question" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PageTemplate>

            {/* Page 3 */}
            <PageTemplate index={2} bgImage={TEMPLATE_IMAGES.solution}>
              <div className="flex flex-col h-full pt-20">
                <div className="flex-1 flex gap-16">
                  <div className="flex-1 flex flex-col gap-10 pt-20 pl-10">
                    <div className="text-[55px] font-bold text-slate-600 leading-[1.4] whitespace-pre-wrap">
                      {data.page3.content}
                    </div>
                  </div>
                  <div className="w-[850px] h-full flex items-center justify-center -my-20 -mr-20">
                    {data.page3.image && (
                      <div className="w-full h-full bg-white flex items-center justify-center">
                        <img src={data.page3.image} alt="Solution" className="w-full h-full object-cover" />
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
