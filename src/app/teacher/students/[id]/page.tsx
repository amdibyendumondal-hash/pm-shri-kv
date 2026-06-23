import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { ArrowLeft, User, Phone, MapPin, GraduationCap, Calendar, ShieldCheck, Heart } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function StudentDetailsPage({ params }: PageProps) {
  const { id } = await params

  const student = await db.student.findUnique({
    where: { id },
    include: {
      class: true,
      section: true,
    },
  })

  if (!student) {
    notFound()
  }

  const detailSections = [
    {
      title: 'Personal Information',
      icon: User,
      color: 'text-brand-blue-500 bg-brand-blue-500/10 border-brand-blue-500/20',
      fields: [
        { label: 'Full Name', value: student.name },
        { label: 'Gender', value: student.gender },
        { label: 'Date of Birth', value: student.dob },
        { label: 'Blood Group', value: student.bloodGroup || 'Not Specified' },
        { label: 'Aadhaar Number', value: student.aadhaarNo || 'Not Provided' },
        { label: 'Category', value: student.category },
        { label: 'Religion', value: student.religion || 'Not Specified' },
        { label: 'Nationality', value: student.nationality },
      ],
    },
    {
      title: 'Parent & Guardian Information',
      icon: Phone,
      color: 'text-brand-teal-500 bg-brand-teal-500/10 border-brand-teal-500/20',
      fields: [
        { label: "Father's Name", value: student.fatherName },
        { label: "Mother's Name", value: student.motherName },
        { label: 'Guardian Name', value: student.guardianName || 'N/A' },
        { label: 'Emergency Contact', value: student.mobile },
        { label: 'Alternate Mobile', value: student.altMobile || 'None' },
        { label: 'Email Address', value: student.email || 'None' },
      ],
    },
    {
      title: 'Residential Address',
      icon: MapPin,
      color: 'text-brand-orange-500 bg-brand-orange-500/10 border-brand-orange-500/20',
      fields: [
        { label: 'Village / Street', value: student.village },
        { label: 'Post Office', value: student.postOffice },
        { label: 'District', value: student.district },
        { label: 'State', value: student.state },
        { label: 'Pin Code', value: student.pinCode },
      ],
    },
    {
      title: 'Academic Profile Details',
      icon: GraduationCap,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      fields: [
        { label: 'Admission Number', value: student.admissionNo, mono: true },
        { label: 'Roll Number', value: `# ${student.rollNo}` },
        { label: 'Class & Section', value: `${student.class.name} - Section ${student.section.name}` },
        { label: 'Admission Date', value: student.admissionDate },
        { label: 'School House Group', value: student.house || 'None Assigned' },
        { label: 'Previous School', value: student.previousSchool || 'None' },
        { label: 'APAR ID (APAAR)', value: student.aparId || 'Not Registered' },
        { label: 'PEN Number (Permanent Education No)', value: student.penNo || 'Not Registered' },
      ],
    },
    {
      title: 'Welfare & Category Details',
      icon: ShieldCheck,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      fields: [
        { label: 'Admission Year', value: student.admissionYear },
        { label: 'Student Code', value: student.studentCode, mono: true },
        { label: 'Admission Category', value: student.admissionCategory || 'N/A' },
        { label: 'Social Category', value: student.socialCategory || 'N/A' },
        { label: 'Minority Status', value: student.minority || 'N/A' },
        { label: 'Physically Disabled', value: student.physicallyDisabled },
        { label: 'Single Girl Child (SGC)', value: student.singleGirlChild },
        { label: 'RTE Status', value: student.rte },
        { label: 'KVS Ward', value: student.kvsWard },
        { label: 'Reimbursement Claimed', value: student.reimbursementClaimed },
      ],
    },
    {
      title: 'Fees Structure Details',
      icon: Heart,
      color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      fields: [
        { label: 'Tuition Fee', value: student.tuitionFee !== null ? `₹ ${student.tuitionFee}` : '₹ 0' },
        { label: 'Computer Fee', value: student.computerFee !== null ? `₹ ${student.computerFee}` : '₹ 0' },
        { label: 'VVN Fee', value: student.vvnFee !== null ? `₹ ${student.vvnFee}` : '₹ 0' },
        { label: 'Computer Science Fee', value: student.computerScienceFee !== null ? `₹ ${student.computerScienceFee}` : '₹ 0' },
        { label: 'Library Fee', value: student.libraryFee !== null ? `₹ ${student.libraryFee}` : '₹ 0' },
        { label: 'Project Fee', value: student.projectFee !== null ? `₹ ${student.projectFee}` : '₹ 0' },
        { label: 'Total Calculated Fees', value: student.totalFee !== null ? `₹ ${student.totalFee}` : '₹ 0', mono: true },
      ],
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
        <Link
          href="/teacher/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
        <span className="text-xs font-bold text-slate-500">
          Admission No: <span className="font-mono text-brand-teal-500">{student.admissionNo}</span>
        </span>
      </div>

      {/* Student Profile Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-8">
        <div className="h-32 w-32 rounded-[2rem] border-2 border-brand-teal-500 bg-slate-950 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-brand-teal-950/20">
          {student.photo ? (
            <img src={student.photo} alt={student.name} className="h-full w-full object-cover rounded-[1.8rem]" />
          ) : (
            <User className="h-16 w-16 text-slate-700" />
          )}
        </div>

        <div className="text-center md:text-left space-y-2">
          <h1 className="text-2xl font-black text-white">{student.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4 text-brand-blue-500" />
              Class: {student.class.name} - {student.section.name}
            </span>
            <span className="h-3 w-px bg-slate-800 hidden sm:block" />
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-brand-teal-500" />
              Roll No: {student.rollNo}
            </span>
            {student.house && (
              <>
                <span className="h-3 w-px bg-slate-800 hidden sm:block" />
                <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] bg-slate-800 text-slate-350 px-2 py-0.5 rounded border border-slate-700 font-bold">
                  {student.house} House
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Profile Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {detailSections.map((section, idx) => {
          const Icon = section.icon
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className={`p-2 rounded-xl border shrink-0 ${section.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-bold text-white text-sm">{section.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {section.fields.map((field, fIdx) => (
                  <div key={fIdx} className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">
                      {field.label}
                    </span>
                    <span className={`text-xs font-bold text-slate-200 block truncate ${field.mono ? 'font-mono' : ''}`}>
                      {field.value || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
