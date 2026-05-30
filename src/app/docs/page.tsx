"use client";

import Link from "next/link";
import { Zap, ChevronLeft, Shield, FileText, Scale } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans">
      {/* Simple Header */}
      <nav className="border-b border-[#30363d] bg-[#161b22] py-4">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-white font-semibold hover:text-blue-400 transition-colors">
            <ChevronLeft size={18} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="text-blue-400" size={20} fill="currentColor" />
            <span className="font-bold text-white">BotDeploy Docs</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Legal & Compliance</h1>
          <p className="text-[#8b949e] text-lg">
            Review the terms, agreements, and licensing that govern the use of the BotDeploy platform.
          </p>
        </div>

        <div className="space-y-16">
          {/* Agreement Section */}
          <section id="agreement">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                <FileText className="text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Service Agreement</h2>
            </div>
            
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 prose prose-invert max-w-none">
              <h3 className="text-white text-xl font-semibold mb-4">1. Acceptance of Terms</h3>
              <p className="mb-6 leading-relaxed">
                By accessing or using BotDeploy, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
              </p>

              <h3 className="text-white text-xl font-semibold mb-4">2. Prerequisites</h3>
              <p className="mb-4 leading-relaxed">
                To enable remote deployments, ensure the following are installed on your host server:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-[#8b949e]">
                <li><code className="text-blue-400">sshpass</code>: Required for automated password authentication.</li>
                <li><code className="text-blue-400">pm2</code>: Required on both host and target servers for process management.</li>
                <li><code className="text-blue-400">git</code>: Required on target servers to clone repositories.</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mb-4">3. User Responsibilities</h3>
              <p className="mb-4 leading-relaxed">
                You are solely responsible for the content and actions of any bots deployed through this platform. You agree not to:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-[#8b949e]">
                <li>Deploy bots that violate Telegram's Terms of Service.</li>
                <li>Use the platform for any illegal or unauthorized purpose.</li>
                <li>Attempt to interfere with or disrupt the platform's infrastructure.</li>
                <li>Distribute spam, malware, or harmful content via deployed bots.</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mb-4">3. Data & Privacy</h3>
              <p className="leading-relaxed mb-6">
                We prioritize your privacy. Bot tokens and environment variables are stored locally on the server environment and are used strictly for the deployment process. We do not share your deployment data with third parties.
              </p>

              <h3 className="text-white text-xl font-semibold mb-4">4. Limitation of Liability</h3>
              <p className="leading-relaxed">
                BotDeploy is provided "as is" without any warranties. We are not responsible for any downtime, data loss, or damages resulting from the use of our services.
              </p>
            </div>
          </section>

          {/* License Section */}
          <section id="license">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <Scale className="text-emerald-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">License Information</h2>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 font-mono text-sm leading-relaxed">
              <p className="text-white font-bold mb-4">MIT License</p>
              <p className="mb-4">Copyright (c) 2026 BotDeploy Team</p>
              <p className="mb-4">
                Permission is hereby granted, free of charge, to any person obtaining a copy
                of this software and associated documentation files (the "Software"), to deal
                in the Software without restriction, including without limitation the rights
                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                copies of the Software, and to permit persons to whom the Software is
                furnished to do so, subject to the following conditions:
              </p>
              <p className="mb-4">
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </p>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                SOFTWARE.
              </p>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="mt-20 pt-8 border-t border-[#30363d] text-center text-[#8b949e] text-sm">
          <p>Last updated: May 30, 2026</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/" className="hover:text-blue-400">Dashboard</Link>
            <Link href="/docs#agreement" className="hover:text-blue-400">Agreement</Link>
            <Link href="/docs#license" className="hover:text-blue-400">License</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
