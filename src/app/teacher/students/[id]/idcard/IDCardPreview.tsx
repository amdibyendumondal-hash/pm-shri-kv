'use client'

import { Printer, ArrowLeft, School, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface StudentData {
  id: string
  name: string
  rollNo: string
  admissionNo: string
  gender: string
  dob: string
  bloodGroup: string | null
  fatherName: string
  motherName: string
  mobile: string
  village: string
  postOffice: string
  district: string
  state: string
  pinCode: string
  house: string | null
  photo: string | null
  class: {
    name: string
  }
  section: {
    name: string
  }
}

interface IDCardPreviewProps {
  student: StudentData
}

export function IDCardPreview({ student }: IDCardPreviewProps) {
  // Generate scannable QR code URL containing student details
  const qrData = encodeURIComponent(
    `Name: ${student.name}\nAdmn: ${student.admissionNo}\nClass: ${student.class.name}-${student.section.name}\nRoll: ${student.rollNo}\nMobile: ${student.mobile}`
  )
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden in Print) */}
      <div className="no-print flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
        <Link
          href="/teacher/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-505 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-brand-teal-950/20"
        >
          <Printer className="h-4 w-4" />
          Print ID Card
        </button>
      </div>

      {/* ID Card Print Area */}
      <div className="print-area flex flex-col md:flex-row items-center justify-center gap-8 py-8">
        
        {/* FRONT OF CARD */}
        <div className="w-80 h-[480px] bg-gradient-to-b from-brand-blue-900 to-slate-950 border border-brand-blue-700/30 rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden text-center p-6 select-none shrink-0">
          {/* Card Header */}
          <div className="border-b border-brand-blue-700/20 pb-4 flex items-center justify-center gap-2">
            <School className="h-5 w-5 text-brand-teal-500 shrink-0" />
            <div>
              <span className="font-extrabold text-[13px] text-white block leading-tight">PM SHRI KV</span>
              <span className="text-[8px] text-brand-teal-500 font-bold uppercase tracking-wider block">Mahuldiha</span>
            </div>
          </div>

          {/* Student Photo */}
          <div className="my-8 flex justify-center">
            <div className="h-32 w-32 rounded-[2rem] border-2 border-brand-teal-500 bg-slate-900/60 p-1 flex items-center justify-center overflow-hidden shadow-lg shadow-brand-teal-900/10">
              {student.photo ? (
                <img src={student.photo} alt={student.name} className="h-full w-full object-cover rounded-[1.8rem]" />
              ) : (
                <div className="h-full w-full bg-slate-800 rounded-[1.8rem] flex items-center justify-center text-slate-500 text-[10px] italic">No Photo</div>
              )}
            </div>
          </div>

          {/* Student Info */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Student Name</span>
              <span className="font-black text-lg text-white block">{student.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left px-4">
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Class & Sec</span>
                <span className="text-xs font-extrabold text-slate-200">{student.class.name} - {student.section.name}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Roll Number</span>
                <span className="text-xs font-extrabold text-slate-200"># {student.rollNo}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Admission No</span>
                <span className="text-xs font-extrabold text-slate-200 font-mono">{student.admissionNo}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Blood Group</span>
                <span className="text-xs font-extrabold text-slate-200">{student.bloodGroup || 'O+'}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature Area */}
          <div className="mt-4 pt-4 border-t border-brand-blue-700/20 flex items-center justify-between text-left text-[8px] font-bold uppercase tracking-wider text-slate-500 px-2">
            <span>Student Sign</span>
            <span className="text-right">Principal Sign</span>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div className="w-80 h-[480px] bg-slate-950 border border-brand-blue-700/30 rounded-[2.5rem] shadow-2xl relative flex flex-col justify-between overflow-hidden p-6 select-none shrink-0">
          {/* Header */}
          <div className="text-center pb-3 border-b border-brand-blue-700/20 flex items-center justify-center gap-1">
            <ShieldCheck className="h-4.5 w-4.5 text-brand-teal-500" />
            <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">Identity Details</span>
          </div>

          {/* Details list */}
          <div className="space-y-3 px-2 flex-1 pt-6 text-left">
            <div>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Father's Name</span>
              <span className="text-xs font-extrabold text-slate-200 block">{student.fatherName}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Mother's Name</span>
              <span className="text-xs font-extrabold text-slate-200 block">{student.motherName}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Date of Birth</span>
                <span className="text-xs font-extrabold text-slate-200 block">{student.dob}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Emergency Call</span>
                <span className="text-xs font-extrabold text-brand-teal-500 block">{student.mobile}</span>
              </div>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Residential Address</span>
              <p className="text-[10px] font-semibold text-slate-300 leading-normal">
                {student.village}, PO: {student.postOffice}, Dist: {student.district}, {student.state} - {student.pinCode}
              </p>
            </div>
          </div>

          {/* QR Code and Footer */}
          <div className="flex items-center justify-between border-t border-brand-blue-700/20 pt-4">
            <div className="text-[8px] text-slate-500 font-bold uppercase space-y-0.5 leading-tight">
              <span>PM SHRI KV</span>
              <span className="block text-[7px] text-slate-600">Mahuldiha, Mayurbhanj</span>
              <span className="block text-[7px] text-slate-600">Odisha, PIN-757041</span>
            </div>
            
            {/* Dynamic QR Code */}
            <div className="h-16 w-16 bg-white p-1 rounded-xl shadow-md shrink-0">
              <img src={qrCodeUrl} alt="QR Code" className="h-full w-full" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
