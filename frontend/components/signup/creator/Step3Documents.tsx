"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Upload, AlertCircle, FileText } from "lucide-react";

interface Step3DocumentsProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  markComplete: () => void;
}

export default function Step3Documents({ data, updateData, onNext, onBack, markComplete }: Step3DocumentsProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [idType, setIdType] = useState(data.idType || "passport");
  const [idFile, setIdFile] = useState<File | null>(data.idFile || null);
  const [idPreview, setIdPreview] = useState(data.idPreview || null);
  const [idNumber, setIdNumber] = useState(data.idNumber || "");
  const [country, setCountry] = useState(data.country || "");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const idTypes = [
    { value: "passport", label: "Passport" },
    { value: "drivers_license", label: "Driver's License" },
    { value: "national_id", label: "National ID" },
  ];

  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, idFile: "File size must be less than 5MB" });
      return;
    }
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 10;
      });
    }, 50);
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdFile(file);
      setIdPreview(reader.result as string);
      updateData({ idType, idFile: file, idPreview: reader.result, idNumber, country });
      clearInterval(interval);
      setUploadProgress(100);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!idFile) newErrors.idFile = "Please upload your ID document";
    if (!idNumber) newErrors.idNumber = "ID number is required";
    if (!country) newErrors.country = "Country is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Determine creator type from parent data
      const creatorType = (data as any).creatorType || 'independent_creator';
      const userType = creatorType === 'zls' ? 'zls_artist' : 'independent_creator';

      // Get user data from parent component props
      const email = (data as any).email || '';
      const password = (data as any).password || '';
      const fullName = (data as any).fullName || '';
      const phoneNumber = (data as any).phoneNumber || '';
      const username = (data as any).username || '';
      const artistName = (data as any).artistName || '';
      const genre = (data as any).genre || '';
      const contractSigned = (data as any).contractSigned || false;

      // Validate required fields from previous steps
      if (!email || !password || !fullName) {
        setUploadError('Please complete all required fields in previous steps first.');
        return;
      }

      // Append all data to FormData
      formData.append('userType', userType);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('fullName', fullName);
      if (phoneNumber) formData.append('phoneNumber', phoneNumber);
      if (username) formData.append('username', username);
      if (artistName) formData.append('artistName', artistName);
      if (genre) formData.append('genre', genre);
      if (contractSigned) formData.append('contractSigned', 'true');

      // Append the ID document file
      if (idFile) {
        formData.append('idDocument', idFile);
      } else {
        setUploadError('Please upload your ID document first.');
        return;
      }

      // Store additional user data
      const additionalData = {
        idType,
        idNumber,
        country,
        birthDate: (data as any).birthDate,
        age: (data as any).age,
        consents: (data as any).consents
      };
      formData.append('userData', JSON.stringify(additionalData));

      // Make API call
      const response = await fetch(`${API_URL}/api/verification/register-step1`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.userId) {
        // Mark step as complete
        markComplete();
        // Redirect to selfie page with userId
        window.location.href = `/verification/selfie?userId=${result.userId}`;
      } else {
        setUploadError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Network error. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-gold flex-shrink-0" size={20} />
        <p className="text-white/70 text-sm">Your identity information is encrypted and secure. Admin will review your documents within 24-48 hours. STEEZE requires real identities to maintain a platform with no fake accounts.</p>
      </div>

      <div>
        <label className="block text-white/80 text-sm mb-2">ID Type <span className="text-gold">*</span></label>
        <div className="flex gap-4">
          {idTypes.map((type) => (
            <button key={type.value} type="button" onClick={() => { setIdType(type.value); updateData({ idType: type.value, idFile, idPreview, idNumber, country }); }}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${idType === type.value ? "bg-gold text-black" : "bg-white/10 text-white/70"}`}>
              <FileText size={16} /> {type.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/80 text-sm mb-2">Upload ID Document <span className="text-gold">*</span></label>
        <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${idFile ? "border-green-500 bg-green-500/10" : errors.idFile ? "border-red-500" : "border-white/30 hover:border-gold"}`} onClick={() => fileInputRef.current?.click()}>
          {idPreview ? (
            <div><img src={idPreview} alt="ID Preview" className="max-h-40 mx-auto rounded-lg mb-2" /><p className="text-green-400 text-sm">Document uploaded ✓</p></div>
          ) : (
            <div><Upload className="mx-auto text-white/40 mb-2" size={32} /><p className="text-white/50">Click to upload your {idType.replace("_", " ")}</p>
              <p className="text-white/30 text-xs mt-1">JPG, PNG, or PDF. Max 5MB.</p>
              {uploadProgress > 0 && uploadProgress < 100 && (<div className="w-full bg-white/20 rounded-full h-2 mt-3"><div className="bg-gold h-2 rounded-full" style={{ width: `${uploadProgress}%` }} /></div>)}
            </div>
          )}
        </div>
        <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />
        {errors.idFile && <p className="text-red-500 text-sm mt-2">{errors.idFile}</p>}
      </div>

      <div>
        <label className="block text-white/80 text-sm mb-1">ID Number <span className="text-gold">*</span></label>
        <input type="text" value={idNumber} onChange={(e) => { setIdNumber(e.target.value); updateData({ idType, idFile, idPreview, idNumber: e.target.value, country }); }}
          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.idNumber ? "border-red-500" : "border-white/20"}`}
          placeholder="Enter your ID number" />
        {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>}
      </div>

      <div>
        <label className="block text-white/80 text-sm mb-1">Country of Residence <span className="text-gold">*</span></label>
        <input type="text" value={country} onChange={(e) => { setCountry(e.target.value); updateData({ idType, idFile, idPreview, idNumber, country: e.target.value }); }}
          className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:border-gold ${errors.country ? "border-red-500" : "border-white/20"}`}
          placeholder="e.g., South Africa, Nigeria, Kenya" />
        {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
      </div>

      {uploadError && (
        <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm text-center">{uploadError}</p>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-white/10">
        <button type="button" onClick={onBack} className="px-8 py-3 border border-white/30 text-white rounded-full hover:border-gold transition-all flex items-center gap-2">
          <ChevronLeft size={18} /> Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={uploading}
          className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Next Step <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}