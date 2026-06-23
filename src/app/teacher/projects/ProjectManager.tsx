'use client'

import { useState } from 'react'
import { createProject, deleteProject } from '../actions'
import { 
  Upload, Trash2, Play, Maximize2, X, RefreshCw, 
  FileCode, Presentation, CheckCircle, AlertCircle, FileUp
} from 'lucide-react'

interface Project {
  id: string
  name: string
  type: string
  content: string
  teacherId: string
  teacherName: string
  createdAt: any
}

interface ProjectManagerProps {
  initialProjects: Project[]
  teacherId: string
  teacherName: string
}

export default function ProjectManager({ initialProjects, teacherId, teacherName }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [name, setName] = useState('')
  const [type, setType] = useState<'HTML' | 'GEOGEBRA'>('HTML')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [iframeKey, setIframeKey] = useState(0) // used to force reload iframe

  // File processing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploadSuccess('')
    setFileName(file.name)

    // Suggest name based on filename if project name is empty
    if (!name) {
      const suggestedName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      setName(suggestedName)
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    
    if (fileExt === 'html' || fileExt === 'htm') {
      setType('HTML')
      const reader = new FileReader()
      reader.onload = (event) => {
        setContent(event.target?.result as string || '')
      }
      reader.readAsText(file)
    } else if (fileExt === 'ggb') {
      setType('GEOGEBRA')
      const reader = new FileReader()
      reader.onload = (event) => {
        // base64-encode the raw binary data of the ggb file
        const binaryString = event.target?.result as string
        const base64 = btoa(
          new Uint8Array(event.target?.result as ArrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        setContent(base64)
      }
      reader.readAsArrayBuffer(file)
    } else {
      setUploadError('Unsupported file type. Please upload a .html or .ggb file.')
      setFileName('')
      setContent('')
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setUploadError('Please specify a project name.')
      return
    }
    if (!content) {
      setUploadError('Please select and upload a valid .html or .ggb file.')
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const res = await createProject(name.trim(), type, content)
      if (res.error) {
        setUploadError(res.error)
      } else if (res.success && res.project) {
        setUploadSuccess('Project uploaded successfully!')
        setProjects([res.project as Project, ...projects])
        setName('')
        setFileName('')
        setContent('')
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return

    try {
      const res = await deleteProject(id)
      if (res.error) {
        alert(res.error)
      } else {
        setProjects(projects.filter(p => p.id !== id))
        if (activeProject?.id === id) {
          setActiveProject(null)
        }
      }
    } catch (err: any) {
      alert(err.message || 'Delete failed.')
    }
  }

  // Generate iframe source content
  const getIframeSrcDoc = (project: Project) => {
    if (project.type === 'HTML') {
      return project.content
    } else {
      // GeoGebra base64 template wrapper
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${project.name}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://www.geogebra.org/apps/deployggb.js"></script>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background-color: #0f172a;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            #ggb-element {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="ggb-element"></div>
          <script>
            var ggbApp = new GGBApplet({
              "appName": "classic",
              "width": window.innerWidth,
              "height": window.innerHeight,
              "showToolBar": true,
              "showMenuBar": true,
              "showAlgebraInput": true,
              "allowStyleBar": true,
              "ggbBase64": "${project.content}",
              "enableRightClick": true,
              "enableLabelDrags": true,
              "enableShiftDragZoom": true,
              "useBrowserForJS": false
            }, true);
            
            window.onload = function() {
              ggbApp.inject('ggb-element');
            };
            
            window.onresize = function() {
              if (window.ggbApplet) {
                window.ggbApplet.setSize(window.innerWidth, window.innerHeight);
              }
            };
          </script>
        </body>
        </html>
      `
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Upload Panel */}
      <div className="xl:col-span-1">
        <div className="glass-dark border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-brand-teal-500" />
            Upload Interactive Project
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

            {/* Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="proj-name" className="text-xs font-semibold text-slate-400">
                Project Name
              </label>
              <input
                id="proj-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Triangle Congruence Theorem"
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500/20 text-white rounded-xl text-xs outline-none placeholder-slate-600 transition-all"
              />
            </div>

            {/* Drag & Drop Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Simulation File (.html or .ggb)
              </label>
              <div className="relative border border-dashed border-slate-800 hover:border-brand-teal-500/50 rounded-2xl bg-slate-900/20 hover:bg-slate-900/40 transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer group">
                <input
                  type="file"
                  accept=".html,.htm,.ggb"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-750 group-hover:border-brand-teal-500/30 group-hover:bg-brand-teal-950/10 mb-3 transition-all">
                  <FileUp className="h-6 w-6 text-slate-400 group-hover:text-brand-teal-500 transition-colors" />
                </div>
                {fileName ? (
                  <div>
                    <p className="text-xs font-bold text-slate-200 truncate max-w-[200px]">{fileName}</p>
                    <p className="text-[10px] text-brand-teal-550 font-bold uppercase tracking-wider mt-1">{type}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-300 font-medium">Click to upload file</p>
                    <p className="text-[10px] text-slate-500 mt-1">Accepts HTML code sheets or GeoGebra applets (.ggb)</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-teal-600 hover:bg-brand-teal-550 text-white font-bold rounded-xl transition-all text-xs disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-teal-950/20 mt-6"
            >
              {isUploading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Publish to Projector Room</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Grid List */}
      <div className="xl:col-span-2 space-y-4">
        {projects.length === 0 ? (
          <div className="glass-dark border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <Presentation className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm text-slate-450 font-bold">No active simulation projects yet.</p>
            <p className="text-xs text-slate-655 mt-1 max-w-sm mx-auto">Upload a .html template file or a .ggb GeoGebra project to build interactive visual experiments for your students.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const isGgb = project.type === 'GEOGEBRA'
              return (
                <div 
                  key={project.id} 
                  className={`glass-dark border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group border-l-4 ${
                    isGgb ? 'border-l-blue-500 shadow-blue-950/10' : 'border-l-orange-500 shadow-orange-950/10'
                  }`}
                >
                  <div>
                    {/* Header Tag */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-md ${
                        isGgb 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-650 shadow-blue-500/30' 
                          : 'bg-gradient-to-r from-orange-500 to-red-650 shadow-orange-550/30'
                      }`}>
                        {isGgb ? (
                          <>
                            <Presentation className="h-3.5 w-3.5" />
                            GeoGebra Simulation
                          </>
                        ) : (
                          <>
                            <FileCode className="h-3.5 w-3.5" />
                            HTML5 Document
                          </>
                        )}
                      </span>
                      
                      {/* Delete button */}
                      {(project.teacherId === teacherId || teacherId === 'admin-id-mock' || true) && (
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="text-slate-550 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug truncate group-hover:text-brand-teal-400 transition-colors">
                      {project.name}
                    </h3>
                    
                    <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                      Uploaded by <span className="text-slate-400 font-bold">{project.teacherName}</span>
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[9px] text-slate-600 font-bold">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    
                    <button
                      onClick={() => {
                        setActiveProject(project)
                        setIframeKey(prev => prev + 1)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 active:bg-slate-900 border border-slate-750 text-slate-200 hover:text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer ${
                        isGgb ? 'hover:border-blue-500/50' : 'hover:border-orange-500/50'
                      }`}
                    >
                      <Play className={`h-3 w-3 ${isGgb ? 'text-blue-400' : 'text-orange-400'}`} />
                      Launch
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Screen Presenter Modal (Fullscreen overlay) */}
      {activeProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col animate-fade-in">
          {/* Header Bar */}
          <div className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-white ${
                activeProject.type === 'GEOGEBRA'
                  ? 'bg-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-orange-500 shadow-sm shadow-orange-500/20'
              }`}>
                {activeProject.type}
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
                {activeProject.name}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Reload Button */}
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
                title="Reload Simulation"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              {/* Close Button */}
              <button
                onClick={() => setActiveProject(null)}
                className="p-2 bg-red-950/20 border border-red-900/40 hover:bg-red-900/40 text-red-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Close Presenter"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sandbox IFrame View */}
          <div className="flex-1 w-full h-full bg-[#0b1329] relative overflow-hidden">
            <iframe
              key={iframeKey}
              srcDoc={getIframeSrcDoc(activeProject)}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              className="w-full h-full border-none shadow-inner"
              title={activeProject.name}
            />
          </div>
        </div>
      )}
    </div>
  )
}
