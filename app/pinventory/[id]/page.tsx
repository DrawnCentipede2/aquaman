'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, ArrowLeft, ExternalLink, ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import CloudLoader from '@/components/CloudLoader'
import type { PinPack } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface PinPlace {
  id: string
  title: string
  description: string
  google_maps_url: string
  photos: string[]
}

export default function PurchasedPackDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string

  const [pack, setPack] = useState<PinPack | null>(null)
  const [pins, setPins] = useState<PinPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      // fetch pack
      const { data: packData } = await supabase.from('pin_packs').select('*').eq('id', packId).single()
      setPack(packData)
      // fetch pins
      const { data: pinsData } = await supabase
        .from('pin_pack_pins')
        .select(`
          pins(id,title,description,google_maps_url,photos)
        `)
        .eq('pin_pack_id', packId)

      const parsedPins: PinPlace[] = (pinsData || []).map((row: any) => ({
        id: row.pins.id,
        title: row.pins.title,
        description: row.pins.description,
        google_maps_url: row.pins.google_maps_url,
        photos: row.pins.photos || []
      }))
      setPins(parsedPins)
    } catch (e) {
      logger.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (packId) loadData()
  }, [packId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-25">
        <CloudLoader size="lg" text="Loading pack details..." />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-25 text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Pack not found</h2>
        <button onClick={() => router.back()} className="btn-secondary">Go back</button>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gray-25 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{pack.title}</h1>
        <p className="text-gray-600 mb-6">{pack.description}</p>

        {/* Places list */}
        <div className="space-y-4">
          {pins.map((pin, index) => {
            const isOpen = openIndex === index
            return (
              <div key={pin.id} className="border border-gray-200 rounded-xl bg-white">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-coral-500 text-white rounded-full text-xs font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900 line-clamp-1 mr-2">{pin.title}</span>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Photo */}
                      {pin.photos && pin.photos.length > 0 ? (
                        <img
                          src={pin.photos[0]}
                          alt={pin.title}
                          onClick={() => setZoomSrc(pin.photos[0])}
                          title="Click to zoom"
                          className="cursor-zoom-in w-full md:w-40 md:h-40 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-full md:w-40 md:h-40 bg-gray-100 flex items-center justify-center rounded-lg flex-shrink-0">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      {/* Description & action */}
                      <div className="flex-1 space-y-4">
                        <p className="text-gray-700 whitespace-pre-line">
                          {pin.description || 'No description provided.'}
                        </p>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>

    {/* Zoom modal */}
    {zoomSrc && (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setZoomSrc(null)}>
        <div className="relative max-w-3xl w-full">
          <button onClick={() => setZoomSrc(null)} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
            <X className="h-5 w-5 text-gray-700" />
          </button>
          <img src={zoomSrc || ''} alt="Zoom" className="w-full h-auto rounded-lg object-contain" />
        </div>
      </div>
    )}
    </>
  )
}