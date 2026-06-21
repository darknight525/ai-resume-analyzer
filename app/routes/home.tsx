import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { FileText, Star, Trophy, BarChart3, Target, Bot, Mic } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumeIQ AI" },
    { name: "description", content: "AI Powered Resume Analysis & ATS Scoring" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const totalResumes = resumes.length;

  const scores = resumes.map((resume) => resume?.feedback?.overallScore || 0);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  useEffect(() => {
    if (!auth.isAuthenticated) navigate("/auth?next=/");
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      const resumes = (await kv.list("resume:*", true)) as any[];
      const parsedResumes = resumes?.map((resume) => JSON.parse(resume.value));
      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    };
    loadResumes();
  }, [kv]);

  return (
    <main className="min-h-screen relative w-full overflow-hidden text-slate-900 bg-[#f8fafc]">
      
      {/* BACKGROUND ORBS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-10%', right: '0%', width: '800px', height: '800px', backgroundColor: 'rgba(96, 165, 250, 0.25)', filter: 'blur(140px)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', top: '20%', right: '20%', width: '600px', height: '600px', backgroundColor: 'rgba(192, 132, 252, 0.25)', filter: 'blur(140px)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', top: '40%', right: '-10%', width: '700px', height: '700px', backgroundColor: 'rgba(45, 212, 191, 0.20)', filter: 'blur(140px)', borderRadius: '50%' }}></div>
        
        {/* Floating sparkles */}
        <div className="absolute top-[30%] right-[35%] w-2 h-2 bg-white rounded-full shadow-[0_0_15px_4px_rgba(255,255,255,1)] animate-pulse"></div>
        <div className="absolute top-[15%] right-[15%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,255,255,1)] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 w-full">
          
          <div className="text-left relative">
            
            {/* BADGE */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-8 shadow-sm">
              🚀 AI Powered Resume Analyzer
            </div>

            {/* FIXED HEADING - Tighter tracking, heavier font weight */}
            <h1 className="text-5xl md:text-[64px] font-black leading-[1.1] max-w-3xl tracking-tight text-[#1e293b] mb-6">
              Land More Interviews With <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-2 inline-block mt-2">
                ResumeIQ AI
              </span>
            </h1>

            {/* FIXED PARAGRAPH - Better color and sizing */}
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed font-medium mb-10">
              Analyze resumes with AI, calculate ATS scores, discover skill gaps,
              and receive personalized career recommendations instantly.
            </p>

            {/* FIXED BUTTONS - Proper sizing, padding, and alignment */}
            <div className="flex flex-wrap items-center gap-5">
              <Link to="/upload" className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-2xl shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)] hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 text-lg">
                Analyze Resume →
              </Link>
              <a href="#reviews" className="inline-flex items-center justify-center gap-2 px-8 py-4 font-medium rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm text-lg">
                <FileText size={20} className="text-slate-400" />
                View Reports
              </a>
            </div>

            {/* THE GLOWING METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              {/* Total Resumes */}
              <div className="backdrop-blur-xl border border-white/60 rounded-3xl p-8 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1"
                   style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(219, 234, 254, 0.4))", boxShadow: "0 15px 35px -10px rgba(59,130,246,0.3), inset 0 0 20px rgba(255,255,255,0.9)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl" style={{ background: "linear-gradient(135deg, #60a5fa, #2563eb)", boxShadow: "0 10px 25px -5px rgba(37,99,235,0.6)" }}>
                  <FileText size={34} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Resumes</p>
                  <h2 className="text-4xl font-bold text-slate-800">{totalResumes}</h2>
                  <p className="text-xs text-slate-400">All your analyzed resumes</p>
                </div>
              </div>

              {/* Average ATS Score */}
              <div className="backdrop-blur-xl border border-white/60 rounded-3xl p-8 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1"
                   style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(243, 232, 255, 0.4))", boxShadow: "0 15px 35px -10px rgba(168,85,247,0.3), inset 0 0 20px rgba(255,255,255,0.9)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl" style={{ background: "linear-gradient(135deg, #c084fc, #9333ea)", boxShadow: "0 10px 25px -5px rgba(147,51,234,0.6)" }}>
                  <Star size={34} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Average ATS Score</p>
                  <h2 className="text-4xl font-bold text-slate-800">{averageScore}</h2>
                  <p className="text-xs text-slate-400">Average score across all</p>
                </div>
              </div>

              {/* Best ATS Score */}
              <div className="backdrop-blur-xl border border-white/60 rounded-3xl p-8 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1"
                   style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(209, 250, 229, 0.4))", boxShadow: "0 15px 35px -10px rgba(16,185,129,0.3), inset 0 0 20px rgba(255,255,255,0.9)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl" style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 10px 25px -5px rgba(5,150,105,0.6)" }}>
                  <Trophy size={34} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Best ATS Score</p>
                  <h2 className="text-4xl font-bold text-slate-800">{bestScore}</h2>
                  <p className="text-xs text-slate-400">Your highest ATS score</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY FEATURE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
            <div className="bg-white/70 backdrop-blur-lg border border-white shadow-sm rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <BarChart3 size={28} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">ATS Analysis</h3>
              <p className="text-slate-500 text-sm mt-2">Measure resume compatibility with ATS systems.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-lg border border-white shadow-sm rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Target size={28} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Skill Gap Detection</h3>
              <p className="text-slate-500 text-sm mt-2">Discover missing skills for your target role.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-lg border border-white shadow-sm rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Bot size={28} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">AI Career Guidance</h3>
              <p className="text-slate-500 text-sm mt-2">Personalized recommendations to improve your profile.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-lg border border-white shadow-sm rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                <Mic size={28} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Interview Prep</h3>
              <p className="text-slate-500 text-sm mt-2">Generate interview questions based on your resume.</p>
            </div>
          </div>
        </section>

        {loadingResumes && (
          <div className="flex flex-col items-center justify-center mt-12">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" alt="Loading..." />
            <p className="mt-3 text-slate-500">Loading your resume reports...</p>
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <>
            <h2 id="reviews" className="text-3xl font-bold text-center mb-8 mt-16 text-slate-800">
              Your Resume Reports
            </h2>
            <div className="max-w-7xl mx-auto px-6 pb-20 w-full flex flex-wrap gap-6 justify-center">
              {resumes.map((resume: any) => (
                <div className="relative z-20" key={resume.id}>
                   <ResumeCard resume={resume} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="mt-auto py-8 text-center border-t border-slate-200/60 bg-white/30 backdrop-blur-md relative z-10">
        <h3 className="font-bold text-2xl text-slate-900">ResumeIQ AI</h3>
        <p className="text-slate-600 font-medium mt-2">AI Powered Resume Analysis & Career Guidance</p>
        <p className="text-slate-400 text-sm mt-4">Built with React, Tailwind CSS & AI</p>
        <p className="text-slate-500 font-semibold mt-3">
          Crafted with ❤️ by Nitin Singh
        </p>
      </footer>
    </main>
  );
}