'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerStudent } from '../../actions'
import { 
  User, Users, MapPin, GraduationCap, Camera, Upload, 
  RefreshCw, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, CreditCard
} from 'lucide-react'

interface ClassData {
  id: string
  name: string
  sections: {
    id: string
    name: string
  }[]
}

interface StudentAddFormProps {
  classes: ClassData[]
  houses: { id: string; name: string }[]
}

export function StudentAddForm({ classes, houses }: StudentAddFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(registerStudent, null)
  const [step, setStep] = useState(1)
  
  // Fees states for real-time summation
  const [tuitionFee, setTuitionFee] = useState<number>(0)
  const [computerFee, setComputerFee] = useState<number>(0)
  const [vvnFee, setVVNFee] = useState<number>(0)
  const [csFee, setCSFee] = useState<number>(0)
  const [libraryFee, setLibraryFee] = useState<number>(0)
  const [projectFee, setProjectFee] = useState<number>(0)
  
  const totalFees = tuitionFee + computerFee + vvnFee + csFee + libraryFee + projectFee
  
  // Section list dynamically loaded when class is selected
  const [selectedClassId, setSelectedClassId] = useState('')
  const [availableSections, setAvailableSections] = useState<{ id: string; name: string }[]>([])
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Load sections based on class
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId)
      setAvailableSections(cls ? cls.sections : [])
    } else {
      setAvailableSections([])
    }
  }, [selectedClassId, classes])

  useEffect(() => {
    if (state?.success) {
      alert('Student registered successfully!')
      router.push('/teacher/students')
      router.refresh()
    }
  }, [state, router])

  // Camera capture methods
  const startCamera = async () => {
    setCameraActive(true)
    setPhotoBase64(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { aspectRatio: 1 } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      alert('Could not access camera. Please upload a photo instead.')
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        const size = Math.min(video.videoWidth, video.videoHeight)
        canvas.width = 300
        canvas.height = 300
        
        // Crop centered square
        const sx = (video.videoWidth - size) / 2
        const sy = (video.videoHeight - size) / 2
        
        context.drawImage(video, sx, sy, size, size, 0, 0, 300, 300)
        const base64 = canvas.toDataURL('image/jpeg', 0.85)
        setPhotoBase64(base64)
        stopCamera()
      }
    }
  }

  // File drag & drop crop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WEBP).')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (ctx) {
            canvas.width = 300
            canvas.height = 300
            const size = Math.min(img.width, img.height)
            const sx = (img.width - size) / 2
            const sy = (img.height - size) / 2
            ctx.drawImage(img, sx, sy, size, size, 0, 0, 300, 300)
            const base64 = canvas.toDataURL('image/jpeg', 0.85)
            setPhotoBase64(base64)
          }
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Steps Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex justify-between items-center px-8 shadow-md">
        {[
          { label: 'Personal Details', icon: User, num: 1 },
          { label: 'Family & Address', icon: MapPin, num: 2 },
          { label: 'Schooling & Photo', icon: GraduationCap, num: 3 },
          { label: 'Fees Structure', icon: CreditCard, num: 4 },
        ].map(s => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
              step === s.num 
                ? 'bg-brand-teal-600 border-brand-teal-500 text-white ring-4 ring-brand-teal-600/10' 
                : step > s.num 
                ? 'bg-brand-teal-500/10 border-brand-teal-500/20 text-brand-teal-500' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              {s.num}
            </div>
            <span className={`text-xs font-semibold hidden md:inline ${
              step === s.num ? 'text-white' : step > s.num ? 'text-slate-355' : 'text-slate-500'
            }`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Form Card */}
      <form action={formAction} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        {state?.error && (
          <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        {/* Hidden Field for base64 photo */}
        <input type="hidden" name="photo" value={photoBase64 || ''} />

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="font-bold text-white border-b border-slate-800 pb-3">1. Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Admission Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Admission Number <span className="text-brand-orange-500">*</span></label>
                <input name="admissionNo" required type="text" placeholder="e.g. KV-2026-104" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
              </div>
              {/* Roll Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Roll Number <span className="text-brand-orange-500">*</span></label>
                <input name="rollNo" required type="text" placeholder="e.g. 24" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
              </div>
              {/* Student Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Student Name <span className="text-brand-orange-500">*</span></label>
                <input name="name" required type="text" placeholder="e.g. Sameer Mohanty" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
              </div>
              {/* Class Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Class <span className="text-brand-orange-500">*</span></label>
                <select 
                  name="classId" 
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  required 
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer"
                >
                  <option value="">Select Class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {/* Section Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Section <span className="text-brand-orange-500">*</span></label>
                <select name="sectionId" required className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="">Select Section...</option>
                  {availableSections.map(s => (
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  ))}
                </select>
              </div>
              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Gender <span className="text-brand-orange-500">*</span></label>
                <select name="gender" required className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="">Select Gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Date of Birth <span className="text-brand-orange-500">*</span></label>
                <input name="dob" required type="date" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm" />
              </div>
              {/* Blood Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Blood Group</label>
                <select name="bloodGroup" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="">Unknown</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              {/* Aadhaar Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Aadhaar Number</label>
                <input name="aadhaarNo" type="text" placeholder="12-digit Aadhaar" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
              </div>
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Category <span className="text-brand-orange-500">*</span></label>
                <select name="category" required className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
              {/* Religion */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Religion</label>
                <input name="religion" type="text" placeholder="e.g. Hindu" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
              </div>
              {/* Nationality */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nationality</label>
                <input name="nationality" type="text" defaultValue="Indian" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm" />
              </div>
              
              {/* Admission Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Admission Year</label>
                <input name="admissionYear" type="number" placeholder="e.g. 2026" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
              </div>
              
              {/* Student Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Student Code</label>
                <input name="studentCode" type="text" placeholder="e.g. STU-9823" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
              </div>
              
              {/* Admission Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Admission Category</label>
                <select name="admissionCategory" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="" className="bg-slate-900 text-white">Select Category...</option>
                  <option value="I" className="bg-slate-900 text-white">Category I</option>
                  <option value="II" className="bg-slate-900 text-white">Category II</option>
                  <option value="III" className="bg-slate-900 text-white">Category III</option>
                  <option value="IV" className="bg-slate-900 text-white">Category IV</option>
                  <option value="V" className="bg-slate-900 text-white">Category V</option>
                  <option value="VI" className="bg-slate-900 text-white">Category VI</option>
                </select>
              </div>
              
              {/* Social Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Social Category</label>
                <select name="socialCategory" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="" className="bg-slate-900 text-white">Select Social...</option>
                  <option value="Gen" className="bg-slate-900 text-white">Gen</option>
                  <option value="SC" className="bg-slate-900 text-white">SC</option>
                  <option value="ST" className="bg-slate-900 text-white">ST</option>
                  <option value="OBC" className="bg-slate-900 text-white">OBC</option>
                </select>
              </div>
              
              {/* Minority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Minority Status</label>
                <select name="minority" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="Not applicable" className="bg-slate-900 text-white">Not applicable</option>
                  <option value="Muslim" className="bg-slate-900 text-white">Muslim</option>
                  <option value="Boudh" className="bg-slate-900 text-white">Boudh</option>
                  <option value="Shikh" className="bg-slate-900 text-white">Shikh</option>
                  <option value="Christan" className="bg-slate-900 text-white">Christan</option>
                  <option value="Parsi" className="bg-slate-900 text-white">Parsi</option>
                </select>
              </div>
              
              {/* Physically Disabled */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Physically Disabled</label>
                <select name="physicallyDisabled" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="No" className="bg-slate-900 text-white">No</option>
                  <option value="Yes" className="bg-slate-900 text-white">Yes</option>
                </select>
              </div>
              
              {/* Single Girl Child */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Single Girl Child (SGC)</label>
                <select name="singleGirlChild" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="No" className="bg-slate-900 text-white">No</option>
                  <option value="Yes" className="bg-slate-900 text-white">Yes</option>
                </select>
              </div>
              
              {/* RTE */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">RTE Candidate</label>
                <select name="rte" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="No" className="bg-slate-900 text-white">No</option>
                  <option value="Yes" className="bg-slate-900 text-white">Yes</option>
                </select>
              </div>
              
              {/* KVS Ward */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">KVS Ward</label>
                <select name="kvsWard" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="No" className="bg-slate-900 text-white">No</option>
                  <option value="Yes" className="bg-slate-900 text-white">Yes</option>
                </select>
              </div>
              
              {/* Reimbursement Claimed */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Reimbursement Claimed</label>
                <select name="reimbursementClaimed" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                  <option value="No" className="bg-slate-900 text-white">No</option>
                  <option value="Yes" className="bg-slate-900 text-white">Yes</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Parents & Address */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Parents */}
            <div className="space-y-6">
              <h3 className="font-bold text-white border-b border-slate-800 pb-3">2. Parent / Guardian Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Father's Name <span className="text-brand-orange-500">*</span></label>
                  <input name="fatherName" required type="text" placeholder="Father's Full Name" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Mother's Name <span className="text-brand-orange-500">*</span></label>
                  <input name="motherName" required type="text" placeholder="Mother's Full Name" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Guardian Name (Optional)</label>
                  <input name="guardianName" type="text" placeholder="Guardian's Name" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Mobile Number <span className="text-brand-orange-500">*</span></label>
                  <input name="mobile" required type="tel" placeholder="Primary Phone Number" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Alternate Number</label>
                  <input name="altMobile" type="tel" placeholder="Backup Phone Number" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <input name="email" type="email" placeholder="parent@gmail.com" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-6">
              <h3 className="font-bold text-white border-b border-slate-800 pb-3">Correspondence Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Village / Street <span className="text-brand-orange-500">*</span></label>
                  <input name="village" required type="text" placeholder="Village or Locality" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Post Office <span className="text-brand-orange-500">*</span></label>
                  <input name="postOffice" required type="text" placeholder="Post Office Name" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">District <span className="text-brand-orange-500">*</span></label>
                  <input name="district" required type="text" placeholder="e.g. Mayurbhanj" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">State <span className="text-brand-orange-500">*</span></label>
                  <input name="state" required type="text" defaultValue="Odisha" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">PIN Code <span className="text-brand-orange-500">*</span></label>
                  <input name="pinCode" required type="text" placeholder="6-digit PIN" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Academics & Photo */}
        {step === 3 && (
          <div className="space-y-8">
            {/* Academics details */}
            <div className="space-y-6">
              <h3 className="font-bold text-white border-b border-slate-800 pb-3">3. Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Admission Date <span className="text-brand-orange-500">*</span></label>
                  <input name="admissionDate" required type="date" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Previous School Name</label>
                  <input name="previousSchool" type="text" placeholder="e.g. SVM Mahuldiha" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">House Assignment</label>
                  <select name="house" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm cursor-pointer">
                    <option value="">None / Unassigned</option>
                    {houses && houses.map(h => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">APAR ID (APAAR ID)</label>
                  <input name="aparId" type="text" placeholder="National Student ID" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">PEN (Permanent Education No)</label>
                  <input name="penNo" type="text" placeholder="PEN Number" className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" />
                </div>
              </div>
            </div>

            {/* Photo Upload Panel */}
            <div className="space-y-6">
              <h3 className="font-bold text-white border-b border-slate-800 pb-3">Student Profile Photo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Drag Drop or Camera Action */}
                <div className="space-y-4">
                  {cameraActive ? (
                    <div className="relative border border-slate-800 rounded-2xl overflow-hidden aspect-square w-full max-w-[240px] mx-auto bg-black">
                      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                      <button 
                        type="button" 
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 py-2 px-4 bg-brand-teal-600 hover:bg-brand-teal-505 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg"
                      >
                        Snap Snapshot
                      </button>
                    </div>
                  ) : (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center h-48 ${
                        dragActive ? 'border-brand-teal-500 bg-brand-teal-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
                      }`}
                    >
                      <Upload className="h-8 w-8 text-slate-500 mb-2" />
                      <p className="text-xs font-medium text-slate-300">Drag & Drop student photo, or <span className="text-brand-teal-500 underline">Browse</span></p>
                      <p className="text-[10px] text-slate-500 mt-1">Supports JPG, PNG, WEBP (cropped automatically to square)</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden" 
                        id="photo-file-input"
                      />
                      <label htmlFor="photo-file-input" className="absolute inset-0 cursor-pointer" />
                    </div>
                  )}

                  <div className="flex justify-center gap-4">
                    {cameraActive ? (
                      <button 
                        type="button" 
                        onClick={stopCamera}
                        className="text-xs text-red-400 hover:underline cursor-pointer"
                      >
                        Cancel Camera
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={startCamera}
                        className="inline-flex items-center gap-1.5 text-xs text-brand-teal-500 hover:underline cursor-pointer font-semibold"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Use Device Camera
                      </button>
                    )}
                  </div>
                </div>

                {/* Cropped Preview (Hidden Canvas) */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <span className="text-xs font-semibold text-slate-400">Cropped Profile Preview</span>
                  <div className="h-32 w-32 rounded-3xl border border-slate-800 bg-slate-950/40 flex items-center justify-center overflow-hidden">
                    {photoBase64 ? (
                      <img src={photoBase64} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-650 italic">No Photo</span>
                    )}
                  </div>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Fees Structure */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="font-bold text-white border-b border-slate-800 pb-3">4. Fees Structure</h3>
            <p className="text-xs text-slate-400">Enter custom academic and facility fees. The total sum is computed automatically.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tuition Fee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Tuition Fee</label>
                <input 
                  name="tuitionFee" 
                  type="number" 
                  min="0"
                  step="0.1"
                  value={tuitionFee === 0 ? '' : tuitionFee} 
                  onChange={(e) => setTuitionFee(parseFloat(e.target.value) || 0)} 
                  placeholder="0.00" 
                  className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" 
                />
              </div>
              {/* Computer Fees */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Computer Fees</label>
                <input 
                  name="computerFee" 
                  type="number" 
                  min="0"
                  step="0.1"
                  value={computerFee === 0 ? '' : computerFee} 
                  onChange={(e) => setComputerFee(parseFloat(e.target.value) || 0)} 
                  placeholder="0.00" 
                  className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" 
                />
              </div>
              {/* VVN Fee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">VVN Fee</label>
                <input 
                  name="vvnFee" 
                  type="number" 
                  min="0"
                  step="0.1"
                  value={vvnFee === 0 ? '' : vvnFee} 
                  onChange={(e) => setVVNFee(parseFloat(e.target.value) || 0)} 
                  placeholder="0.00" 
                  className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" 
                />
              </div>
              {/* Computer Science Fee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Computer Science Fee</label>
                <input 
                  name="computerScienceFee" 
                  type="number" 
                  min="0"
                  step="0.1"
                  value={csFee === 0 ? '' : csFee} 
                  onChange={(e) => setCSFee(parseFloat(e.target.value) || 0)} 
                  placeholder="0.00" 
                  className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" 
                />
              </div>
              {/* Library Fee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Library Fee</label>
                <input 
                  name="libraryFee" 
                  type="number" 
                  min="0"
                  step="0.1"
                  value={libraryFee === 0 ? '' : libraryFee} 
                  onChange={(e) => setLibraryFee(parseFloat(e.target.value) || 0)} 
                  placeholder="0.00" 
                  className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" 
                />
              </div>
              {/* Project Fee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Project Fee</label>
                <input 
                  name="projectFee" 
                  type="number" 
                  min="0"
                  step="0.1"
                  value={projectFee === 0 ? '' : projectFee} 
                  onChange={(e) => setProjectFee(parseFloat(e.target.value) || 0)} 
                  placeholder="0.00" 
                  className="block w-full px-4 py-2.5 bg-slate-955 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-sm placeholder-slate-700" 
                />
              </div>
              {/* Total Fees */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Total Fees (Calculated)</label>
                <input 
                  name="totalFee" 
                  type="number" 
                  readOnly 
                  value={totalFees} 
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-brand-teal-500/30 focus:border-brand-teal-500 rounded-xl text-brand-teal-400 font-extrabold outline-none text-sm cursor-not-allowed" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Tab
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-505 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Next Step
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-8 py-2.5 bg-brand-teal-600 hover:bg-brand-teal-505 active:bg-brand-teal-700 disabled:bg-brand-teal-900 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Student Profile
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
