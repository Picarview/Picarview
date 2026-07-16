'use client'

import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const labels = [
  { text: 'Ideas, made visible', className: 'hero-sequence__label--one' },
  { text: 'Visuals with intention', className: 'hero-sequence__label--two' },
  { text: 'Designed to be remembered', className: 'hero-sequence__label--three' },
]

interface HeroProps {
  frames: string[]
}

export function Hero({ frames }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: false })

    if (!section || !stage || !canvas || !context) return

    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const prefersDataSavings = 'connection' in navigator &&
      Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

    // Phones use every second source frame. The scroll mapping remains continuous while
    // network transfer and UHD decoding are nearly halved.
    const sequenceFrames = isMobile || prefersDataSavings
      ? frames.filter((_, index) => index % 2 === 0 || index === frames.length - 1)
      : frames
    const frameCount = sequenceFrames.length
    if (!frameCount) return

    const images: Array<HTMLImageElement | undefined> = new Array(frameCount)
    const sequence = { frame: 0 }
    const loadQueue: number[] = []
    const queuedFrames = new Set<number>()
    const loadingFrames = new Set<number>()
    const preloadRadius = isMobile ? 6 : 12
    const cacheRadius = isMobile ? 12 : 20
    const maxConcurrentLoads = isMobile ? 2 : 4
    let activeLoads = 0
    let lastDrawnFrame = -1
    let isDisposed = false

    // Draw the current frame at device resolution while preserving its 16:9 crop.
    const render = () => {
      const frame = Math.max(0, Math.min(frameCount - 1, Math.round(sequence.frame)))
      let drawableFrame = frame
      let image = images[drawableFrame]

      // Keep the last nearby decoded image visible if the exact frame is still loading.
      if (!image?.complete || !image.naturalWidth) {
        for (let offset = 1; offset <= preloadRadius; offset += 1) {
          const previous = images[frame - offset]
          const next = images[frame + offset]
          if (previous?.complete && previous.naturalWidth) {
            image = previous
            drawableFrame = frame - offset
            break
          }
          if (next?.complete && next.naturalWidth) {
            image = next
            drawableFrame = frame + offset
            break
          }
        }
      }

      if (!image?.complete || !image.naturalWidth || drawableFrame === lastDrawnFrame) return

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

    const pumpLoadQueue = () => {
      while (!isDisposed && activeLoads < maxConcurrentLoads && loadQueue.length) {
        const index = loadQueue.shift()
        if (index === undefined) break
        queuedFrames.delete(index)

        if (images[index] || loadingFrames.has(index)) continue

        const image = new Image()
        image.decoding = 'async'
        images[index] = image
        loadingFrames.add(index)
        activeLoads += 1

        const finish = () => {
          loadingFrames.delete(index)
          activeLoads -= 1
          if (!isDisposed) pumpLoadQueue()
        }

        image.onload = () => {
          if (!isDisposed && Math.abs(index - Math.round(sequence.frame)) <= preloadRadius) render()
          finish()
        }
        image.onerror = () => {
          images[index] = undefined
          finish()
        }
        image.src = sequenceFrames[index]
      }
    }

    const queueFrame = (index: number) => {
      if (
        index < 0 ||
        index >= frameCount ||
        images[index] ||
        loadingFrames.has(index) ||
        queuedFrames.has(index)
      ) return

      loadQueue.push(index)
      queuedFrames.add(index)
    }

    const prepareFramesAround = (frame: number) => {
      const roundedFrame = Math.round(frame)

      // Re-prioritize pending work around the newest scroll position.
      loadQueue.length = 0
      queuedFrames.clear()
      queueFrame(roundedFrame)
      for (let offset = 1; offset <= preloadRadius; offset += 1) {
        queueFrame(roundedFrame + offset)
        queueFrame(roundedFrame - offset)
      }
      pumpLoadQueue()

      // Release distant decoded images. Browser HTTP caching makes reverse scrolling inexpensive.
      images.forEach((image, index) => {
        if (image && !loadingFrames.has(index) && Math.abs(index - roundedFrame) > cacheRadius) {
          image.onload = null
          image.onerror = null
          images[index] = undefined
        }
      })
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      // Mobile uses 1x while desktop retains a modest Retina boost.
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.25)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      lastDrawnFrame = -1
      render()
    }

    // Prime the opening frames; the rolling cache follows the user's scroll position.
    for (let index = 0; index < Math.min(isMobile ? 8 : 16, frameCount); index += 1) queueFrame(index)
    pumpLoadQueue()

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)
    resizeCanvas()

    const ctx = gsap.context(() => {
      const letters = gsap.utils.toArray<HTMLElement>('.hero-sequence__letter')
      const labelElements = gsap.utils.toArray<HTMLElement>('.hero-sequence__label')

      gsap.set(letters, { opacity: 0, yPercent: 115, rotateX: -70 })
      gsap.set(labelElements, { opacity: 0, y: 16 })
      gsap.set('.hero-sequence__signature', { opacity: 0, clipPath: 'inset(0 100% 0 0)' })

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          pin: stage,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // This tween spans the entire timeline, giving scroll position a 1:1 frame map.
      timeline.to(sequence, {
        frame: frameCount - 1,
        duration: 1,
        onUpdate: () => {
          prepareFramesAround(sequence.frame)
          render()
        },
      }, 0)

      timeline.to(
        '.hero-sequence__intro',
        { opacity: 0, yPercent: -24, filter: 'blur(8px)', duration: 0.14 },
        0.03
      )

      letters.forEach((letter, index) => {
        timeline.to(
          letter,
          { opacity: 1, yPercent: 0, rotateX: 0, duration: 0.105, ease: 'power3.out' },
          0.18 + index * 0.055
        )
      })

      timeline.to(
        '.hero-sequence__signature',
        { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.12, ease: 'power2.out' },
        0.53
      )

      timeline.to(
        labelElements,
        { opacity: 1, y: 0, duration: 0.08, stagger: 0.025, ease: 'power2.out' },
        0.61
      )
      timeline.to(labelElements, { opacity: 0, y: -12, duration: 0.08, stagger: 0.015 }, 0.79)

      // The whole card clears the viewport to reveal the content that follows.
      timeline.to(
        '.hero-sequence__card',
        { scale: 1.06, yPercent: -4, duration: 0.06, ease: 'power2.in' },
        0.94
      )
      timeline.to(
        '.hero-sequence__word',
        { letterSpacing: '0.12em', opacity: 0, yPercent: -24, duration: 0.06 },
        0.94
      )
    }, section)

    return () => {
      isDisposed = true
      loadQueue.length = 0
      queuedFrames.clear()
      resizeObserver.disconnect()
      ctx.revert()
      images.forEach((image) => {
        if (!image) return
        image.onload = null
        image.onerror = null
        image.src = ''
      })
    }
  }, [frames])

  return (
    <section ref={sectionRef} className="hero-sequence" data-theme="dark" aria-label="Picarview introduction">
      <div ref={stageRef} className="hero-sequence__stage">
        <div className="hero-sequence__card">
          <canvas ref={canvasRef} className="hero-sequence__canvas" aria-hidden="true" />
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
