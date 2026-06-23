'use client'

import { useState } from 'react'
import { uploadStudyMaterial, deleteStudyMaterial } from '../actions'
import { 
  FileUp, Trash2, BookOpen, X, RefreshCw, 
  FileText, CheckCircle, AlertCircle, Plus, Eye, FolderOpen, Tag
} from 'lucide-react'

interface StudyMaterial {
  id: string
  title: string
  description: string | null
  classId: string
  subjectId: string
  content: string // Base64 encoded PDF
  fileName: string
  teacherId: string
  teacherName: string
  createdAt: any
  class: {
    name: string
  }
  subject: {
    name: string
    code: string
  }
}

interface ClassData {
  id: string
  name: string
}

interface SubjectData {
  id: string
  name: string
  code: string
}

interface MaterialsManagerProps {
  initialMaterials: StudyMaterial[]
  classes: ClassData[]
  subjects: SubjectData[]
  teacherId: string
  teacherName: string
}

export function MaterialsManager({ 
  initialMaterials, 
  classes, 
  subjects, 
  teacherId,
  teacherName 
}: MaterialsManagerProps) {
  const [materials, setMaterials] = useState<StudyMaterial[]>(initialMaterials)
  
  // Upload States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
  // Filters
  const [filterClassId, setFilterClassId] = useState('ALL')
  const [filterSubjectId, setFilterSubjectId] = useState('ALL')
  
  // Presenter Modal
  const [activeMaterial, setActiveMaterial] = useState<StudyMaterial | null>(null)
  const [presenterMode, setPresenterMode] = useState(false)

  // File loading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploadSuccess('')

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (fileExt !== 'pdf') {
      setUploadError('Only PDF files are supported for active classroom teaching presentation.')
      setFileName('')
      setContent('')
      return
    }

    setFileName(file.name)
    if (!title) {
      setTitle(file.name.substring(0, file.name.lastIndexOf('.')) || file.name)
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      // Read binary buffer, convert to base64
      const arrayBuffer = event.target?.result as ArrayBuffer
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      setContent(base64)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !classId || !subjectId || !content || !fileName) {
      setUploadError('Please fill in all fields and select a PDF file.')
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const res = await uploadStudyMaterial(
        title.trim(),
        description.trim(),
        classId,
        subjectId,
        content,
        fileName
      )

      if (res.error) {
        setUploadError(res.error)
      } else if (res.success && res.material) {
        setUploadSuccess('Material uploaded successfully!')
        
        // Append newly created material with relations mapped locally
        const newMat: StudyMaterial = {
          ...(res.material as any),
          class: {
            name: classes.find(c => c.id === classId)?.name || 'Class'
          },
          subject: {
            name: subjects.find(s => s.id === subjectId)?.name || 'Subject',
            code: subjects.find(s => s.id === subjectId)?.code || ''
          }
        }
        
        setMaterials([newMat, ...materials])
        
        // Reset inputs
        setTitle('')
        setDescription('')
        setFileName('')
        setContent('')
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this study material permanently?')) return

    try {
      const res = await deleteStudyMaterial(id)
      if (res.error) {
        alert(res.error)
      } else {
        setMaterials(prev => prev.filter(m => m.id !== id))
        if (activeMaterial?.id === id) {
          setActiveMaterial(null)
          setPresenterMode(false)
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete.')
    }
  }

  // Filter study notes
  const filteredMaterials = materials.filter(m => {
    const classMatch = filterClassId === 'ALL' || m.classId === filterClassId
    const subjectMatch = filterSubjectId === 'ALL' || m.subjectId === filterSubjectId
    return classMatch && subjectMatch
  })

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Upload Materials Panel */}
      <div className="xl:col-span-1">
        <div className="glass-dark border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileUp className="h-5 w-5 text-brand-teal-500" />
            Upload Study Material
          </h2>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {uploadError && (
              <div className="flex items-center gap-2.5 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="flex items-center gap-2.5 p-3 bg-teal-950/40 border border-teal-900/50 rounded-xl text-teal-200 text-xs">
                <CheckCircle className="h-4 w-4 text-brand-teal-500 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="material-title" className="text-xs font-semibold text-slate-400">
                Material Title
              </label>
              <input
                id="material-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Newton's Laws of Motion Notes"
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500/20 text-white rounded-xl text-xs outline-none placeholder-slate-650 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="material-desc" className="text-xs font-semibold text-slate-400">
                Description / Notes Details (Optional)
              </label>
              <textarea
                id="material-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of the content..."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-900/60 border border-slate-800 focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500/20 text-white rounded-xl text-xs outline-none placeholder-slate-655 transition-all resize-none"
              />
            </div>

            {/* Class Grade Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Select Class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-brand-teal-500 rounded-xl text-white outline-none text-xs cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">Select Subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            {/* PDF File Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Select PDF File</label>
              <div className="relative border border-dashed border-slate-800 hover:border-brand-teal-500/50 rounded-2xl bg-slate-900/20 hover:bg-slate-900/40 transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-750 group-hover:border-brand-teal-500/30 group-hover:bg-brand-teal-950/10 mb-2 transition-all">
                  <FileText className="h-5 w-5 text-slate-450 group-hover:text-brand-teal-500 transition-colors" />
                </div>
                {fileName ? (
                  <div>
                    <p className="text-xs font-bold text-slate-200 truncate max-w-[200px]">{fileName}</p>
                    <p className="text-[10px] text-brand-teal-500 font-bold uppercase tracking-wider mt-0.5">PDF Ready</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-350 font-medium">Select a PDF file</p>
                    <p className="text-[9px] text-slate-550 mt-0.5">Only supports .pdf files up to 20MB</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-teal-600 hover:bg-brand-teal-550 active:bg-brand-teal-700 text-white font-bold rounded-xl transition-all text-xs disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-teal-950/20 mt-6"
            >
              {isUploading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4.5 w-4.5" />
                  <span>Publish Study Material</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Grid Directory List */}
      <div className="xl:col-span-2 space-y-4">
        {/* Filters Header */}
        <div className="glass-dark border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
          <div className="flex items-center gap-2 shrink-0">
            <FolderOpen className="h-4.5 w-4.5 text-brand-teal-500" />
            <h3 className="text-sm font-bold text-white">Notes Library</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {/* Filter Class */}
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-955 border border-slate-800 text-xs text-white rounded-lg outline-none cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Filter Subject */}
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-955 border border-slate-800 text-xs text-white rounded-lg outline-none cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="glass-dark border border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
            <BookOpen className="h-12 w-12 text-slate-700 mb-3" />
            <p className="text-sm text-slate-400 font-bold">No study notes found matching filters.</p>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">Upload educational notes, lesson plans, or PDFs using the sidebar form to populate your classroom presenter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaterials.map((material) => (
              <div 
                key={material.id} 
                className="glass-dark border border-slate-850 hover:border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group border-l-4 border-l-brand-teal-500"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-brand-teal-400 bg-brand-teal-500/10 border border-brand-teal-555/20 shadow-inner">
                      <Tag className="h-3 w-3" />
                      {material.class.name} • {material.subject.name}
                    </span>

                    {/* Delete option */}
                    {(material.teacherId === teacherId || true) && (
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="text-slate-550 hover:text-red-400 p-1 rounded-lg hover:bg-slate-850 transition-colors cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-brand-teal-400 transition-colors leading-snug line-clamp-2">
                    {material.title}
                  </h3>
                  
                  {material.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                      {material.description}
                    </p>
                  )}
                  
                  <p className="text-[10px] text-slate-550 mt-3 font-semibold">
                    File: <span className="text-slate-400 font-mono truncate inline-block max-w-[150px] align-bottom">{material.fileName}</span>
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-slate-850/80 flex items-center justify-between">
                  <span className="text-[9px] text-slate-605 font-bold">
                    by {material.teacherName}
                  </span>

                  <button
                    onClick={() => {
                      setActiveMaterial(material)
                      setPresenterMode(true)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-855 hover:bg-slate-800 active:bg-slate-900 border border-slate-750 hover:border-brand-teal-500/40 text-slate-205 hover:text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-brand-teal-500" />
                    Open PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Projector PDF Presenter Modal */}
      {presenterMode && activeMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-955/98 flex flex-col animate-fade-in">
          {/* Header Bar */}
          <div className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="inline-flex px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-brand-teal-400 bg-brand-teal-500/10 border border-brand-teal-555/20">
                PDF Slide
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
                {activeMaterial.title} ({activeMaterial.class.name} • {activeMaterial.subject.name})
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Close Presenter */}
              <button
                onClick={() => {
                  setPresenterMode(false)
                  setActiveMaterial(null)
                }}
                className="p-2 bg-red-950/20 border border-red-900/40 hover:bg-red-900/40 text-red-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Close Presenter"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sandbox PDF Document Presenter View */}
          <div className="flex-1 w-full h-full bg-[#111827] relative overflow-hidden">
            <object 
              data={`data:application/pdf;base64,${activeMaterial.content}#toolbar=1&navpanes=0&scrollbar=1`} 
              type="application/pdf" 
              className="w-full h-full"
            >
              <iframe 
                src={`data:application/pdf;base64,${activeMaterial.content}`} 
                className="w-full h-full border-none" 
                title={activeMaterial.title}
              />
            </object>
          </div>
        </div>
      )}
    </div>
  )
}
