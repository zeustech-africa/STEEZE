"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Video, X, Music } from "lucide-react";

interface Step2MediaProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  markComplete: () => void;
}

export default function Step2Media({ data, updateData, onNext, onBack, markComplete }: Step2MediaProps) {
  const [photos, setPhotos] = useState(
    data.photos || Array(6).fill(null).map(() => ({ file: null, story: "", preview: null }))
  );
  const [coverType, setCoverType] = useState(data.coverType || "image");
  const [coverFile, setCoverFile] = useState<File | null>(data.coverFile || null);
  const [coverPreview, setCoverPreview] = useState(data.coverPreview || null);
  const [coverCaption, setCoverCaption] = useState(data.coverCaption || "");
  const [demoSong, setDemoSong] = useState<{ file: File | null; title: string; preview: string | null }>({
    file: null,
    title: "",
    preview: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const demoSongInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newPhotos = [...photos];
      newPhotos[index] = { file, story: newPhotos[index].story, preview: reader.result as string };
      setPhotos(newPhotos);
      updateData({ photos: newPhotos, coverType, coverFile, coverPreview, coverCaption, demoSong });
    };
    reader.readAsDataURL(file);
  };

  const updatePhotoStory = (index: number, story: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], story };
    setPhotos(newPhotos);
    updateData({ photos: newPhotos, coverType, coverFile, coverPreview, coverCaption, demoSong });
  };

  const handleCoverUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverFile(file);
      setCoverPreview(reader.result as string);
      updateData({ photos, coverType, coverFile: file, coverPreview: reader.result, coverCaption, demoSong });
    };
    reader.readAsDataURL(file);
  };

  const handleDemoSongUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setDemoSong({ ...demoSong, file, preview: reader.result as string });
      updateData({ photos, coverType, coverFile, coverPreview, coverCaption, demoSong: { ...demoSong, file, preview: reader.result as string } });
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const missingPhotos = photos.filter((p: { file: File | null; story: string; preview: string | null }) => !p.file).length;
    if (missingPhotos > 0) newErrors.photos = `Please upload all 6 photos (${missingPhotos} missing)`;
    if (!coverFile) newErrors.cover = `Please upload a cover ${coverType === "video" ? "video" : "image"}`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      markComplete();
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      {/* 6 Photos with Stories */}
      <div>
        <h3 className="text-white font-semibold mb-4">Gallery Photos (6 required)</h3>
        <p className="text-white/40 text-sm mb-4">Each photo will appear in your gallery with its story</p>
        <div className="grid md:grid-cols-2 gap-4">
          {photos.map((photo: { file: File | null; story: string; preview: string | null }, idx: number) => (
            <div key={idx} className="border border-white/20 rounded-lg p-4 bg-white/5">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => fileInputRefs.current[idx]?.click()}>
                  {photo.preview ? (
                    <img src={photo.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={24} className="text-white/40 mx-auto" />
                      <p className="text-white/30 text-xs mt-1">Photo {idx + 1}</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" ref={(el) => { fileInputRefs.current[idx] = el; }} onChange={(e) => e.target.files?.[0] && handlePhotoUpload(idx, e.target.files[0])} className="hidden" />
                <div className="flex-1">
                  <textarea placeholder="Tell the story behind this photo..." value={photo.story} onChange={(e) => updatePhotoStory(idx, e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm" rows={3} />
                </div>
                {photo.preview && (
                  <button onClick={() => { const newPhotos = [...photos]; newPhotos[idx] = { file: null, story: "", preview: null }; setPhotos(newPhotos); }} className="text-white/40 hover:text-red-500">
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {errors.photos && <p className="text-red-500 text-sm mt-2">{errors.photos}</p>}
      </div>

      {/* Demo Song (Optional) */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-white font-semibold mb-4">Demo Song (Optional)</h3>
        <div className="border-2 border-dashed border-white/30 rounded-lg p-4 text-center cursor-pointer hover:border-gold transition-all" onClick={() => demoSongInputRef.current?.click()}>
          {demoSong.preview ? (
            <div>
              <Music className="mx-auto text-gold mb-2" size={32} />
              <p className="text-gold text-sm">{demoSong.title || "Demo song uploaded"}</p>
              <audio controls src={demoSong.preview} className="mt-2 w-full" />
            </div>
          ) : (
            <div>
              <Upload className="mx-auto text-white/40 mb-2" size={24} />
              <p className="text-white/50 text-sm">Upload a demo song (MP3)</p>
            </div>
          )}
        </div>
        <input type="file" accept="audio/*" ref={demoSongInputRef} onChange={(e) => e.target.files?.[0] && handleDemoSongUpload(e.target.files[0])} className="hidden" />
        {demoSong.preview && (
          <input type="text" placeholder="Song title" value={demoSong.title} onChange={(e) => setDemoSong({ ...demoSong, title: e.target.value })}
            className="mt-3 w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold" />
        )}
      </div>

      {/* Cover Section */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-white font-semibold mb-4">Hero Cover (required)</h3>
        <div className="flex gap-4 mb-4">
          <button type="button" onClick={() => setCoverType("image")} className={`px-4 py-2 rounded-lg transition-all ${coverType === "image" ? "bg-gold text-black" : "bg-white/10 text-white/70"}`}>
            <ImageIcon size={16} className="inline mr-2" /> Image Cover
          </button>
          <button type="button" onClick={() => setCoverType("video")} className={`px-4 py-2 rounded-lg transition-all ${coverType === "video" ? "bg-gold text-black" : "bg-white/10 text-white/70"}`}>
            <Video size={16} className="inline mr-2" /> Video Cover
          </button>
        </div>

        <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer hover:border-gold transition-all" onClick={() => coverInputRef.current?.click()}>
          {coverPreview ? (
            coverType === "image" ? (
              <img src={coverPreview} alt="Cover preview" className="max-h-48 mx-auto rounded-lg" />
            ) : (
              <video src={coverPreview} controls className="max-h-48 mx-auto rounded-lg" />
            )
          ) : (
            <div>
              <Upload className="mx-auto text-white/40 mb-2" size={32} />
              <p className="text-white/50">Click to upload {coverType === "video" ? "video" : "image"}</p>
              <p className="text-white/30 text-xs mt-1">Recommended: 16:9 ratio, max 10MB</p>
            </div>
          )}
        </div>
        <input type="file" accept={coverType === "video" ? "video/*" : "image/*"} ref={coverInputRef} onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} className="hidden" />

        <div className="mt-4">
          <input type="text" placeholder="Cover caption (optional)" value={coverCaption} onChange={(e) => { setCoverCaption(e.target.value); updateData({ photos, coverType, coverFile, coverPreview, coverCaption: e.target.value, demoSong }); }}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold" />
        </div>
        {errors.cover && <p className="text-red-500 text-sm mt-2">{errors.cover}</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-white/10">
        <button onClick={onBack} className="px-8 py-3 border border-white/30 text-white rounded-full hover:border-gold transition-all flex items-center gap-2">
          <ChevronLeft size={18} /> Back
        </button>
        <button onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-2">
          Next Step <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}