"use client";

import { useEffect } from "react";
import { FileText, Shield, Users, Database, FileSearch, CreditCard, Clock, AlertCircle, Mail, Phone, MapPin, BookOpen, Scale, FileCheck } from "lucide-react";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function PAIAPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <BackToHomeButton />
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-full bg-gold/20 mb-4">
            <FileText className="text-gold" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">PAIA Manual</h1>
          <p className="text-white/50">Promotion of Access to Information Act (Act No. 2 of 2000)</p>
          <p className="text-white/60 mt-2 max-w-2xl mx-auto">Section 51 Manual for Private Bodies – ZeusTech (Pty) Ltd</p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Introduction & Company Information */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Shield size={20} /> 1. Company Information</h2>
            <div className="space-y-2 text-white/70">
              <p><strong className="text-gold">Company Name:</strong> ZeusTech (Pty) Ltd</p>
              <p><strong className="text-gold">Registration Number:</strong> 2025/79478/07</p>
              <p><strong className="text-gold">Trading As:</strong> STEEZE</p>
              <p><strong className="text-gold">Physical Address:</strong> 25 Quantum St, Techno Park, Stellenbosch, 7600, South Africa</p>
              <p><strong className="text-gold">Postal Address:</strong> 25 Quantum St, Techno Park, Stellenbosch, 7600</p>
              <p><strong className="text-gold">Phone:</strong> <a href="tel:+27796288382" className="hover:text-gold">+27 79 628 8382</a></p>
              <p><strong className="text-gold">Email:</strong> <a href="mailto:paia@steeze.com" className="hover:text-gold">paia@steeze.com</a></p>
              <p><strong className="text-gold">Website:</strong> <a href="https://steeze.com" className="hover:text-gold">www.steeze.com</a></p>
            </div>
          </div>

          {/* Section 2: Information Officer */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Shield size={20} /> 2. Information Officer</h2>
            <p className="text-white/70 mb-2">The Information Officer is responsible for responding to PAIA requests and ensuring compliance.</p>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white"><strong className="text-gold">Name:</strong> Oghenetega Blondy Obebeduo</p>
              <p className="text-white"><strong className="text-gold">Email:</strong> <a href="mailto:paia@steeze.com" className="hover:text-gold">paia@steeze.com</a></p>
              <p className="text-white"><strong className="text-gold">Phone:</strong> <a href="tel:+27796288382" className="hover:text-gold">+27 79 628 8382</a></p>
            </div>
            <p className="text-white/60 text-sm mt-2">The Information Officer has been duly appointed in accordance with POPIA and PAIA.</p>
          </div>

          {/* Section 3: Guide on How to Use PAIA */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><BookOpen size={20} /> 3. Guide on How to Use PAIA</h2>
            <p className="text-white/70 mb-2">The South African Human Rights Commission (SAHRC) has published a guide on how to use PAIA. This guide is available:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>At the SAHRC website: <a href="https://www.sahrc.org.za" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">www.sahrc.org.za</a></li>
              <li>From the Information Regulator of South Africa</li>
              <li>Request a copy from our Information Officer</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">The guide explains the purpose of PAIA, how to request access, and the remedies available.</p>
          </div>

          {/* Section 4: Records Available Without Request */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><FileText size={20} /> 4. Records Available Without Request</h2>
            <p className="text-white/70 mb-2">The following records are automatically available (no formal PAIA request needed):</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Privacy Policy (available at <a href="/privacy" className="text-gold hover:underline">/privacy</a>)</li>
              <li>Terms of Service (available at <a href="/terms" className="text-gold hover:underline">/terms</a>)</li>
              <li>Cookie Policy (available at <a href="/cookies" className="text-gold hover:underline">/cookies</a>)</li>
              <li>Data Processing Agreement (available at <a href="/dpa" className="text-gold hover:underline">/dpa</a>)</li>
              <li>Company information and contact details</li>
              <li>Published content on the STEEZE platform</li>
            </ul>
          </div>

          {/* Section 5: Records That May Be Requested */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Database size={20} /> 5. Records That May Be Requested</h2>
            <p className="text-white/70 mb-2">The following categories of records may be requested under PAIA:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li><strong className="text-gold">User Data:</strong> Personal information of requestor (access via Settings → Data Export)</li>
              <li><strong className="text-gold">Contractual Records:</strong> Agreements with third-party service providers</li>
              <li><strong className="text-gold">Operational Records:</strong> Internal policies and procedures</li>
              <li><strong className="text-gold">Financial Records:</strong> Transaction records, invoices</li>
              <li><strong className="text-gold">Communication Records:</strong> Support tickets, correspondence</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">Note: Some records may be exempt from disclosure under PAIA (e.g., trade secrets, privacy of third parties).</p>
          </div>

          {/* Section 6: Request Procedure */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><FileSearch size={20} /> 6. Request Procedure</h2>
            <p className="text-white/70 mb-3">To request access to records, please follow these steps:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">1</div><p className="text-white/70">Complete the prescribed <strong className="text-gold">Form C</strong> (Request for Access to Record)</p></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">2</div><p className="text-white/70">Submit the form to our Information Officer via email or post</p></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">3</div><p className="text-white/70">Pay the prescribed request fee (if applicable)</p></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">4</div><p className="text-white/70">Await response within 30 days (may be extended to 60 days)</p></div>
            </div>
            <p className="text-white/60 text-sm mt-3">Form C can be downloaded from the Information Regulator website or requested from our Information Officer.</p>
          </div>

          {/* Section 7: Fees */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><CreditCard size={20} /> 7. Fees</h2>
            <p className="text-white/70 mb-2">The following fees apply to PAIA requests (as prescribed by the Department of Justice):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-white/70">Fee Type</th>
                    <th className="text-left p-2 text-white/70">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5"><td className="p-2 text-white/70">Request fee (non-refundable)</td><td className="p-2 text-white/70">R15.00</td></tr>
                  <tr className="border-b border-white/5"><td className="p-2 text-white/70">Photocopy per A4 page</td><td className="p-2 text-white/70">R1.10</td></tr>
                  <tr className="border-b border-white/5"><td className="p-2 text-white/70">Printed copy per A4 page</td><td className="p-2 text-white/70">R2.00</td></tr>
                  <tr className="border-b border-white/5"><td className="p-2 text-white/70">CD or DVD per copy</td><td className="p-2 text-white/70">R12.00</td></tr>
                  <tr><td className="p-2 text-white/70">Postage (if applicable)</td><td className="p-2 text-white/70">Actual cost</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-white/60 text-sm mt-2">Fees may be updated from time to time. The prescribed fee is payable before processing the request.</p>
          </div>

          {/* Section 8: Decision and Grounds for Refusal */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><AlertCircle size={20} /> 8. Decision and Grounds for Refusal</h2>
            <p className="text-white/70 mb-2">The Information Officer will respond within 30 days of receiving a valid request. Grounds for refusal may include:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Protection of personal information of third parties</li>
              <li>Trade secrets and commercial information</li>
              <li>Security of the platform</li>
              <li>Legal privilege</li>
              <li>Repeated or frivolous requests</li>
            </ul>
          </div>

          {/* Section 9: Remedies */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Scale size={20} /> 9. Remedies</h2>
            <p className="text-white/70 mb-2">If you are dissatisfied with the response, you have the following remedies:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li><strong className="text-gold">Internal Appeal:</strong> Submit an appeal to the Information Officer within 30 days</li>
              <li><strong className="text-gold">External Complaint:</strong> Lodge a complaint with the Information Regulator of South Africa</li>
              <li><strong className="text-gold">Court Application:</strong> Apply to a court for relief</li>
            </ul>
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <p className="text-white/60 text-sm"><strong className="text-gold">Information Regulator of South Africa</strong></p>
              <p className="text-white/50 text-xs">JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
              <p className="text-white/50 text-xs">Tel: <a href="tel:+27104061468" className="hover:text-gold">+27 10 406 1468</a></p>
              <p className="text-white/50 text-xs">Email: <a href="mailto:inforeg@justice.gov.za" className="hover:text-gold">inforeg@justice.gov.za</a></p>
              <p className="text-white/50 text-xs">Website: <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="hover:text-gold">www.justice.gov.za/inforeg/</a></p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-6">
            <p className="text-white/40 text-sm">This PAIA Manual is prepared in accordance with Section 51 of the Promotion of Access to Information Act, No. 2 of 2000.</p>
            <p className="text-white/40 text-xs mt-2">© {new Date().getFullYear()} STEEZE – Powered by ZeusLiveStudio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}