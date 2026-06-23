import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { IDCardPreview } from './IDCardPreview'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function IDCardPage({ params }: PageProps) {
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

  return (
    <div className="max-w-4xl mx-auto py-6">
      <IDCardPreview student={student} />
    </div>
  )
}
