"use client";

import { useEffect } from "react";
import { 
  Shield, AlertTriangle, Users, Eye, 
  Lock, RefreshCw, FileText, Bell, 
  Clock, Phone, Mail,
  Bug, UserCheck, FileCheck,
} from "lucide-react";
import BackToHomeButton from "@/components/BackToHomeButton";

export default function IncidentResponsePage() {
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
            <Shield className="text-gold" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">Incident Response Plan</h1>
          <p className="text-white/50">Version 1.0 | Last Updated: May 15, 2026</p>
          <p className="text-white/60 mt-2 max-w-2xl mx-auto">STEEZE's comprehensive plan for detecting, responding to, and recovering from security incidents.</p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Purpose */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><FileText size={20} /> 1. Purpose</h2>
            <p className="text-white/70 mb-2">The purpose of this Incident Response Plan (IRP) is to establish a structured approach for detecting, responding to, and recovering from security incidents that may affect STEEZE, its users, or its infrastructure.</p>
            <p className="text-white/60 text-sm">This plan ensures:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4 mt-2">
              <li>Rapid detection and containment of security incidents</li>
              <li>Minimization of damage to users and platform</li>
              <li>Compliance with POPIA, GDPR, and other regulations</li>
              <li>Timely notification of affected users and regulators</li>
              <li>Continuous improvement through post-incident reviews</li>
            </ul>
          </div>

          {/* Section 2: Definitions */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><AlertTriangle size={20} /> 2. Definitions</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div><p className="text-gold font-semibold">Security Incident:</p><p className="text-white/60 text-sm">Any event that compromises the confidentiality, integrity, or availability of STEEZE systems or user data.</p></div>
              <div><p className="text-gold font-semibold">Data Breach:</p><p className="text-white/60 text-sm">Unauthorized access, disclosure, or acquisition of personal information.</p></div>
              <div><p className="text-gold font-semibold">MTD:</p><p className="text-white/60 text-sm">Maximum Tolerable Downtime – 4 hours for critical systems</p></div>
              <div><p className="text-gold font-semibold">RTO:</p><p className="text-white/60 text-sm">Recovery Time Objective – 2 hours for critical systems</p></div>
              <div><p className="text-gold font-semibold">RPO:</p><p className="text-white/60 text-sm">Recovery Point Objective – 15 minutes for database backups</p></div>
            </div>
          </div>

          {/* Section 3: Incident Response Team */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Users size={20} /> 3. Incident Response Team</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3"><p className="text-gold font-semibold">Incident Commander</p><p className="text-white/60 text-sm">ZeusTech CEO – Overall coordination and decision-making</p></div>
              <div className="bg-white/5 rounded-lg p-3"><p className="text-gold font-semibold">Security Lead</p><p className="text-white/60 text-sm">Security Specialist – Technical investigation and containment</p></div>
              <div className="bg-white/5 rounded-lg p-3"><p className="text-gold font-semibold">Communications Lead</p><p className="text-white/60 text-sm">PR/Communications – User notifications and public statements</p></div>
              <div className="bg-white/5 rounded-lg p-3"><p className="text-gold font-semibold">Legal Lead</p><p className="text-white/60 text-sm">Legal Counsel – Regulatory compliance and liability</p></div>
              <div className="bg-white/5 rounded-lg p-3"><p className="text-gold font-semibold">Technical Lead</p><p className="text-white/60 text-sm">Lead Developer – System restoration and patches</p></div>
              <div className="bg-white/5 rounded-lg p-3"><p className="text-gold font-semibold">Data Protection Officer</p><p className="text-white/60 text-sm">DPO – POPIA/GDPR compliance and regulator notification</p></div>
            </div>
            <p className="text-white/60 text-sm mt-3">Contact details for the incident response team are maintained securely and are available to authorized personnel only.</p>
          </div>

          {/* Section 4: Incident Types and Severity Levels */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><AlertTriangle size={20} /> 4. Incident Types and Severity Levels</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-white/70">Severity</th>
                    <th className="text-left p-2 text-white/70">Description</th>
                    <th className="text-left p-2 text-white/70">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5"><td className="p-2"><span className="text-red-500 font-bold">CRITICAL</span></td><td className="p-2 text-white/60">Data breach, unauthorized access, ransomware</td><td className="p-2 text-white/60">Immediate (15 min)</td></tr>
                  <tr className="border-b border-white/5"><td className="p-2"><span className="text-orange-500 font-bold">HIGH</span></td><td className="p-2 text-white/60">DDoS attack, system outage, account takeover</td><td className="p-2 text-white/60">30 minutes</td></tr>
                  <tr className="border-b border-white/5"><td className="p-2"><span className="text-yellow-500 font-bold">MEDIUM</span></td><td className="p-2 text-white/60">Suspicious activity, attempted intrusion</td><td className="p-2 text-white/60">2 hours</td></tr>
                  <tr className="border-b border-white/5"><td className="p-2"><span className="text-blue-500 font-bold">LOW</span></td><td className="p-2 text-white/60">Spam, phishing attempts, minor policy violations</td><td className="p-2 text-white/60">24 hours</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Detection and Analysis */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Eye size={20} /> 5. Detection and Analysis</h2>
            <p className="text-white/70 mb-2">STEEZE employs multiple detection mechanisms:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li><strong className="text-gold">Automated Monitoring:</strong> 24/7 system health monitoring and alerting</li>
              <li><strong className="text-gold">Bot Detection:</strong> Real-time bot behavior analysis</li>
              <li><strong className="text-gold">Rate Limiting:</strong> Automated detection of brute force attempts</li>
              <li><strong className="text-gold">User Reports:</strong> Users can report suspicious content or activity</li>
              <li><strong className="text-gold">Internal Audits:</strong> Regular security audits and penetration testing</li>
              <li><strong className="text-gold">Third-party Monitoring:</strong> External security services</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">Upon detection, the incident is logged and classified according to severity. The incident response team is notified immediately for CRITICAL and HIGH severity incidents.</p>
          </div>

          {/* Section 6: Containment */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Lock size={20} /> 6. Containment</h2>
            <div className="space-y-2">
              <p className="text-white/70"><strong className="text-gold">Immediate Actions:</strong></p>
              <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
                <li>Isolate affected systems from the network</li>
                <li>Revoke compromised credentials</li>
                <li>Enable emergency kill switch (admin feature)</li>
                <li>Block malicious IP addresses</li>
                <li>Take affected services offline if necessary</li>
              </ul>
              <p className="text-white/70 mt-2"><strong className="text-gold">Short-term Actions:</strong></p>
              <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
                <li>Collect forensic evidence</li>
                <li>Preserve logs and system state</li>
                <li>Identify affected users and data</li>
              </ul>
            </div>
          </div>

          {/* Section 7: Eradication */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Bug size={20} /> 7. Eradication</h2>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Remove malware or backdoors from affected systems</li>
              <li>Patch vulnerabilities that enabled the incident</li>
              <li>Update firewall rules and security configurations</li>
              <li>Reset passwords for affected accounts</li>
              <li>Apply security patches across all systems</li>
            </ul>
          </div>

          {/* Section 8: Recovery */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><RefreshCw size={20} /> 8. Recovery</h2>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Restore systems from clean backups</li>
              <li>Verify system integrity before reconnecting</li>
              <li>Monitor for signs of reinfection</li>
              <li>Communicate restoration progress to users</li>
              <li>Gradually restore services to normal operations</li>
            </ul>
          </div>

          {/* Section 9: Breach Notification (POPIA/GDPR) */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Bell size={20} /> 9. Breach Notification (POPIA/GDPR)</h2>
            <p className="text-white/70 mb-2">In the event of a personal data breach, STEEZE follows these notification requirements:</p>
            <div className="bg-white/5 rounded-lg p-4 mb-3">
              <p className="text-white/80"><strong className="text-gold">Notification to Information Regulator (South Africa):</strong></p>
              <p className="text-white/70">Within 72 hours of becoming aware of the breach, as required by POPIA Section 22.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 mb-3">
              <p className="text-white/80"><strong className="text-gold">Notification to Affected Users:</strong></p>
              <p className="text-white/70">Without unreasonable delay, describing the nature of the breach and recommended actions.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/80"><strong className="text-gold">Information to Include:</strong></p>
              <ul className="list-disc list-inside text-white/60 text-sm ml-4">
                <li>Description of the breach (date, nature)</li>
                <li>Types of personal information affected</li>
                <li>Potential consequences</li>
                <li>Measures taken to address the breach</li>
                <li>Recommended steps for affected users</li>
                <li>Contact information for further questions</li>
              </ul>
            </div>
          </div>

          {/* Section 10: Post-Incident Review */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><FileCheck size={20} /> 10. Post-Incident Review</h2>
            <p className="text-white/70 mb-2">Within 14 days of incident resolution, the incident response team will conduct a post-incident review to:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Determine root cause</li>
              <li>Identify lessons learned</li>
              <li>Update incident response procedures</li>
              <li>Implement preventive measures</li>
              <li>Document findings for compliance</li>
            </ul>
          </div>

          {/* Section 11: Communication Plan */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Mail size={20} /> 11. Communication Plan</h2>
            <p className="text-white/70 mb-2">Communication during an incident is managed through:</p>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li><strong className="text-gold">Internal Communication:</strong> Secure Slack channel for incident response team</li>
              <li><strong className="text-gold">User Communication:</strong> Email notifications, in-app alerts, status page</li>
              <li><strong className="text-gold">Public Communication:</strong> Official statements via social media and website</li>
              <li><strong className="text-gold">Regulator Communication:</strong> Direct contact with Information Regulator</li>
            </ul>
            <p className="text-white/60 text-sm mt-2">All communications must be approved by the Incident Commander and Legal Lead before release.</p>
          </div>

          {/* Section 12: Training and Testing */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><UserCheck size={20} /> 12. Training and Testing</h2>
            <ul className="list-disc list-inside text-white/70 space-y-1 ml-4">
              <li>Annual incident response tabletop exercises</li>
              <li>Quarterly security awareness training for all staff</li>
              <li>Regular backup restoration testing</li>
              <li>Penetration testing (semi-annually)</li>
              <li>Incident response plan review and update (quarterly)</li>
            </ul>
          </div>

          {/* Section 13: Contact Information */}
          <div className="glass-card p-6 border border-gold/30 bg-gold/5">
            <h2 className="text-xl font-bold text-gold mb-3 flex items-center gap-2"><Phone size={20} /> 13. Contact Information</h2>
            <div className="space-y-2">
              <p className="text-white/70"><strong className="text-gold">Emergency Security Contact (24/7):</strong></p>
              <p className="text-white/70 flex items-center gap-2"><Mail size={14} className="text-gold" /> <a href="mailto:security@steeze.com" className="hover:underline">security@steeze.com</a></p>
              <p className="text-white/70 flex items-center gap-2"><Phone size={14} className="text-gold" /> <a href="tel:+27796288382" className="hover:underline">+27 79 628 8382</a></p>
              <p className="text-white/70 mt-2"><strong className="text-gold">Data Protection Officer:</strong></p>
              <p className="text-white/70 flex items-center gap-2"><Mail size={14} className="text-gold" /> <a href="mailto:dpo@steeze.com" className="hover:underline">dpo@steeze.com</a></p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-6">
            <p className="text-white/40 text-sm">This Incident Response Plan is reviewed and updated quarterly. For questions, contact <a href="mailto:security@steeze.com" className="text-gold hover:underline">security@steeze.com</a>.</p>
            <p className="text-white/40 text-xs mt-2">© {new Date().getFullYear()} STEEZE – Powered by ZeusLiveStudio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}