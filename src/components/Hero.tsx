'use client'

import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useCmsSiteMedia } from '@/hooks/useCmsSiteMedia'

gsap.registerPlugin(ScrollTrigger)

const labels = [
  { text: 'Ideas, made visible', className: 'hero-sequence__label--one' },
  { text: 'Visuals with intention', className: 'hero-sequence__label--two' },
  { text: 'Designed to be remembered', className: 'hero-sequence__label--three' },
]

interface HeroProps {
  frames: string[]
}

function createHeroTimeline(
  section: HTMLElement,
  stage: HTMLDivElement,
  sequence?: { frame: number },
  frameCount = 1,
  renderFrame?: (frame: number) => void
) {
  return gsap.context(() => {
    const letters = gsap.utils.toArray<HTMLElement>('.hero-sequence__letter')
    const labelElements = gsap.utils.toArray<HTMLElement>('.hero-sequence__label')
    const timelineDriver = sequence ?? { frame: 0 }

    gsap.set(letters, { opacity: 0, yPercent: 115, rotateX: -70 })
    gsap.set(labelElements, { opacity: 0, y: 16 })
    gsap.set('.hero-sequence__signature', { opacity: 0, clipPath: 'inset(0 100% 0 0)' })

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.15,
        pin: stage,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })

    timeline.to(timelineDriver, {
      frame: frameCount - 1,
      duration: 1,
      onUpdate: () => renderFrame?.(timelineDriver.frame),
    }, 0)
    timeline.to('.hero-sequence__intro', { opacity: 0, yPercent: -24, filter: 'blur(8px)', duration: 0.14 }, 0.03)
    letters.forEach((letter, index) => {
      timeline.to(letter, { opacity: 1, yPercent: 0, rotateX: 0, duration: 0.105, ease: 'power3.out' }, 0.18 + index * 0.055)
    })
    timeline.to('.hero-sequence__signature', {
      opacity: 1,
      clipPath: 'inset(0 0% 0 0)',
      duration: 0.12,
      ease: 'power2.out',
    }, 0.53)
    timeline.to(labelElements, { opacity: 1, y: 0, duration: 0.08, stagger: 0.025, ease: 'power2.out' }, 0.61)
    timeline.to(labelElements, { opacity: 0, y: -12, duration: 0.08, stagger: 0.015 }, 0.79)
    timeline.to('.hero-sequence__card', { scale: 1.06, yPercent: -4, duration: 0.06, ease: 'power2.in' }, 0.94)
    timeline.to('.hero-sequence__word', {
      letterSpacing: '0.12em',
      opacity: 0,
      yPercent: -24,
      duration: 0.06,
    }, 0.94)
  }, section)
}

