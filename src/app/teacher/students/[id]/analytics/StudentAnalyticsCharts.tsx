'use client'

import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend 
} from 'recharts'
import { AlertTriangle, Award, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react'

interface ExamTrend {
  name: string
  score: number
}

interface SubjectScore {
  subject: string
  obtained: number
  max: number
  pct: number
}

interface StudentAnalyticsChartsProps {
  studentName: string
  attendanceRate: number
  avgScore: number
  classRank: number
  sectionRank: number
  totalClassmates: number
  totalSectionmates: number
  examTrends: ExamTrend[]
  subjectScores: SubjectScore[]
}

export function StudentAnalyticsCharts({
  studentName, attendanceRate, avgScore, classRank, sectionRank,
  totalClassmates, totalSectionmates, examTrends, subjectScores
}: StudentAnalyticsChartsProps) {
  
  // Risk Alert calculations
  const lowAttendance = attendanceRate < 75
  const lowGrades = avgScore > 0 && avgScore < 40
  const isAtRisk = lowAttendance || lowGrades

  // AI-Based Performance Prediction
  let predictionText = ''
  let predictionColor = ''

  if (avgScore >= 85) {
    predictionText = `${studentName} is projected to score in the Outstanding range (90%+ A1) in the Annual Examinations with exceptionally high potential for top ranks. Maintain current revision routine.`
    predictionColor = 'text-brand-teal-500 bg-brand-teal-500/5 border-brand-teal-500/10'
  } else if (avgScore >= 70) {
    predictionText = `${studentName} is projected to score in the Good to Very Good range (75%-85% A2/B1) in the Annual Examinations. Moderate potential to reach top ranks with minor focus on weak subjects.`
    predictionColor = 'text-brand-blue-500 bg-brand-blue-500/5 border-brand-blue-600/10'
  } else if (avgScore >= 40) {
    predictionText = `${studentName} is projected to score in the Pass range (50%-65% B2/C1/C2) in the Annual Examinations. Regular attendance and extra tutoring exercises are recommended to prevent grade drop.`
    predictionColor = 'text-slate-300 bg-slate-800/20 border-slate-700/20'
  } else if (avgScore > 0) {
    predictionText = `WARNING: ${studentName} is projected to be at critical academic risk (Failing grade range <40%) for the Annual Examinations. Immediate parent teacher consultation and special remedial classes required.`
    predictionColor = 'text-brand-orange-500 bg-brand-orange-500/5 border-brand-orange-500/10'
  } else {
    predictionText = 'No exam marks recorded yet to build progression prediction.'
    predictionColor = 'text-slate-500 bg-slate-900/50 border-slate-800'
  }

  // Format subjectScores for strengths radar chart
  const radarData = subjectScores.map(s => ({
    subject: s.subject.substring(0, 8),
    score: Math.round(s.pct)
  }))

  return (
    <div className="space-y-6">
      {/* Ranks and Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Percentage */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-4">Attendance Rate</span>
          <h2 className="text-3xl font-black text-white mb-1">{attendanceRate}%</h2>
          <div className="flex items-center gap-1.5 text-xs">
            {lowAttendance ? (
              <span className="text-brand-orange-500 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Below KV 75% limit
              </span>
            ) : (
              <span className="text-brand-teal-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Satisfies KV limit
              </span>
            )}
          </div>
        </div>

        {/* Avg Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-4">Average Score</span>
          <h2 className="text-3xl font-black text-white mb-1">{avgScore > 0 ? `${avgScore}%` : 'N/A'}</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-450">
            <span>Overall average mark</span>
          </div>
        </div>

        {/* Class Rank */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-4">Class Rank</span>
          <h2 className="text-3xl font-black text-white mb-1">
            {avgScore > 0 ? `#${classRank}` : 'N/A'}
            {avgScore > 0 && <span className="text-sm font-semibold text-slate-500"> / {totalClassmates}</span>}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-brand-teal-500 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Grade-wide ranking</span>
          </div>
        </div>

        {/* Section Rank */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-4">Section Rank</span>
          <h2 className="text-3xl font-black text-white mb-1">
            {avgScore > 0 ? `#${sectionRank}` : 'N/A'}
            {avgScore > 0 && <span className="text-sm font-semibold text-slate-500"> / {totalSectionmates}</span>}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-brand-teal-500 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Section-wide ranking</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Examination Performance Trend</h3>
          <div className="h-80 w-full">
            {examTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No exam data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={examTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#1d4ed8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" name="Avg Marks %" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Strengths Radar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Subject Strengths Distribution</h3>
          <div className="h-80 w-full">
            {subjectScores.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No subject score data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                  <PolarRadiusAxis stroke="#64748b" fontSize={9} angle={30} domain={[0, 100]} />
                  <Radar name="Scoring %" dataKey="score" stroke="#0d9488" fill="#0d9488" fillOpacity={0.35} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subject wise Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 font-semibold">Subject-wise Average Marks</h3>
          <div className="h-80 w-full">
            {subjectScores.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No subject scores recorded yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectScores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="pct" fill="#1d4ed8" radius={[8, 8, 0, 0]} name="Score Rate %" maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* AI Performance Prediction & Risk alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Prediction */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4.5 w-4.5 text-brand-teal-500" />
            AI-based Performance Prediction
          </h3>
          <div className={`p-5 border rounded-2xl text-xs leading-relaxed font-medium ${predictionColor}`}>
            {predictionText}
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-brand-orange-500" />
            Student Risk Alert System
          </h3>
          <div className="space-y-3">
            {/* Low Attendance Alert */}
            <div className={`p-3.5 border rounded-2xl text-xs flex items-center justify-between ${
              lowAttendance 
                ? 'bg-brand-orange-500/5 border-brand-orange-500/10 text-brand-orange-500 font-semibold animate-pulse' 
                : 'bg-slate-950/40 border-slate-850 text-slate-500'
            }`}>
              <span>Low Attendance Warning (&lt;75%)</span>
              <span>{lowAttendance ? 'CRITICAL ALERT' : 'SECURE'}</span>
            </div>

            {/* Low Marks Alert */}
            <div className={`p-3.5 border rounded-2xl text-xs flex items-center justify-between ${
              lowGrades 
                ? 'bg-red-950/40 border-red-900/50 text-red-400 font-semibold' 
                : 'bg-slate-950/40 border-slate-850 text-slate-500'
            }`}>
              <span>Critical Academic Risk (&lt;40% Avg)</span>
              <span>{lowGrades ? 'CRITICAL ALERT' : 'SECURE'}</span>
            </div>

            {!isAtRisk && (
              <div className="p-3.5 bg-brand-teal-500/5 border border-brand-teal-500/10 text-brand-teal-550 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                Student is currently in Good Standing. No risk alerts triggered.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