export function Hero({ frames }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { items: siteMedia, loading: siteMediaLoading } = useCmsSiteMedia()
  const heroMedia = siteMedia.find((item) => item.slot === 'hero')

  useLayoutEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current

    if (!section || !stage || siteMediaLoading) return
    if (heroMedia) {
      const ctx = createHeroTimeline(section, stage)
      return () => ctx.revert()
    }

    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    type DeviceNavigator = Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
      deviceMemory?: number
    }

    const device = navigator as DeviceNavigator
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const prefersDataSavings = Boolean(device.connection?.saveData)
    const hasSlowConnection = /(^|-)2g$/.test(device.connection?.effectiveType ?? '')
    const isLowMemory = typeof device.deviceMemory === 'number' && device.deviceMemory <= 4
    const hasFewCpuCores = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4
    const isConstrained = prefersDataSavings || hasSlowConnection || isLowMemory || hasFewCpuCores

    // Mobile and constrained devices keep every second or third source frame. Progress
    // still spans the entire sequence, but decoded-image RAM and network work are reduced.
    const frameStride = prefersDataSavings || hasSlowConnection
      ? 3
      : isMobile || isLowMemory
        ? 2
        : 1
    const sequenceFrames = frames.filter(
      (_, index) => index % frameStride === 0 || index === frames.length - 1
    )
    const frameCount = sequenceFrames.length
    if (!frameCount) return

    const images: Array<HTMLImageElement | undefined> = new Array(frameCount)
    const decodedFrames = new Set<number>()
    const sequence = { frame: 0 }
    const loadQueue: number[] = []
    const queuedFrames = new Set<number>()
    const loadingFrames = new Set<number>()
    const preloadRadius = isMobile ? 5 : 10
    const maxConcurrentLoads = prefersDataSavings ? 4 : isMobile ? 6 : 10
    let activeLoads = 0
    let lastDrawnFrame = -1
    let requestedFrame = 0
    let renderRequest = 0
    let isDisposed = false

    // Draw only decoded images, preserving object-fit: cover without DOM layout work.
    const render = () => {
      renderRequest = 0
      const frame = Math.max(0, Math.min(frameCount - 1, requestedFrame))
      let drawableFrame = frame
      let image = images[drawableFrame]

      // Keep the last nearby decoded image visible if the exact frame is still loading.
      if (!image || !decodedFrames.has(drawableFrame)) {
        for (let offset = 1; offset < frameCount; offset += 1) {
          const previous = images[frame - offset]
          const next = images[frame + offset]
          if (previous && decodedFrames.has(frame - offset)) {
            image = previous
            drawableFrame = frame - offset
            break
          }
          if (next && decodedFrames.has(frame + offset)) {
            image = next
            drawableFrame = frame + offset
            break
          }
        }
      }

      if (!image?.naturalWidth || drawableFrame === lastDrawnFrame) return

      const canvasRatio = canvas.width / canvas.height
      const imageRatio = image.naturalWidth / image.naturalHeight
      let sourceX = 0
      let sourceY = 0
      let sourceWidth = image.naturalWidth
      let sourceHeight = image.naturalHeight

      if (imageRatio > canvasRatio) {
        sourceWidth = image.naturalHeight * canvasRatio
        sourceX = (image.naturalWidth - sourceWidth) / 2
      } else {
        sourceHeight = image.naturalWidth / canvasRatio
        sourceY = (image.naturalHeight - sourceHeight) / 2
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      )
      lastDrawnFrame = drawableFrame
    }

    // Scroll, decode, and resize events can happen together. Coalesce them into one paint.
    const requestRender = (force = false) => {
      if (force) lastDrawnFrame = -1
      if (renderRequest) return
      renderRequest = window.requestAnimationFrame(render)
    }

    const waitForImageLoad = (image: HTMLImageElement) =>
      new Promise<void>((resolve, reject) => {
        if (image.complete) {
          image.naturalWidth ? resolve() : reject(new Error('Frame failed to load'))
          return
        }
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Frame failed to load'))
      })

    const loadFrame = async (index: number) => {
      const image = new Image()
      image.decoding = 'async'
      image.fetchPriority = index === 0 ? 'high' : 'auto'
      images[index] = image
      image.src = sequenceFrames[index]

      // decode() forces decompression before scroll-time drawImage(). The load fallback
      // covers browsers that reject decode() even though the image itself loaded correctly.
      try {
        await image.decode()
      } catch {
        await waitForImageLoad(image)
      }

      if (isDisposed || !image.naturalWidth) return
      decodedFrames.add(index)
      if (Math.abs(index - requestedFrame) <= preloadRadius || index === 0) requestRender()
    }

    const pumpLoadQueue = () => {
      while (!isDisposed && activeLoads < maxConcurrentLoads && loadQueue.length) {
        const index = loadQueue.shift()
        if (index === undefined) break
        queuedFrames.delete(index)

        if (decodedFrames.has(index) || loadingFrames.has(index)) continue
        loadingFrames.add(index)
        activeLoads += 1

        void loadFrame(index).catch(() => {
          images[index] = undefined
        }).finally(() => {
          loadingFrames.delete(index)
          activeLoads -= 1
          if (!isDisposed) pumpLoadQueue()
        })
      }
    }

    const queueFrame = (index: number, urgent = false) => {
      if (
        index < 0 ||
        index >= frameCount ||
        decodedFrames.has(index) ||
        loadingFrames.has(index) ||
        (queuedFrames.has(index) && !urgent)
      ) return

      // Promote frames around a fast scroll jump ahead of background loading.
      if (queuedFrames.has(index)) {
        const queuedIndex = loadQueue.indexOf(index)
        if (queuedIndex >= 0) loadQueue.splice(queuedIndex, 1)
      }
      urgent ? loadQueue.unshift(index) : loadQueue.push(index)
      queuedFrames.add(index)
    }

    const prepareFramesAround = (frame: number) => {
      const roundedFrame = Math.round(frame)
      requestedFrame = roundedFrame

      // Current and nearby frames take priority over progressive sequential preloading.
      for (let offset = preloadRadius; offset >= 1; offset -= 1) {
        queueFrame(roundedFrame + offset, true)
        queueFrame(roundedFrame - offset, true)
      }
      queueFrame(roundedFrame, true)
      pumpLoadQueue()
      requestRender()
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      // Cap physical canvas pixels to reduce GPU fill cost on low-end devices.
      const dprCap = isConstrained ? 1 : isMobile ? 1.25 : 1.5
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      const width = Math.max(1, Math.round(rect.width * dpr))
      const height = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width === width && canvas.height === height) return
      canvas.width = width
      canvas.height = height
      requestRender(true)
    }

    // Frame zero is eager/high-priority. The sampled remainder decodes progressively with
    // bounded concurrency, so page interactivity never waits for the full sequence.
    queueFrame(0, true)
    for (let index = 1; index < frameCount; index += 1) queueFrame(index)
    pumpLoadQueue()

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)
    resizeCanvas()

    const ctx = createHeroTimeline(section, stage, sequence, frameCount, prepareFramesAround)

    return () => {
      isDisposed = true
      if (renderRequest) window.cancelAnimationFrame(renderRequest)
      loadQueue.length = 0
      queuedFrames.clear()
      decodedFrames.clear()
      resizeObserver.disconnect()
      ctx.revert()
      images.forEach((image) => {
        if (!image) return
        image.onload = null
        image.onerror = null
        image.src = ''
      })
    }
  }, [frames, heroMedia, siteMediaLoading])

  return (
    <section ref={sectionRef} className="hero-sequence" data-theme="dark" aria-label="Picarview introduction">
      <div ref={stageRef} className="hero-sequence__stage">
        <div className="hero-sequence__card">
          {heroMedia?.mediaType === 'video' ? (
            <video
              className="hero-sequence__custom-media"
              src={heroMedia.mediaUrl}
              aria-label={heroMedia.altText}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : heroMedia?.mediaType === 'image' ? (
            <img
              className="hero-sequence__custom-media"
              src={heroMedia.mediaUrl}
              alt={heroMedia.altText}
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <canvas ref={canvasRef} className="hero-sequence__canvas" aria-hidden="true" />
          )}
          <div className="hero-sequence__shade" aria-hidden="true" />

          <header className="hero-sequence__intro">
            <p>Every idea deserves a visual voice</p>
            <h1>Imagine boldly. <span>Design</span> with purpose.</h1>
          </header>

          <div className="hero-sequence__word" aria-label="Picarview">
            {'PICARVIEW'.split('').map((letter, index) => (
              <span className="hero-sequence__letter" key={`${letter}-${index}`} aria-hidden="true">
                {letter}
              </span>
            ))}
          </div>

          <div className="hero-sequence__signature" aria-hidden="true">
            Create your view
          </div>

          <div className="hero-sequence__labels" aria-hidden="true">
            {labels.map((label) => (
              <span className={`hero-sequence__label ${label.className}`} key={label.text}>
                <i />{label.text}
              </span>
            ))}
          </div>

          <div className="hero-sequence__meta" aria-hidden="true">
            <span>001 — {String(frames.length).padStart(3, '0')}</span>
            <span>Scroll to compose</span>
          </div>
        </div>
      </div>
    </section>
  )
}
